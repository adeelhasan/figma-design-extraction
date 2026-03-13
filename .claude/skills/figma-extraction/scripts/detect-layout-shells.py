#!/usr/bin/env python3
"""
detect-layout-shells.py - Vision-based layout shell detection

Detects shared visual shells (sidebar, navbar, footer) across screenshots
using SSIM comparison of edge strips. Also provides grid visualization
for debugging layout analysis.

Usage:
    # Detect shared shells across all screenshots
    python3 detect-layout-shells.py detect \
      --screenshots-dir design-system/preview/layouts/screenshots/ \
      --threshold 0.90

    # Grid visualization for testing
    python3 detect-layout-shells.py grid \
      --screenshot design-system/preview/layouts/screenshots/Dashboard.png \
      --cols 12 --rows 8 \
      --output grid-overlay.png
"""

import argparse
import json
import sys
from pathlib import Path

try:
    import numpy as np
    from PIL import Image, ImageDraw
    from skimage.metrics import structural_similarity as ssim
except ImportError as e:
    print(json.dumps({
        "success": False,
        "error": f"Missing dependency: {e}. Install with: pip install Pillow numpy scikit-image"
    }), file=sys.stderr)
    sys.exit(1)


# --- Detection constants ---
# All pixel-value thresholds assume 8-bit (0-255) PNG input.

MIN_SHELL_SIZE = 60            # px — smallest shell to detect (accommodates mobile headers 44-56px + margin)
MAX_COMPARISON_HEIGHT = 2000   # px — cap strip height for SSIM performance
BOUNDARY_WINDOW = 15           # px — sliding window for variance boundary scan
VARIANCE_FLOOR_LOW = 20        # Cross-image brightness variance: "shell region" ceiling
VARIANCE_FLOOR_HIGH = 30       # Cross-image brightness variance: "content region" floor
VARIANCE_JUMP_MIN = 10         # Minimum absolute variance to count as a boundary jump
VARIANCE_JUMP_RATIO = 3        # Ratio required for boundary detection (after/before)
TRANSITION_THRESHOLD = 5       # Brightness delta to count as a row-transition
OUTLIER_VAR_BAND = (0.35, 2.85)    # Row-variance ratio band for shell verification (log-symmetric around 1.0)
OUTLIER_TRANS_BAND = (0.45, 2.2)   # Transition-count ratio band for shell verification
REFINE_STEP = 10               # px — step size for shell size refinement scan
DOWNSAMPLE_FACTOR = 4          # Structural SSIM downsample factor

# --- Grid classification constants ---
CELL_VARIANCE_SOLID = 10       # Below this = solid/empty fill
CELL_BRIGHTNESS_EMPTY = 250    # Above this mean = empty (white) vs solid (colored)
CELL_EDGE_DENSITY_TEXT = 15    # Above this + low color diversity = text
CELL_COLOR_DIVERSITY_TEXT = 100     # Below this + high edge density = text
CELL_COLOR_DIVERSITY_IMAGE = 500   # Above this = photograph/image


# --- Shared utilities ---

def load_screenshots(directory):
    """Load all PNGs from directory, convert RGBA -> RGB.

    Returns dict[str, ndarray] keyed by stem name (e.g. "Dashboard").
    """
    screenshots = {}
    dir_path = Path(directory)
    if not dir_path.is_dir():
        print(f"Error: {directory} is not a directory", file=sys.stderr)
        return screenshots

    for png in sorted(dir_path.glob("*.png")):
        img = Image.open(png).convert("RGB")
        screenshots[png.stem] = np.array(img)

    return screenshots


def extract_strip(image, edge, size):
    """Extract an edge strip from an image array.

    Args:
        image: ndarray (H, W, 3)
        edge: one of "left", "top", "bottom", "right"
        size: pixel width/height of strip

    Returns:
        ndarray strip
    """
    h, w = image.shape[:2]

    if edge == "left":
        actual = min(size, w)
        return image[:, :actual, :]
    elif edge == "right":
        actual = min(size, w)
        return image[:, w - actual:, :]
    elif edge == "top":
        actual = min(size, h)
        return image[:actual, :, :]
    elif edge == "bottom":
        actual = min(size, h)
        return image[h - actual:, :, :]
    else:
        raise ValueError(f"Unknown edge: {edge}")


