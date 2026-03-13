#!/usr/bin/env python3
"""
prepare-icons-assets.py - Detect icons and image assets from Figma cache.

Replaces the LLM-based icon/asset detection agent with deterministic Python.
Walks the Figma node tree, detects icon-like and image-like nodes,
normalizes names, maps icons to Lucide, classifies image types,
and writes both manifests directly.

Usage:
    python3 prepare-icons-assets.py \
      --cache ${OUTPUT_DIR}/.cache/figma-file.json \
      --output-dir ${OUTPUT_DIR}

Output:
    - ${OUTPUT_DIR}/assets/icon-manifest.json
    - ${OUTPUT_DIR}/assets/asset-manifest.json
    - JSON summary to stdout
"""

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path


# ── Lucide icon mapping ─────────────────────────────────────────────────────
# Common Figma icon names → Lucide icon names
LUCIDE_MAPPINGS = {
    # Navigation
    "dashboard": "layout-dashboard",
    "home": "home",
    "search": "search",
    "settings": "settings",
    "profile": "user",
    "user": "user",
    "users": "users",
    "account": "user",
    "notification": "bell",
    "notifications": "bell",
    "bell": "bell",
    "menu": "menu",
    "hamburger": "menu",
    "close": "x",
    "back": "arrow-left",
    "forward": "arrow-right",
    "chevron-right": "chevron-right",
    "chevron-left": "chevron-left",
    "chevron-down": "chevron-down",
    "chevron-up": "chevron-up",
    "arrow-right": "arrow-right",
    "arrow-left": "arrow-left",
    "arrow-up": "arrow-up",
    "arrow-down": "arrow-down",
    "logout": "log-out",
    "log-out": "log-out",
    "sign-out": "log-out",

    # Actions
    "edit": "pencil",
    "delete": "trash-2",
    "trash": "trash-2",
    "add": "plus",
    "plus": "plus",
    "remove": "minus",
    "minus": "minus",
    "copy": "copy",
    "share": "share-2",
    "download": "download",
    "upload": "upload",
    "refresh": "refresh-cw",
    "filter": "filter",
    "sort": "arrow-up-down",
    "more": "more-horizontal",
    "dots": "more-horizontal",
    "ellipsis": "more-horizontal",
    "check": "check",
    "checkmark": "check",

    # Content
    "table": "table",
    "tables": "table",
    "list": "list",
    "grid": "grid",
    "calendar": "calendar",
    "chart": "bar-chart-2",
    "graph": "bar-chart-2",
    "analytics": "bar-chart-2",
    "document": "file-text",
    "file": "file",
    "folder": "folder",
    "image": "image",
    "photo": "image",
    "camera": "camera",
    "video": "video",
    "music": "music",
    "link": "link",
    "attachment": "paperclip",
    "clip": "paperclip",

    # Commerce
    "cart": "shopping-cart",
    "shopping": "shopping-cart",
    "billing": "credit-card",
    "credit-card": "credit-card",
    "payment": "credit-card",
    "money": "dollar-sign",
    "dollar": "dollar-sign",
    "wallet": "wallet",
    "invoice": "receipt",
    "receipt": "receipt",

    # Communication
    "mail": "mail",
    "email": "mail",
    "message": "message-square",
    "chat": "message-circle",
    "comment": "message-square",
    "phone": "phone",
    "call": "phone",

    # Status
    "info": "info",
    "warning": "alert-triangle",
    "error": "alert-circle",
    "success": "check-circle",
    "help": "help-circle",
    "question": "help-circle",

    # UI
    "eye": "eye",
    "eye-off": "eye-off",
    "lock": "lock",
    "unlock": "unlock",
    "star": "star",
    "heart": "heart",
    "bookmark": "bookmark",
    "flag": "flag",
    "pin": "map-pin",
    "location": "map-pin",
    "map": "map",
    "globe": "globe",
    "world": "globe",
    "clock": "clock",
    "time": "clock",
    "tag": "tag",
    "label": "tag",

    # Misc
    "sun": "sun",
    "moon": "moon",
    "cloud": "cloud",
    "wifi": "wifi",
    "bluetooth": "bluetooth",
    "battery": "battery",
    "power": "power",
    "cpu": "cpu",
    "database": "database",
    "server": "server",
    "code": "code",
    "terminal": "terminal",
    "git": "git-branch",
    "github": "github",
    "rocket": "rocket",
    "zap": "zap",
    "layers": "layers",
    "box": "box",
    "package": "package",
    "tool": "wrench",
    "wrench": "wrench",
    "key": "key",
    "shield": "shield",
    "activity": "activity",
    "trending-up": "trending-up",
    "trending-down": "trending-down",
}

