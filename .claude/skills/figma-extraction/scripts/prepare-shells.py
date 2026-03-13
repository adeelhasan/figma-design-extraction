#!/usr/bin/env python3
"""
prepare-shells.py - Pre-package shell detection data for LLM agent.

Integrates vision-based shell detection with Figma section mapping.
Bundles vision results + Figma section subtrees + tokens + design context
into a single package so the shell extraction agent needs only ~5 turns.

Usage:
    python3 prepare-shells.py \
      --cache ${OUTPUT_DIR}/.cache/figma-file.json \
      --screenshots-dir ${OUTPUT_DIR}/preview/layouts/screenshots/ \
      --context ${OUTPUT_DIR}/design-system-context.json \
      --output ${OUTPUT_DIR}/.cache/shells-package.json

Output:
    Single JSON file with all shell data needed for HTML generation.
"""

import argparse
import json
import subprocess
import sys
from pathlib import Path


# ── Reuse helpers from figma-query.py ────────────────────────────────────────

SLIM_STRIP_KEYS = {
    "id", "scrollBehavior", "blendMode", "constraints",
    "absoluteRenderBounds",
    "interactions", "complexStrokeProperties", "strokeType",
    "strokeAlign", "strokeWeight", "exportSettings",
    "layoutAlign", "layoutGrow", "layoutSizingHorizontal",
    "layoutSizingVertical", "primaryAxisAlignItems",
    "counterAxisAlignItems", "primaryAxisSizingMode",
    "counterAxisSizingMode", "isMask", "isMaskOutline",
    "preserveRatio", "locked", "componentPropertyReferences",
    "overrides", "isFixed",
}


def slim_node(node):
    """Strip verbose metadata from a node tree."""
    if isinstance(node, dict):
        return {k: slim_node(v) for k, v in node.items() if k not in SLIM_STRIP_KEYS}
    elif isinstance(node, list):
        return [slim_node(item) for item in node]
    return node


def is_reference_page(page_name):
    lower = page_name.lower()
    keywords = ["component", "symbol", "thumbnail", "license", "code version",
                "icon", "asset", "style", "token", "color", "typograph"]
    return any(kw in lower for kw in keywords)


def is_screen_like(node):
    bbox = node.get("absoluteBoundingBox", {})
    w = bbox.get("width", 0)
    h = bbox.get("height", 0)
    screen_widths = [320, 375, 390, 414, 428, 768, 834, 1024, 1280, 1440, 1920]
    is_screen_width = any(abs(w - sw) < 30 for sw in screen_widths)
    has_screen_name = any(
        kw in node.get("name", "").lower()
        for kw in ["page", "screen", "view", "dashboard", "home", "login",
                    "signin", "sign in", "signup", "sign up", "profile",
                    "settings", "billing", "table"]
    )
    is_large_frame = w > 300 and h > 400
    return (is_screen_width and h > 400) or has_screen_name or is_large_frame


def find_screens(data):
    """Return list of (screen_node, page_name) tuples."""
    screens = []
    for page in data.get("document", {}).get("children", []):
        if is_reference_page(page.get("name", "")):
            continue
        for child in page.get("children", []):
            if child.get("type") == "FRAME" and is_screen_like(child):
                screens.append((child, page.get("name", "")))
    return screens


def find_screen_by_name(data, name):
    """Find a screen frame by name (case-insensitive, partial match)."""
    name_lower = name.lower().replace("-", " ").replace("_", " ")
    for screen, _ in find_screens(data):
        sname = screen["name"].lower().replace("-", " ").replace("_", " ")
        if sname == name_lower or name_lower in sname:
            return screen
    return None


# ── Vision detection ─────────────────────────────────────────────────────────

def run_vision_detection(screenshots_dir, scripts_dir):
    """Run detect-layout-shells.py and return parsed results."""
    detect_script = scripts_dir / "detect-layout-shells.py"

    if not detect_script.exists():
        return None, "detect-layout-shells.py not found"

    try:
        result = subprocess.run(
            [
                sys.executable, str(detect_script), "detect",
                "--screenshots-dir", str(screenshots_dir),
            ],
            capture_output=True,
            text=True,
            timeout=120,
        )

        if result.returncode != 0:
            return None, f"Vision detection failed: {result.stderr}"

        # Parse JSON from stdout
        vision_data = json.loads(result.stdout)
        if not vision_data.get("success"):
            return None, f"Vision detection unsuccessful: {vision_data.get('error', 'unknown')}"

        return vision_data, None

    except subprocess.TimeoutExpired:
        return None, "Vision detection timed out"
    except json.JSONDecodeError as e:
        return None, f"Failed to parse vision output: {e}"
    except FileNotFoundError:
        return None, "Python not found for vision detection"


# ── Figma section mapping ───────────────────────────────────────────────────