def normalize_strips(strips, edge):
    """Resize strips to common dimensions for SSIM comparison.

    For left/right strips: resize all to (min_height, strip_width).
    For top/bottom strips: resize all to (strip_height, min_width).
    Cap at 2000px on the varying axis for performance.

    Args:
        strips: dict[str, ndarray]
        edge: "left", "right", "top", or "bottom"

    Returns:
        dict[str, ndarray] with all strips at the same dimensions
    """
    if not strips:
        return {}

    if edge in ("left", "right"):
        min_h = min(s.shape[0] for s in strips.values())
        min_h = min(min_h, MAX_COMPARISON_HEIGHT)
        target_w = list(strips.values())[0].shape[1]
        target_size = (target_w, min_h)  # PIL uses (w, h)
    else:
        min_w = min(s.shape[1] for s in strips.values())
        min_w = min(min_w, MAX_COMPARISON_HEIGHT)
        target_h = list(strips.values())[0].shape[0]
        target_size = (min_w, target_h)

    normalized = {}
    for name, strip in strips.items():
        img = Image.fromarray(strip)
        if img.size != target_size:
            img = img.resize(target_size, Image.LANCZOS)
        normalized[name] = np.array(img)

    return normalized


def compute_ssim_matrix(strips):
    """Compute pairwise SSIM for a set of normalized strips.

    Returns:
        (matrix, names) where matrix[i][j] is SSIM between names[i] and names[j]
    """
    names = sorted(strips.keys())
    n = len(names)
    matrix = np.ones((n, n), dtype=float)

    for i in range(n):
        for j in range(i + 1, n):
            score = ssim(strips[names[i]], strips[names[j]], channel_axis=2)
            matrix[i][j] = score
            matrix[j][i] = score

    return matrix, names