# Patterns to strip from icon names before mapping
STRIP_PATTERNS = [
    (r"^nav[-_]", ""),       # nav-dashboard → dashboard
    (r"^icon[-_]", ""),      # icon-search → search
    (r"[-_]icon$", ""),      # search-icon → search
    (r"^ic[-_]", ""),        # ic-home → home
    (r"^i[-_]", ""),         # i-settings → settings
]

# Icon name patterns
ICON_NAME_PATTERNS = [
    re.compile(r"^icon[-_]", re.I),
    re.compile(r"[-_]icon$", re.I),
    re.compile(r"^ic[-_]", re.I),
    re.compile(r"^i[-_]", re.I),
    re.compile(r"\bicon\b", re.I),
]

# Image name patterns
IMAGE_NAME_PATTERNS = [
    re.compile(r"\bimage\b", re.I),
    re.compile(r"\bphoto\b", re.I),
    re.compile(r"\bavatar\b", re.I),
    re.compile(r"\billustration\b", re.I),
    re.compile(r"\bbanner\b", re.I),
    re.compile(r"\bbackground\b", re.I),
    re.compile(r"\bthumbnail\b", re.I),
    re.compile(r"\bpicture\b", re.I),
    re.compile(r"\bcover\b", re.I),
    re.compile(r"\bhero\b", re.I),
]


# ── Node helpers ─────────────────────────────────────────────────────────────

def get_bounds(node):
    """Extract bounds from node."""
    bbox = node.get("absoluteBoundingBox", {})
    return {
        "width": bbox.get("width", 0),
        "height": bbox.get("height", 0),
        "x": bbox.get("x", 0),
        "y": bbox.get("y", 0),
    }


def has_vector_children(node):
    """Check if node has vector-type children."""
    for child in node.get("children", []):
        if child.get("type") in ("VECTOR", "BOOLEAN_OPERATION", "LINE", "STAR", "ELLIPSE", "REGULAR_POLYGON"):
            return True
    return False


def has_text_children(node):
    """Check if node or its direct children contain TEXT nodes."""
    for child in node.get("children", []):
        if child.get("type") == "TEXT":
            return True
    return False


def has_image_fill(node):
    """Check if node has an IMAGE fill."""
    for fill in node.get("fills", []):
        if fill.get("type") == "IMAGE" and fill.get("visible", True):
            return True
    return False


def get_parent_path(node_id, parent_map):
    """Get parent path for a node."""
    path = []
    current = node_id
    while current in parent_map:
        parent_id, parent_name = parent_map[current]
        path.insert(0, parent_name)
        current = parent_id
    return path


def is_reference_page(page_name):
    """Pages that contain reference material, not app screens."""
    lower = page_name.lower()
    keywords = ["component", "symbol", "thumbnail", "license", "code version",
                "icon", "asset", "style", "token", "color", "typograph"]
    return any(kw in lower for kw in keywords)


# ── Icon detection ───────────────────────────────────────────────────────────