def map_shell_to_figma(shell_data, screen_node, edge):
    """Match a vision shell to a Figma section by bounds comparison.

    Args:
        shell_data: Vision shell data with bounds
        screen_node: Figma screen frame node
        edge: "left", "right", "top", "bottom"

    Returns:
        (section_node, section_name) or (None, None)
    """
    bounds = shell_data.get("bounds", {})
    shell_width = bounds.get("width", 0)
    shell_height = bounds.get("height", 0)
    tolerance = 30  # px

    for child in screen_node.get("children", []):
        child_bbox = child.get("absoluteBoundingBox", {})
        screen_bbox = screen_node.get("absoluteBoundingBox", {})

        if not child_bbox or not screen_bbox:
            continue

        # Compute relative position within screen
        rel_x = child_bbox.get("x", 0) - screen_bbox.get("x", 0)
        rel_y = child_bbox.get("y", 0) - screen_bbox.get("y", 0)
        child_w = child_bbox.get("width", 0)
        child_h = child_bbox.get("height", 0)
        screen_w = screen_bbox.get("width", 0)
        screen_h = screen_bbox.get("height", 0)

        if edge == "left" or edge == "fixed-left":
            # Left sidebar: near x=0, width matches
            if rel_x < tolerance and abs(child_w - shell_width) < tolerance:
                return child, child.get("name", "")

        elif edge == "right" or edge == "fixed-right":
            # Right sidebar: near right edge
            if abs((rel_x + child_w) - screen_w) < tolerance and abs(child_w - shell_width) < tolerance:
                return child, child.get("name", "")

        elif edge == "top" or edge == "fixed-top" or edge == "sticky-top":
            # Top navbar: near y=0, height matches
            if rel_y < tolerance and abs(child_h - shell_height) < tolerance:
                return child, child.get("name", "")

        elif edge == "bottom" or edge == "fixed-bottom":
            # Bottom footer: near bottom edge
            if abs((rel_y + child_h) - screen_h) < tolerance and abs(child_h - shell_height) < tolerance:
                return child, child.get("name", "")

    return None, None


def position_to_edge(position):
    """Convert vision position to edge name."""
    mapping = {
        "fixed-left": "left",
        "fixed-right": "right",
        "fixed-top": "top",
        "fixed-bottom": "bottom",
        "sticky-top": "top",
    }
    return mapping.get(position, position)


# ── Token CSS reading ───────────────────────────────────────────────────────