def compute_structural_ssim_matrix(strips):
    """Compute pairwise SSIM on downsampled grayscale strips.

    More tolerant of localized color changes (e.g. active nav item highlights)
    while still detecting structural similarity (same sidebar layout).

    Returns:
        (matrix, names) where matrix[i][j] is structural SSIM
    """
    names = sorted(strips.keys())
    n = len(names)
    matrix = np.ones((n, n), dtype=float)

    # Downsample and convert to grayscale
    processed = {}
    for name, strip in strips.items():
        img = Image.fromarray(strip).convert("L")
        w, h = img.size
        img = img.resize((max(w // DOWNSAMPLE_FACTOR, 1), max(h // DOWNSAMPLE_FACTOR, 1)), Image.LANCZOS)
        processed[name] = np.array(img)

    for i in range(n):
        for j in range(i + 1, n):
            a, b = processed[names[i]], processed[names[j]]
            # Ensure same dimensions (should be after normalize, but be safe)
            min_h = min(a.shape[0], b.shape[0])
            min_w = min(a.shape[1], b.shape[1])
            a = a[:min_h, :min_w]
            b = b[:min_h, :min_w]
            # win_size must be odd and <= smallest dimension
            win = min(7, min_h, min_w)
            if win % 2 == 0:
                win -= 1
            if win < 3:
                score = 1.0 if np.allclose(a, b) else 0.0
            else:
                score = ssim(a, b, win_size=win)
            matrix[i][j] = score
            matrix[j][i] = score

    return matrix, names


def cluster_by_ssim(matrix, names, threshold):
    """Cluster names by SSIM using union-find (single-linkage).

    Only returns clusters with 2+ members.

    Returns:
        list of lists of names
    """
    n = len(names)
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(a, b):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb

    for i in range(n):
        for j in range(i + 1, n):
            if matrix[i][j] >= threshold:
                union(i, j)

    clusters = {}
    for i in range(n):
        root = find(i)
        clusters.setdefault(root, []).append(names[i])

    return [sorted(members) for members in clusters.values() if len(members) >= 2]


def detect_boundary(images, edge):
    """Detect the boundary position where a shell region ends.

    Uses column-wise (for left/right) or row-wise (for top/bottom) variance
    analysis across multiple images. Where the variance profile shows a
    consistent step change, that's the shell boundary.

    Args:
        images: dict[str, ndarray] — the full screenshots
        edge: "left", "right", "top", "bottom"

    Returns:
        int — boundary position in pixels, or 0 if no clear boundary found
    """
    profiles = []
    for img in images.values():
        gray = np.mean(img, axis=2)  # (H, W)
        if edge in ("left", "right"):
            profile = np.mean(gray, axis=0)
        else:
            profile = np.mean(gray, axis=1)
        profiles.append(profile)

    min_len = min(len(p) for p in profiles)
    profiles = [p[:min_len] for p in profiles]
    profiles = np.array(profiles)  # (N, L)

    # Cross-image variance: low = consistent shell region, high = varying content
    cross_var = np.var(profiles, axis=0)  # (L,)

    if edge in ("left", "top"):
        for i in range(BOUNDARY_WINDOW, min(min_len - BOUNDARY_WINDOW, 500)):
            before = np.mean(cross_var[max(0, i - BOUNDARY_WINDOW):i])
            after = np.mean(cross_var[i:i + BOUNDARY_WINDOW])
            if after > max(before * VARIANCE_JUMP_RATIO, VARIANCE_JUMP_MIN) and after > VARIANCE_FLOOR_LOW:
                return i
    else:
        for i in range(min_len - BOUNDARY_WINDOW - 1, max(min_len - 500, BOUNDARY_WINDOW), -1):
            after_boundary = np.mean(cross_var[i:i + BOUNDARY_WINDOW])
            before_boundary = np.mean(cross_var[max(0, i - BOUNDARY_WINDOW):i])
            if before_boundary > max(after_boundary * VARIANCE_JUMP_RATIO, VARIANCE_JUMP_MIN) and before_boundary > VARIANCE_FLOOR_LOW:
                return min_len - i

    return 0


def detect_shell_by_boundary(screenshots, edge, max_size, threshold):
    """Detect a shell using cross-image variance boundary analysis.

    This approach is more robust than SSIM for sidebars where the active
    nav item changes between screens (causing pixel-level differences in
    an otherwise structurally identical region).

    Strategy:
    1. Try increasingly large subsets of screens
    2. For each subset, compute cross-image column/row variance
    3. Find where variance is low in the edge region and jumps sharply
    4. Return the largest subset with a clear boundary

    Args:
        screenshots: dict[str, ndarray] — all screenshots
        edge: "left", "right", "top", "bottom"
        max_size: maximum strip width/height to consider
        threshold: not used directly (kept for API consistency)

    Returns:
        (members, boundary_px) or ([], 0) if no shell detected
    """
    from itertools import combinations

    names = sorted(screenshots.keys())
    if len(names) < 2:
        return [], 0

    # Extract per-screen brightness profiles along the edge axis
    profiles = {}
    for name, img in screenshots.items():
        gray = np.mean(img, axis=2)
        if edge in ("left", "right"):
            profile = np.mean(gray, axis=0)  # (W,)
        else:
            profile = np.mean(gray, axis=1)  # (H,)
        profiles[name] = profile

    min_len = min(len(p) for p in profiles.values())
    min_len = min(min_len, max_size + 100)

    def find_boundary(subset_names):
        """Find the boundary position for a subset of screens.

        Requires a sustained low-variance region (>=MIN_SHELL_SIZE px) before the jump.
        Returns boundary position or 0 if not found.
        """
        sub_profiles = np.array([profiles[n][:min_len] for n in subset_names])
        cross_var = np.var(sub_profiles, axis=0)

        if edge in ("left", "top"):
            for i in range(max(BOUNDARY_WINDOW, MIN_SHELL_SIZE), min(min_len - BOUNDARY_WINDOW, max_size + 50)):
                # Require the region before boundary to have low variance
                region_before = cross_var[0:i]
                mean_before = np.mean(region_before)
                after = np.mean(cross_var[i:i + BOUNDARY_WINDOW])

                if mean_before < VARIANCE_FLOOR_LOW and after > VARIANCE_FLOOR_HIGH and after > mean_before * VARIANCE_JUMP_RATIO:
                    return i
        else:
            for i in range(min_len - max(BOUNDARY_WINDOW, MIN_SHELL_SIZE),
                           max(min_len - max_size - 50, BOUNDARY_WINDOW), -1):
                region_after = cross_var[i:min_len]
                mean_after = np.mean(region_after)
                before = np.mean(cross_var[max(0, i - BOUNDARY_WINDOW):i])

                if mean_after < VARIANCE_FLOOR_LOW and before > VARIANCE_FLOOR_HIGH and before > mean_after * VARIANCE_JUMP_RATIO:
                    return min_len - i

        return 0

    # Try subsets from largest to smallest (prefer maximum coverage).
    # Optimization: limit search to avoid combinatorial explosion with many screens.
    # For N screens, trying all subsets of size N-k has C(N,k) combinations.
    # We cap the max combinations per level and the max levels to drop.
    best_members = []
    best_boundary = 0
    max_drop = min(len(names) - 2, 4)  # drop at most 4 screens

    for n_drop in range(0, max_drop + 1):
        if best_members:
            break
        subset_size = len(names) - n_drop
        subsets = list(combinations(names, subset_size))
        # Cap at 50 combinations per level to avoid blowup
        if len(subsets) > 50:
            # Prioritize subsets that exclude screens with unusual profiles
            # (high variance from group mean)
            all_arr = np.array([profiles[n][:min_len] for n in names])
            group_mean = np.mean(all_arr, axis=0)
            deviations = {}
            for name in names:
                diff = profiles[name][:min_len] - group_mean
                deviations[name] = float(np.mean(diff ** 2))
            # Sort names by deviation (most deviant first to drop)
            sorted_by_dev = sorted(names, key=lambda n: -deviations[n])
            # Generate subsets by dropping the most deviant screens first
            subsets = list(combinations(sorted_by_dev[n_drop:], subset_size))[:50]

        for subset in subsets:
            boundary = find_boundary(subset)
            if boundary >= MIN_SHELL_SIZE:
                if len(subset) > len(best_members):
                    best_members = list(subset)
                    best_boundary = boundary

    if len(best_members) < 2 or best_boundary < MIN_SHELL_SIZE:
        return [], 0

    # Verification: check that each member has similar internal structure
    # in the shell region. Screens without a real sidebar (e.g. plain white
    # background) will have very different row variance / transition counts.
    shell_metrics = {}
    for name in best_members:
        strip = screenshots[name][:, :best_boundary, :] if edge in ("left", "top") else \
                screenshots[name][:, -best_boundary:, :]
        gray = np.mean(strip, axis=2)
        row_means = np.mean(gray, axis=1)
        row_var = float(np.var(row_means))
        row_diffs = np.abs(np.diff(row_means))
        n_transitions = int(np.sum(row_diffs > TRANSITION_THRESHOLD))
        shell_metrics[name] = {"row_var": row_var, "transitions": n_transitions}

    # Use median as the reference; reject outliers
    all_row_vars = [m["row_var"] for m in shell_metrics.values()]
    all_transitions = [m["transitions"] for m in shell_metrics.values()]
    median_var = float(np.median(all_row_vars))
    median_trans = float(np.median(all_transitions))

    verified = []
    for name in best_members:
        m = shell_metrics[name]
        # Reject if row variance or transitions deviate too much from median
        var_ratio = m["row_var"] / median_var if median_var > 0 else 1.0
        trans_ratio = m["transitions"] / median_trans if median_trans > 0 else 1.0
        if OUTLIER_VAR_BAND[0] < var_ratio < OUTLIER_VAR_BAND[1] and OUTLIER_TRANS_BAND[0] < trans_ratio < OUTLIER_TRANS_BAND[1]:
            verified.append(name)

    if len(verified) < 2:
        return [], 0

    return sorted(verified), best_boundary


# --- Grid utilities ---

def classify_cell(cell):
    """Classify a cell region using simple metrics.

    Args:
        cell: ndarray (H, W, 3)

    Returns:
        dict with classification and metrics
    """
    gray = np.mean(cell, axis=2)
    variance = float(np.var(gray))

    # Edge density via gradient magnitude
    dy = np.diff(gray, axis=0).astype(float)
    dx = np.diff(gray, axis=1).astype(float)
    edge_density = float((np.mean(np.abs(dy)) + np.mean(np.abs(dx))) / 2)

    # Color diversity: quantize to 8x8x8 bins, count unique
    quantized = (cell // 32).astype(np.uint8)
    flat = quantized.reshape(-1, 3)
    unique_colors = len(np.unique(flat, axis=0))

    # Classification thresholds
    if variance < CELL_VARIANCE_SOLID:
        classification = "empty" if np.mean(gray) > CELL_BRIGHTNESS_EMPTY else "solid"
    elif edge_density > CELL_EDGE_DENSITY_TEXT and unique_colors < CELL_COLOR_DIVERSITY_TEXT:
        classification = "text"
    elif unique_colors > CELL_COLOR_DIVERSITY_IMAGE:
        classification = "image"
    else:
        classification = "mixed"

    return {
        "classification": classification,
        "metrics": {
            "variance": round(variance, 1),
            "edgeDensity": round(edge_density, 2),
            "colorDiversity": unique_colors
        }
    }


def draw_grid_overlay(image, rows, cols, cells):
    """Draw grid lines and cell labels on a copy of the image.

    Args:
        image: PIL.Image
        rows: number of rows
        cols: number of columns
        cells: list of cell dicts with row, col, classification, bounds

    Returns:
        PIL.Image with overlay
    """
    overlay = image.copy()
    draw = ImageDraw.Draw(overlay)
    w, h = image.size

    cell_w = w / cols
    cell_h = h / rows

    # Draw grid lines (red, 1px)
    for c in range(1, cols):
        x = int(c * cell_w)
        draw.line([(x, 0), (x, h)], fill=(255, 0, 0), width=1)
    for r in range(1, rows):
        y = int(r * cell_h)
        draw.line([(0, y), (w, y)], fill=(255, 0, 0), width=1)

    # Draw border
    draw.rectangle([(0, 0), (w - 1, h - 1)], outline=(255, 0, 0), width=1)

    # Label cells
    label_colors = {
        "empty": (200, 200, 200),
        "solid": (100, 100, 255),
        "text": (0, 180, 0),
        "image": (255, 140, 0),
        "mixed": (180, 0, 180),
    }

    for cell in cells:
        r, c = cell["row"], cell["col"]
        label = cell["classification"]
        color = label_colors.get(label, (255, 255, 255))

        cx = int(c * cell_w + cell_w / 2)
        cy = int(r * cell_h + cell_h / 2)

        # Background rectangle for readability
        text_w = len(label) * 6
        text_h = 10
        draw.rectangle(
            [(cx - text_w // 2 - 2, cy - text_h // 2 - 1),
             (cx + text_w // 2 + 2, cy + text_h // 2 + 1)],
            fill=(0, 0, 0)
        )
        draw.text((cx - text_w // 2, cy - text_h // 2), label, fill=color)

    return overlay


# --- Detect subcommand ---

EDGE_CONFIG = {
    "left":   {"key": "sidebar-left",  "position": "fixed-left",   "default_size": 300},
    "top":    {"key": "navbar-top",    "position": "fixed-top",    "default_size": 80},
    "bottom": {"key": "footer-bottom", "position": "fixed-bottom", "default_size": 80},
    "right":  {"key": "sidebar-right", "position": "fixed-right",  "default_size": 300},
}


def refine_shell_size(screenshots, members, edge, max_size, threshold=0.85):
    """Find actual shell width/height by scanning inward until SSIM drops.

    Uses structural (downsampled grayscale) SSIM which is tolerant of
    localized differences like active nav highlights.

    Args:
        screenshots: dict of loaded screenshot arrays
        members: list of screen names in this shell cluster
        edge: "left", "right", "top", or "bottom"
        max_size: maximum strip size to consider
        threshold: SSIM score that must be met (default 0.85)

    Returns:
        int — refined pixel size of the shell
    """
    images = {name: screenshots[name] for name in members if name in screenshots}
    if len(images) < 2:
        return max_size

    first_two = list(images.values())[:2]
    best_size = MIN_SHELL_SIZE

    # Scan from max_size down in steps, find the largest size with high SSIM
    for size in range(max_size, MIN_SHELL_SIZE - 1, -REFINE_STEP):
        s1 = extract_strip(first_two[0], edge, size)
        s2 = extract_strip(first_two[1], edge, size)

        # Normalize to common dimensions
        if edge in ("left", "right"):
            min_h = min(s1.shape[0], s2.shape[0], MAX_COMPARISON_HEIGHT)
            s1_r = np.array(Image.fromarray(s1).resize((s1.shape[1], min_h), Image.LANCZOS))
            s2_r = np.array(Image.fromarray(s2).resize((s2.shape[1], min_h), Image.LANCZOS))
        else:
            min_w = min(s1.shape[1], s2.shape[1], MAX_COMPARISON_HEIGHT)
            s1_r = np.array(Image.fromarray(s1).resize((min_w, s1.shape[0]), Image.LANCZOS))
            s2_r = np.array(Image.fromarray(s2).resize((min_w, s2.shape[0]), Image.LANCZOS))

        # Use structural SSIM (downsampled grayscale) for tolerance
        g1 = np.array(Image.fromarray(s1_r).convert("L").resize(
            (max(s1_r.shape[1] // DOWNSAMPLE_FACTOR, 1), max(s1_r.shape[0] // DOWNSAMPLE_FACTOR, 1)), Image.LANCZOS))
        g2 = np.array(Image.fromarray(s2_r).convert("L").resize(
            (max(s2_r.shape[1] // DOWNSAMPLE_FACTOR, 1), max(s2_r.shape[0] // DOWNSAMPLE_FACTOR, 1)), Image.LANCZOS))
        min_dim = min(g1.shape[0], g1.shape[1], g2.shape[0], g2.shape[1])
        win = min(7, min_dim)
        if win % 2 == 0:
            win -= 1
        if win < 3:
            continue
        score = ssim(g1, g2, win_size=win)
        if score >= threshold:
            best_size = size
            break

    return best_size


def cmd_detect(args):
    """Detect shared layout shells across screenshots."""
    screenshots = load_screenshots(args.screenshots_dir)

    if not screenshots:
        result = {
            "success": False,
            "error": f"No PNG files found in {args.screenshots_dir}"
        }
        print(json.dumps(result, indent=2))
        return 1

    if len(screenshots) < 2:
        result = {
            "success": True,
            "screenshotDir": str(args.screenshots_dir),
            "screensCount": len(screenshots),
            "shells": {},
            "screenShellMap": {name: [] for name in screenshots},
            "layoutFamilies": [{"name": "single", "screens": list(screenshots.keys())}],
            "note": "Need at least 2 screenshots for shell detection"
        }
        print(json.dumps(result, indent=2))
        return 0

    print(f"Loaded {len(screenshots)} screenshots: {sorted(screenshots.keys())}", file=sys.stderr)

    # Per-edge threshold resolution
    thresholds = {}
    for edge in EDGE_CONFIG:
        override_key = f"threshold_{edge}"
        override_val = getattr(args, override_key, None)
        thresholds[edge] = override_val if override_val is not None else args.threshold

    shells = {}
    screen_shells = {name: [] for name in screenshots}

    for edge, config in EDGE_CONFIG.items():
        size = getattr(args, f"{edge}_size", config["default_size"])
        if size is None:
            size = config["default_size"]

        print(f"Analyzing {edge} edge (size={size}px, threshold={thresholds[edge]})...", file=sys.stderr)

        # For left/right sidebars, try boundary detection first.
        # This handles sidebars where active nav highlights cause
        # pixel-level SSIM to drop below threshold despite identical structure.
        if edge in ("left", "right"):
            members, boundary = detect_shell_by_boundary(
                screenshots, edge, size, thresholds[edge])
            if members and boundary > MIN_SHELL_SIZE:
                shell_key = config["key"]
                sample_img = screenshots[members[0]]
                img_h, img_w = sample_img.shape[:2]

                if edge == "left":
                    bounds = {"x": 0, "y": 0, "width": boundary, "height": "full"}
                else:
                    bounds = {"x": img_w - boundary, "y": 0, "width": boundary, "height": "full"}

                # Compute confidence via structural SSIM on the detected region
                member_strips = {}
                for name in members:
                    member_strips[name] = extract_strip(screenshots[name], edge, boundary)
                norm_strips = normalize_strips(member_strips, edge)
                struct_mat, snames = compute_structural_ssim_matrix(norm_strips)
                pair_scores = []
                for i in range(len(snames)):
                    for j in range(i + 1, len(snames)):
                        pair_scores.append(struct_mat[i][j])
                confidence = float(np.mean(pair_scores)) if pair_scores else 0.9

                shells[shell_key] = {
                    "bounds": bounds,
                    "position": config["position"],
                    "screens": members,
                    "confidence": round(confidence, 3)
                }
                for screen in members:
                    screen_shells[screen].append(shell_key)

                print(f"  Found {shell_key} (boundary): {members} (confidence={confidence:.3f}, size={boundary}px)",
                      file=sys.stderr)
                continue

        # Standard SSIM-based detection for top/bottom edges
        # (and as fallback for left/right if boundary detection didn't find anything)
        strips = {}
        for name, img in screenshots.items():
            strip = extract_strip(img, edge, size)
            strips[name] = strip

        normalized = normalize_strips(strips, edge)
        if len(normalized) < 2:
            continue

        # Compute both pixel SSIM and structural SSIM
        pixel_matrix, names = compute_ssim_matrix(normalized)
        struct_matrix, _ = compute_structural_ssim_matrix(normalized)

        # Use the better of the two scores for each pair
        combined_matrix = np.maximum(pixel_matrix, struct_matrix)

        # Log top scores for debugging
        for i in range(len(names)):
            for j in range(i + 1, len(names)):
                cb = combined_matrix[i][j]
                if cb > thresholds[edge] - 0.1:
                    px = pixel_matrix[i][j]
                    st = struct_matrix[i][j]
                    print(f"    {names[i]}<->{names[j]}: pixel={px:.3f} struct={st:.3f} combined={cb:.3f}",
                          file=sys.stderr)

        # Cluster using combined scores
        clusters = cluster_by_ssim(combined_matrix, names, thresholds[edge])

        for ci, cluster in enumerate(clusters):
            indices = [names.index(n) for n in cluster]
            pair_scores = []
            for i in range(len(indices)):
                for j in range(i + 1, len(indices)):
                    pair_scores.append(combined_matrix[indices[i]][indices[j]])
            confidence = float(np.mean(pair_scores)) if pair_scores else 0.0

            refined_size = refine_shell_size(screenshots, cluster, edge, size,
                                             threshold=thresholds[edge] - 0.05)

            # Use numbered keys when multiple clusters exist for same edge
            shell_key = config["key"] if ci == 0 else f"{config['key']}-{ci + 1}"
            sample_img = screenshots[cluster[0]]
            img_h, img_w = sample_img.shape[:2]

            if edge == "left":
                bounds = {"x": 0, "y": 0, "width": refined_size, "height": "full"}
            elif edge == "right":
                bounds = {"x": img_w - refined_size, "y": 0, "width": refined_size, "height": "full"}
            elif edge == "top":
                bounds = {"x": 0, "y": 0, "width": img_w, "height": refined_size}
            elif edge == "bottom":
                bounds = {"x": 0, "y": img_h - refined_size, "width": img_w, "height": refined_size}

            shells[shell_key] = {
                "bounds": bounds,
                "position": config["position"],
                "screens": cluster,
                "confidence": round(confidence, 3)
            }

            for screen in cluster:
                screen_shells[screen].append(shell_key)

            print(f"  Found {shell_key}: {cluster} (confidence={confidence:.3f}, size={refined_size}px)",
                  file=sys.stderr)

    # Compute layout families from screen->shell mappings
    family_map = {}
    for screen, shell_list in screen_shells.items():
        key = tuple(sorted(shell_list))
        family_map.setdefault(key, []).append(screen)

    layout_families = []
    for shell_combo, screens in sorted(family_map.items(), key=lambda x: -len(x[1])):
        if shell_combo:
            name = "-".join(s.replace("sidebar-", "").replace("navbar-", "nav-").replace("footer-", "foot-")
                           for s in sorted(shell_combo)) + "-layout"
        else:
            name = "standalone"
        layout_families.append({
            "name": name,
            "screens": sorted(screens)
        })

    result = {
        "success": True,
        "screenshotDir": str(Path(args.screenshots_dir).resolve()),
        "screensCount": len(screenshots),
        "shells": shells,
        "screenShellMap": {k: sorted(v) for k, v in screen_shells.items()},
        "layoutFamilies": layout_families
    }

    print(json.dumps(result, indent=2))
    return 0


# --- Grid subcommand ---

def process_grid(image_array, image_name, rows, cols, output_path=None):
    """Process a single image for grid analysis.

    Returns dict with grid analysis results.
    """
    h, w = image_array.shape[:2]
    cell_w = w / cols
    cell_h = h / rows

    cells = []
    summary = {"empty": 0, "solid": 0, "text": 0, "image": 0, "mixed": 0}

    for r in range(rows):
        for c in range(cols):
            x1 = int(c * cell_w)
            y1 = int(r * cell_h)
            x2 = int(min((c + 1) * cell_w, w))
            y2 = int(min((r + 1) * cell_h, h))

            cell_region = image_array[y1:y2, x1:x2]
            info = classify_cell(cell_region)

            cell_data = {
                "row": r,
                "col": c,
                "classification": info["classification"],
                "bounds": {"x": x1, "y": y1, "width": x2 - x1, "height": y2 - y1}
            }
            cells.append(cell_data)
            summary[info["classification"]] += 1

    result = {
        "success": True,
        "screenshot": image_name,
        "dimensions": {"width": w, "height": h},
        "grid": {
            "rows": rows,
            "cols": cols,
            "cellWidth": round(cell_w, 1),
            "cellHeight": round(cell_h, 1)
        },
        "cells": cells,
        "summary": summary
    }

    if output_path:
        pil_image = Image.fromarray(image_array)
        overlay = draw_grid_overlay(pil_image, rows, cols, cells)
        overlay.save(output_path)
        result["outputImage"] = str(output_path)
        print(f"Saved grid overlay to {output_path}", file=sys.stderr)

    return result


def cmd_grid(args):
    """Generate grid visualization for screenshot(s)."""
    rows = args.rows
    cols = args.cols

    if args.all and args.screenshots_dir:
        screenshots = load_screenshots(args.screenshots_dir)
        if not screenshots:
            print(json.dumps({"success": False, "error": "No PNGs found"}), indent=2)
            return 1

        results = []
        for name, img in sorted(screenshots.items()):
            out_path = None
            if args.output:
                out_dir = Path(args.output)
                out_dir.mkdir(parents=True, exist_ok=True)
                out_path = out_dir / f"{name}-grid.png"
            result = process_grid(img, f"{name}.png", rows, cols, out_path)
            results.append(result)

        print(json.dumps({"success": True, "grids": results}, indent=2))
        return 0

    elif args.screenshot:
        path = Path(args.screenshot)
        if not path.exists():
            print(json.dumps({"success": False, "error": f"File not found: {path}"}), indent=2)
            return 1

        img = np.array(Image.open(path).convert("RGB"))
        result = process_grid(img, path.name, rows, cols, args.output)
        print(json.dumps(result, indent=2))
        return 0

    else:
        print("Error: provide --screenshot or --all --screenshots-dir", file=sys.stderr)
        return 1


# --- Main ---

def main():
    parser = argparse.ArgumentParser(
        description="Vision-based layout shell detection and grid visualization"
    )
    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # --- detect ---
    detect_p = subparsers.add_parser("detect", help="Detect shared shells across screenshots")
    detect_p.add_argument("--screenshots-dir", required=True, help="Directory containing PNG screenshots")
    detect_p.add_argument("--threshold", type=float, default=0.90,
                          help="Global SSIM threshold (default: 0.90 — well-established perceptual similarity bar)")
    detect_p.add_argument("--threshold-left", type=float, default=None,
                          help="SSIM threshold for left edge")
    detect_p.add_argument("--threshold-top", type=float, default=None,
                          help="SSIM threshold for top edge")
    detect_p.add_argument("--threshold-bottom", type=float, default=None,
                          help="SSIM threshold for bottom edge")
    detect_p.add_argument("--threshold-right", type=float, default=None,
                          help="SSIM threshold for right edge")
    detect_p.add_argument("--left-size", type=int, default=300,
                          help="Left strip width in px (default: 300 — ~20%% of 1440px desktop)")
    detect_p.add_argument("--top-size", type=int, default=80,
                          help="Top strip height in px (default: 80 — typical desktop header)")
    detect_p.add_argument("--bottom-size", type=int, default=80,
                          help="Bottom strip height in px (default: 80 — typical desktop footer)")
    detect_p.add_argument("--right-size", type=int, default=300,
                          help="Right strip width in px (default: 300 — ~20%% of 1440px desktop)")

    # --- grid ---
    grid_p = subparsers.add_parser("grid", help="Grid visualization for screenshots")
    grid_p.add_argument("--screenshot", help="Path to single PNG screenshot")
    grid_p.add_argument("--all", action="store_true", help="Process all PNGs in directory")
    grid_p.add_argument("--screenshots-dir", help="Directory containing PNG screenshots (with --all)")
    grid_p.add_argument("--rows", type=int, default=8, help="Grid rows (default: 8 — ~200px cells for typical screenshots)")
    grid_p.add_argument("--cols", type=int, default=12, help="Grid columns (default: 12 — matches CSS grid convention)")
    grid_p.add_argument("--output", help="Output path for overlay PNG (or directory with --all)")

    args = parser.parse_args()

    if args.command == "detect":
        sys.exit(cmd_detect(args))
    elif args.command == "grid":
        sys.exit(cmd_grid(args))
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