def is_icon_like(node):
    """Detect if a node looks like an icon."""
    bounds = get_bounds(node)
    w, h = bounds["width"], bounds["height"]
    node_type = node.get("type", "")
    name = node.get("name", "")

    # Size-based: small, roughly square
    is_small = w <= 48 and h <= 48 and w > 0 and h > 0
    is_square = abs(w - h) <= 4

    # Name-based
    has_icon_name = any(p.search(name) for p in ICON_NAME_PATTERNS)

    # Type-based
    is_component = node_type in ("COMPONENT", "INSTANCE")

    # Structure-based
    has_vectors = has_vector_children(node)
    has_no_text = not has_text_children(node)

    return (
        (is_small and is_square and has_vectors and has_no_text) or
        has_icon_name or
        (is_component and is_small and is_square)
    )


def normalize_icon_name(figma_name):
    """Clean up a Figma icon name for Lucide mapping."""
    normalized = figma_name.lower().strip()

    for pattern, replacement in STRIP_PATTERNS:
        normalized = re.sub(pattern, replacement, normalized)

    # Clean up separators
    normalized = re.sub(r"[-_\s]+", "-", normalized).strip("-")

    return normalized


def map_icon_to_lucide(normalized_name):
    """Map a normalized name to a Lucide icon."""
    # Exact match
    if normalized_name in LUCIDE_MAPPINGS:
        return LUCIDE_MAPPINGS[normalized_name], "exact"

    # Fuzzy: check if name contains a known key or vice versa
    for key, icon in LUCIDE_MAPPINGS.items():
        if key in normalized_name or normalized_name in key:
            return icon, "fuzzy"

    # Word-level match
    words = normalized_name.split("-")
    for word in words:
        if word in LUCIDE_MAPPINGS:
            return LUCIDE_MAPPINGS[word], "fuzzy"

    return None, "unmapped"


def infer_icon_size(w, h):
    """Classify icon size."""
    size = max(w, h)
    if size <= 14:
        return "xs"
    elif size <= 18:
        return "sm"
    elif size <= 22:
        return "md"
    elif size <= 28:
        return "lg"
    return "xl"


# ── Asset/Image detection ────────────────────────────────────────────────────

def is_image_like(node):
    """Detect if a node looks like an image asset."""
    bounds = get_bounds(node)
    w, h = bounds["width"], bounds["height"]
    name = node.get("name", "")
    node_type = node.get("type", "")

    # Check 1: Has image fill
    if has_image_fill(node):
        return True

    # Check 2: Name suggests image
    if any(p.search(name) for p in IMAGE_NAME_PATTERNS):
        return True

    # Check 3: Large rectangle without text (likely image placeholder)
    is_large = w > 100 and h > 100
    is_rect = node_type in ("RECTANGLE", "FRAME")
    has_no_text = not has_text_children(node)
    has_no_vectors = not has_vector_children(node)

    if is_large and is_rect and has_no_text and has_no_vectors:
        has_fill = False
        for fill in node.get("fills", []):
            if fill.get("type") in ("SOLID", "GRADIENT_LINEAR", "GRADIENT_RADIAL") and fill.get("visible", True):
                has_fill = True
                break
        if has_fill:
            return True

    return False


def infer_image_type(node):
    """Classify the type of image asset."""
    name = node.get("name", "").lower()
    bounds = get_bounds(node)
    w, h = bounds["width"], bounds["height"]
    aspect = w / h if h > 0 else 1

    # Avatar detection
    if re.search(r"avatar", name, re.I) or (abs(aspect - 1) < 0.1 and 32 <= w <= 150):
        return "avatar"

    # Banner/Hero
    if re.search(r"banner|hero|header", name, re.I) or (aspect > 2 and w > 500):
        return "banner"

    # Logo
    if re.search(r"logo", name, re.I):
        return "logo"

    # Illustration
    if re.search(r"illustration|graphic|artwork", name, re.I):
        return "illustration"

    # Photo
    if re.search(r"photo|picture|thumbnail", name, re.I) or (w > 200 and h > 150 and 0.5 < aspect < 2):
        return "photo"

    # Background
    if w > 800 or h > 600:
        return "background"

    return "image"