def read_token_css(output_dir):
    """Read all token CSS files and return as a dict."""
    tokens = {}
    tokens_dir = Path(output_dir) / "tokens"
    if tokens_dir.exists():
        for css_file in tokens_dir.glob("*.css"):
            tokens[css_file.name] = css_file.read_text()
    return tokens


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Pre-package shell detection data for LLM agent"
    )
    parser.add_argument("--cache", required=True, help="Path to figma-file.json cache")
    parser.add_argument("--screenshots-dir", required=True, help="Path to screenshots directory")
    parser.add_argument("--context", required=True, help="Path to design-system-context.json")
    parser.add_argument("--output", required=True, help="Output path for shells-package.json")
    args = parser.parse_args()

    cache_path = Path(args.cache)
    screenshots_dir = Path(args.screenshots_dir)
    context_path = Path(args.context)
    output_dir = cache_path.parent.parent  # .cache/figma-file.json → output_dir

    if not cache_path.exists():
        print(json.dumps({"success": False, "error": f"Cache not found: {args.cache}"}))
        return 1

    if not context_path.exists():
        print(json.dumps({"success": False, "error": f"Context not found: {args.context}"}))
        return 1

    # Load Figma data
    print("Loading Figma cache...", file=sys.stderr)
    with open(cache_path) as f:
        data = json.load(f)

    # Load design context
    print("Loading design context...", file=sys.stderr)
    with open(context_path) as f:
        design_context = json.load(f)

    # Determine scripts directory (relative to this script)
    scripts_dir = Path(__file__).parent

    # ── Step 1: Figma-aware section name matching (always runs, deterministic) ──
    print("Running Figma section name matching...", file=sys.stderr)
    screens_list = find_screens(data)
    shell_mappings = []
    screen_shell_map = {}

    # Classify screens into app vs auth groups
    app_screens = []
    auth_screens = []
    for screen_node, page_name in screens_list:
        sname = screen_node.get("name", "").lower()
        if "sign" in sname or "login" in sname or "register" in sname:
            auth_screens.append((screen_node, page_name))
        else:
            app_screens.append((screen_node, page_name))

    # Initialize screen_shell_map for all screens
    for screen_node, _ in screens_list:
        screen_shell_map[screen_node.get("name", "")] = []

    # Shell name patterns
    shell_patterns = {
        "sidebar": ["sidebar", "side-bar", "left-nav"],
        "navbar": ["navbar", "nav-bar", "header", "top-bar", "topbar"],
        "footer": ["footer", "bottom-bar"],
    }

    def detect_shells_in_group(screen_group, suffix=""):
        """Detect shared shells within a group of screens."""
        group_mappings = []
        section_counts = {}  # section_name_lower -> [(screen_name, section_node)]

        for screen_node, page_name in screen_group:
            screen_name = screen_node.get("name", "")
            for child in screen_node.get("children", []):
                child_name = child.get("name", "").lower().strip()
                section_counts.setdefault(child_name, []).append(
                    (screen_name, child)
                )

        for shell_type, patterns in shell_patterns.items():
            found = False
            for pattern in patterns:
                if found:
                    break
                for section_name, occurrences in section_counts.items():
                    if pattern in section_name and len(occurrences) >= 2:
                        screen_names = list(dict.fromkeys(s for s, _ in occurrences))
                        representative = screen_names[0]
                        _, section_node = occurrences[0]

                        # Determine position from shell type
                        position = {
                            "sidebar": "fixed-left",
                            "navbar": "sticky-top",
                            "footer": "fixed-bottom",
                        }.get(shell_type, "unknown")

                        bbox = section_node.get("absoluteBoundingBox", {})
                        screen_bbox = None
                        for sn, _ in screen_group:
                            if sn.get("name") == representative:
                                screen_bbox = sn.get("absoluteBoundingBox", {})
                                break

                        bounds = {
                            "width": bbox.get("width", 0),
                            "height": bbox.get("height", 0),
                        }

                        shell_key = shell_type + suffix
                        mapping = {
                            "shellKey": shell_key,
                            "position": position,
                            "bounds": bounds,
                            "screens": screen_names,
                            "confidence": 0.8,
                            "representativeScreen": representative,
                            "figmaSectionName": section_node.get("name"),
                            "figmaSubtree": slim_node(section_node),
                            "detectionMethod": "name-matching",
                        }
                        group_mappings.append(mapping)

                        for sn in screen_names:
                            if sn in screen_shell_map and shell_key not in screen_shell_map[sn]:
                                screen_shell_map[sn].append(shell_key)

                        found = True
                        break

        return group_mappings

    # Detect shells in app screens (sidebar, navbar, footer)
    if app_screens:
        shell_mappings.extend(detect_shells_in_group(app_screens))

    # Detect shells in auth screens with "-auth" suffix (navbar-auth, footer-auth)
    if auth_screens:
        shell_mappings.extend(detect_shells_in_group(auth_screens, suffix="-auth"))

    print(f"Figma name matching found {len(shell_mappings)} shells", file=sys.stderr)

    # ── Step 2: Vision detection (supplementary, for confidence refinement) ──
    print("Running vision-based shell detection (supplementary)...", file=sys.stderr)
    vision_data, vision_error = run_vision_detection(screenshots_dir, scripts_dir)

    if vision_error:
        print(f"Vision detection: {vision_error}", file=sys.stderr)

    if vision_data:
        vision_shells = vision_data.get("shells", {})
        # Boost confidence for shells confirmed by both methods
        for mapping in shell_mappings:
            shell_type = mapping["shellKey"].replace("-auth", "")
            for vkey, vshell in vision_shells.items():
                vtype = vkey.split("-")[0] if "-" in vkey else vkey
                if vtype == shell_type:
                    # Vision also found this shell type — boost confidence
                    mapping["confidence"] = max(mapping["confidence"], 0.9)
                    mapping["detectionMethod"] = "name-matching+vision"
                    break

    # Read token CSS
    token_css = read_token_css(output_dir)

    # Read icon manifest if available
    icon_manifest = None
    icon_path = output_dir / "assets" / "icon-manifest.json"
    if icon_path.exists():
        with open(icon_path) as f:
            icon_manifest = json.load(f)

    # Read screenshot paths
    screenshot_paths = {}
    if screenshots_dir.exists():
        for png in screenshots_dir.glob("*.png"):
            screenshot_paths[png.stem] = str(png)

    # Build package
    package = {
        "version": "1.0",
        "description": "Pre-packaged shell detection data for HTML generation",
        "visionDetection": {
            "success": vision_data is not None,
            "error": vision_error,
            "shellCount": len(shell_mappings),
        },
        "designContext": design_context,
        "tokenCSS": token_css,
        "iconManifest": icon_manifest,
        "shellMappings": shell_mappings,
        "screenShellMap": screen_shell_map,
        "screenshotPaths": screenshot_paths,
    }

    # Write package
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w") as f:
        json.dump(package, f, indent=2)

    size_kb = output_path.stat().st_size / 1024

    result = {
        "success": True,
        "shellCount": len(shell_mappings),
        "shells": [
            {
                "key": m["shellKey"],
                "position": m["position"],
                "screens": m["screens"],
                "confidence": m["confidence"],
                "figmaSection": m["figmaSectionName"],
            }
            for m in shell_mappings
        ],
        "screenShellMap": screen_shell_map,
        "packageSize": f"{size_kb:.1f}KB",
        "path": str(output_path),
    }

    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