def infer_image_role(image_type):
    """Determine semantic role of an image."""
    role_map = {
        "banner": "background",
        "background": "background",
        "avatar": "avatar",
        "logo": "branding",
        "illustration": "decorative",
    }
    return role_map.get(image_type, "content")


def determine_placeholder(image_type):
    """Determine placeholder strategy for an image type."""
    strategies = {
        "avatar": {
            "type": "initials",
            "config": {
                "gradient": "var(--gradient-secondary)",
                "shape": "rounded",
                "fallbackText": "U"
            }
        },
        "banner": {
            "type": "gradient",
            "config": {
                "gradient": "var(--gradient-primary)",
                "direction": "135deg"
            }
        },
        "background": {
            "type": "gradient",
            "config": {
                "gradient": "var(--gradient-primary)",
                "direction": "135deg"
            }
        },
        "illustration": {
            "type": "svg",
            "config": {
                "placeholder": "illustration-placeholder",
                "backgroundColor": "var(--color-gray-2)"
            }
        },
        "logo": {
            "type": "solid",
            "config": {
                "backgroundColor": "var(--color-gray-3)",
                "text": "LOGO"
            }
        },
    }
    return strategies.get(image_type, {
        "type": "gradient",
        "config": {
            "gradient": "var(--gradient-secondary)",
            "icon": "image"
        }
    })


def generate_css_classes(image_type, w, h):
    """Generate CSS classes for an image asset."""
    classes = [f"asset-{image_type}"]
    aspect = w / h if h > 0 else 1

    if aspect > 1.5:
        classes.append("aspect-wide")
    elif aspect < 0.75:
        classes.append("aspect-tall")
    else:
        classes.append("aspect-square")

    max_dim = max(w, h)
    if max_dim < 100:
        classes.append("size-sm")
    elif max_dim < 300:
        classes.append("size-md")
    else:
        classes.append("size-lg")

    return classes


PLACEHOLDER_CSS = """/* Asset Placeholder Styles */
/* Generated from Figma extraction */

.asset-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.asset-avatar {
  background: var(--gradient-secondary);
  border-radius: var(--radius-lg);
  color: var(--color-white);
  font-weight: var(--font-weight-semibold);
  font-size: 1.25em;
}

.asset-banner,
.asset-background {
  background: var(--gradient-primary);
}

.asset-illustration {
  background: var(--color-gray-2);
  border: 1px dashed var(--color-gray-5);
}

.asset-photo,
.asset-image {
  background: var(--gradient-secondary);
}

.asset-logo {
  background: var(--color-gray-3);
  color: var(--color-gray-7);
  font-weight: var(--font-weight-bold);
  font-size: 0.75em;
  text-transform: uppercase;
}

.aspect-wide { aspect-ratio: 16/9; }
.aspect-square { aspect-ratio: 1; }
.aspect-tall { aspect-ratio: 3/4; }

.size-sm { max-width: 100px; max-height: 100px; }
.size-md { max-width: 300px; max-height: 300px; }
.size-lg { max-width: 100%; }

.asset-placeholder-icon {
  opacity: 0.5;
  width: 32px;
  height: 32px;
}"""


# ── Tree walker ──────────────────────────────────────────────────────────────

def find_screen_name(node_id, parent_map, screen_ids):
    """Find which screen a node belongs to."""
    current = node_id
    while current:
        if current in screen_ids:
            return screen_ids[current]
        if current not in parent_map:
            break
        current = parent_map[current][0]
    return None


def walk_tree(data):
    """Walk the Figma node tree and detect icons and images.

    Returns (icons, images, parent_map, screen_ids).
    """
    icons = []
    images = []
    parent_map = {}  # node_id -> (parent_id, parent_name)
    screen_ids = {}  # node_id -> screen_name

    # Find screens first
    for page in data.get("document", {}).get("children", []):
        if is_reference_page(page.get("name", "")):
            continue
        for child in page.get("children", []):
            if child.get("type") == "FRAME":
                bbox = child.get("absoluteBoundingBox", {})
                w = bbox.get("width", 0)
                h = bbox.get("height", 0)
                if w > 300 and h > 400:
                    screen_ids[child.get("id")] = child.get("name")

    def walk(node, parent_id=None, parent_name=None, depth=0):
        node_id = node.get("id")
        if parent_id is not None:
            parent_map[node_id] = (parent_id, parent_name)

        bounds = get_bounds(node)

        # Check for icons (prioritize over images for small nodes)
        if is_icon_like(node):
            normalized = normalize_icon_name(node.get("name", ""))
            lucide_icon, confidence = map_icon_to_lucide(normalized)
            icons.append({
                "id": node_id,
                "name": node.get("name", ""),
                "normalizedName": normalized,
                "type": node.get("type", ""),
                "dimensions": {
                    "width": bounds["width"],
                    "height": bounds["height"],
                },
                "libraryIcon": lucide_icon,
                "confidence": confidence,
                "size": infer_icon_size(bounds["width"], bounds["height"]),
            })
        # Check for images (skip icon-sized nodes)
        elif is_image_like(node):
            img_type = infer_image_type(node)
            images.append({
                "id": node_id,
                "name": node.get("name", ""),
                "type": img_type,
                "dimensions": {
                    "width": bounds["width"],
                    "height": bounds["height"],
                },
                "aspectRatio": round(bounds["width"] / bounds["height"], 2) if bounds["height"] > 0 else 1,
                "hasOriginal": has_image_fill(node),
                "position": {"x": bounds["x"], "y": bounds["y"]},
            })

        for child in node.get("children", []):
            walk(child, node_id, node.get("name", ""), depth + 1)

    for page in data.get("document", {}).get("children", []):
        walk(page)

    return icons, images, parent_map, screen_ids


# ── Manifest generation ─────────────────────────────────────────────────────

def build_icon_manifest(icons, parent_map, screen_ids):
    """Build icon-manifest.json content."""
    # Deduplicate icons by normalized name
    seen = {}
    for icon in icons:
        key = icon["normalizedName"]
        if key not in seen:
            seen[key] = icon
            seen[key]["usedIn"] = []

        # Add usage context
        screen = find_screen_name(icon["id"], parent_map, screen_ids)
        parent_path = get_parent_path(icon["id"], parent_map)
        section = parent_path[1] if len(parent_path) > 1 else "unknown"

        seen[key]["usedIn"].append({
            "screenName": screen or "unknown",
            "sectionName": section,
            "size": icon["size"],
        })

    mapped = [v for v in seen.values() if v["libraryIcon"] is not None]
    unmapped = [v for v in seen.values() if v["libraryIcon"] is None]

    exact_count = sum(1 for v in mapped if v["confidence"] == "exact")
    fuzzy_count = sum(1 for v in mapped if v["confidence"] == "fuzzy")

    manifest = {
        "version": "1.0",
        "extractedAt": datetime.now(timezone.utc).isoformat(),
        "library": "lucide",
        "cdnUrl": "https://unpkg.com/lucide@latest",
        "summary": {
            "total": len(seen),
            "mapped": len(mapped),
            "unmapped": len(unmapped),
            "exactMatches": exact_count,
            "fuzzyMatches": fuzzy_count,
            "inferredMatches": 0,
        },
        "icons": {
            "mapped": [
                {
                    "figmaName": v["name"],
                    "libraryIcon": v["libraryIcon"],
                    "confidence": v["confidence"],
                    "usedIn": v["usedIn"],
                }
                for v in mapped
            ],
            "unmapped": [
                {
                    "figmaName": v["name"],
                    "nodeId": v["id"],
                    "dimensions": v["dimensions"],
                    "usedIn": v["usedIn"],
                    "suggestedAction": (
                        "extract-svg" if re.search(r"logo|brand|company", v["name"], re.I)
                        else "manual-map" if len(v["usedIn"]) > 1
                        else "use-placeholder"
                    ),
                }
                for v in unmapped
            ],
        },
    }

    return manifest


def build_asset_manifest(images, parent_map, screen_ids):
    """Build asset-manifest.json content."""
    by_type = {}
    for img in images:
        by_type[img["type"]] = by_type.get(img["type"], 0) + 1

    has_original_count = sum(1 for img in images if img["hasOriginal"])

    manifest = {
        "version": "1.0",
        "extractedAt": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "totalImages": len(images),
            "byType": by_type,
            "exported": 0,
            "placeholders": len(images),
        },
        "images": [],
        "placeholderStyles": {
            "css": PLACEHOLDER_CSS,
        },
    }

    for img in images:
        screen = find_screen_name(img["id"], parent_map, screen_ids)
        parent_path = get_parent_path(img["id"], parent_map)
        section = parent_path[1] if len(parent_path) > 1 else "unknown"

        manifest["images"].append({
            "id": img["id"],
            "name": img["name"],
            "type": img["type"],
            "dimensions": img["dimensions"],
            "aspectRatio": img["aspectRatio"],
            "hasOriginal": img["hasOriginal"],
            "exportPath": None,
            "placeholder": determine_placeholder(img["type"]),
            "usedIn": [{
                "screenName": screen or "unknown",
                "sectionName": section,
                "role": infer_image_role(img["type"]),
                "cssClasses": generate_css_classes(
                    img["type"],
                    img["dimensions"]["width"],
                    img["dimensions"]["height"],
                ),
            }],
        })

    return manifest


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Detect icons and image assets from Figma cache"
    )
    parser.add_argument("--cache", required=True, help="Path to figma-file.json cache")
    parser.add_argument("--output-dir", required=True, help="Output directory")
    args = parser.parse_args()

    cache_path = Path(args.cache)
    if not cache_path.exists():
        print(json.dumps({"success": False, "error": f"Cache not found: {args.cache}"}))
        return 1

    print(f"Loading cache from {args.cache}...", file=sys.stderr)
    with open(cache_path) as f:
        data = json.load(f)

    print("Walking node tree...", file=sys.stderr)
    icons, images, parent_map, screen_ids = walk_tree(data)

    print(f"Found {len(icons)} icon nodes, {len(images)} image nodes", file=sys.stderr)

    # Build manifests
    icon_manifest = build_icon_manifest(icons, parent_map, screen_ids)
    asset_manifest = build_asset_manifest(images, parent_map, screen_ids)

    # Write manifests
    output_dir = Path(args.output_dir)
    assets_dir = output_dir / "assets"
    assets_dir.mkdir(parents=True, exist_ok=True)

    icon_path = assets_dir / "icon-manifest.json"
    asset_path = assets_dir / "asset-manifest.json"

    with open(icon_path, "w") as f:
        json.dump(icon_manifest, f, indent=2)

    with open(asset_path, "w") as f:
        json.dump(asset_manifest, f, indent=2)

    # Summary output
    result = {
        "success": True,
        "icons": {
            "total": icon_manifest["summary"]["total"],
            "mapped": icon_manifest["summary"]["mapped"],
            "unmapped": icon_manifest["summary"]["unmapped"],
            "path": str(icon_path),
        },
        "assets": {
            "total": asset_manifest["summary"]["totalImages"],
            "byType": asset_manifest["summary"]["byType"],
            "withOriginal": sum(1 for img in images if img["hasOriginal"]),
            "path": str(asset_path),
        },
    }

    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
