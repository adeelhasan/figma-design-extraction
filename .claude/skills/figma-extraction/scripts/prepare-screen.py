#!/usr/bin/env python3
"""
prepare-screen.py - Build complete input package for a single screen.

Bundles all data a screen agent needs into one JSON file (~30-80KB),
eliminating the need for figma-query calls during extraction.

Usage:
    python3 prepare-screen.py \
      --cache ${OUTPUT_DIR}/.cache/figma-file.json \
      --output-dir ${OUTPUT_DIR} \
      --screen "Dashboard" \
      --output ${OUTPUT_DIR}/.cache/screen-packages/Dashboard.json

Output:
    Single JSON file with screen layout, section subtrees, shells,
    tokens, design context, and asset/icon manifests for this screen.
"""

import argparse
import json
import os
import sys
from pathlib import Path

# Import style extraction (hyphenated filename requires importlib)
import importlib.util
_scripts_dir = Path(__file__).parent
_spec = importlib.util.spec_from_file_location(
    "extract_styles", _scripts_dir / "extract-styles.py"
)
_extract_styles = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_extract_styles)
build_all_lookups = _extract_styles.build_all_lookups
extract_styles_for_sections = _extract_styles.extract_styles_for_sections


# ── Reuse helpers from figma-query.py ────────────────────────────────────────

SLIM_STRIP_KEYS = {
    "id", "scrollBehavior", "blendMode", "constraints",
    "absoluteRenderBounds",
    "interactions", "complexStrokeProperties", "strokeType",
    "strokeAlign", "exportSettings",
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


def find_screen_by_name(data, name):
    """Find a screen frame by name (case-insensitive, partial match)."""
    name_lower = name.lower().replace("-", " ").replace("_", " ")
    for page in data.get("document", {}).get("children", []):
        if is_reference_page(page.get("name", "")):
            continue
        for child in page.get("children", []):
            if child.get("type") == "FRAME" and is_screen_like(child):
                sname = child["name"].lower().replace("-", " ").replace("_", " ")
                if sname == name_lower or name_lower in sname:
                    return child
    return None


def node_summary(node, max_children_depth=0):
    """Create a compact summary of a node."""
    summary = {
        "id": node.get("id"),
        "name": node.get("name"),
        "type": node.get("type"),
    }
    bbox = node.get("absoluteBoundingBox")
    if bbox:
        summary["bounds"] = {
            "x": bbox.get("x"),
            "y": bbox.get("y"),
            "width": bbox.get("width"),
            "height": bbox.get("height"),
        }
    if node.get("layoutMode"):
        summary["layoutMode"] = node["layoutMode"]
        if node.get("itemSpacing") is not None:
            summary["itemSpacing"] = node["itemSpacing"]
        for key in ("paddingLeft", "paddingRight", "paddingTop", "paddingBottom"):
            if node.get(key) is not None:
                summary.setdefault("padding", {})[key] = node[key]
    children = node.get("children", [])
    if children:
        summary["childCount"] = len(children)
        if max_children_depth > 0:
            summary["children"] = [
                node_summary(c, max_children_depth - 1) for c in children
            ]
        else:
            summary["childNames"] = [c.get("name", "?") for c in children]
    return summary


# ── Text content extraction ──────────────────────────────────────────────────

def extract_text_content(node, path=""):
    """Walk subtree and extract all TEXT node characters with path and style."""
    texts = []
    name = node.get("name", "")
    current_path = f"{path}/{name}" if path else name

    if node.get("type") == "TEXT":
        chars = node.get("characters", "")
        if chars.strip():
            style = node.get("style", {})
            texts.append({
                "path": current_path,
                "text": chars,
                "fontSize": style.get("fontSize"),
                "fontWeight": style.get("fontWeight"),
            })

    for child in node.get("children", []):
        texts.extend(extract_text_content(child, current_path))
    return texts


# ── Token lookup ─────────────────────────────────────────────────────────────

def build_token_lookup(output_dir):
    """Parse token CSS files and build a compact name→value lookup."""
    import re
    lookup = {}
    tokens_dir = Path(output_dir) / "tokens"
    if not tokens_dir.exists():
        return lookup

    for css_file in tokens_dir.glob("*.css"):
        content = css_file.read_text()
        for match in re.finditer(r'(--[\w-]+)\s*:\s*([^;]+);', content):
            name = match.group(1).strip()
            value = match.group(2).strip()
            if value and not value.startswith('/*'):
                lookup[name] = value
    return lookup


# ── Screen package building ──────────────────────────────────────────────────

def get_screen_layout(screen_node):
    """Get top-level screen layout (equivalent to figma-query screen-layout)."""
    bbox = screen_node.get("absoluteBoundingBox", {})
    sections = []
    for child in screen_node.get("children", []):
        sections.append(node_summary(child, max_children_depth=1))

    return {
        "screen": screen_node["name"],
        "id": screen_node["id"],
        "dimensions": {
            "width": bbox.get("width"),
            "height": bbox.get("height"),
        },
        "layoutMode": screen_node.get("layoutMode"),
        "sections": sections,
    }


def get_section_subtrees(screen_node, shell_section_names):
    """Get slim subtrees for all non-shell sections."""
    subtrees = {}
    shell_names_lower = {n.lower() for n in shell_section_names}

    for child in screen_node.get("children", []):
        child_name = child.get("name", "")
        if child_name.lower() not in shell_names_lower:
            subtrees[child_name] = slim_node(child)

    return subtrees


def read_shell_html(output_dir):
    """Read pre-built shell HTML fragments."""
    shells_dir = Path(output_dir) / "preview" / "layouts" / "shells"
    shell_html = {}
    if shells_dir.exists():
        for html_file in shells_dir.glob("*.html"):
            shell_html[html_file.stem] = html_file.read_text()
    return shell_html


def read_token_css(output_dir):
    """Read all token CSS files."""
    tokens = {}
    tokens_dir = Path(output_dir) / "tokens"
    if tokens_dir.exists():
        for css_file in tokens_dir.glob("*.css"):
            tokens[css_file.name] = css_file.read_text()
    return tokens


def filter_manifests_for_screen(screen_name, output_dir):
    """Get icon/asset manifest entries relevant to this screen."""
    icon_subset = []
    asset_subset = []

    icon_path = Path(output_dir) / "assets" / "icon-manifest.json"
    if icon_path.exists():
        with open(icon_path) as f:
            manifest = json.load(f)
        for icon in manifest.get("icons", {}).get("mapped", []):
            for usage in icon.get("usedIn", []):
                if usage.get("screenName", "").lower() == screen_name.lower():
                    icon_subset.append(icon)
                    break
        for icon in manifest.get("icons", {}).get("unmapped", []):
            for usage in icon.get("usedIn", []):
                if usage.get("screenName", "").lower() == screen_name.lower():
                    icon_subset.append(icon)
                    break

    asset_path = Path(output_dir) / "assets" / "asset-manifest.json"
    if asset_path.exists():
        with open(asset_path) as f:
            manifest = json.load(f)
        for image in manifest.get("images", []):
            for usage in image.get("usedIn", []):
                if usage.get("screenName", "").lower() == screen_name.lower():
                    # Compute relative path from HTML location (preview/layouts/)
                    # to the exported image
                    entry = dict(image)
                    if entry.get("hasOriginal") and entry.get("exportPath"):
                        abs_export = Path(entry["exportPath"])
                        html_dir = Path(output_dir) / "preview" / "layouts"
                        try:
                            entry["relativePath"] = str(
                                os.path.relpath(abs_export, html_dir)
                            )
                        except ValueError:
                            entry["relativePath"] = entry["exportPath"]
                    asset_subset.append(entry)
                    break

    return icon_subset, asset_subset


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Build complete input package for a single screen"
    )
    parser.add_argument("--cache", required=True, help="Path to figma-file.json cache")
    parser.add_argument("--output-dir", required=True, help="Extraction output directory")
    parser.add_argument("--screen", required=True, help="Screen name")
    parser.add_argument("--output", required=True, help="Output path for screen package JSON")
    args = parser.parse_args()

    cache_path = Path(args.cache)
    output_dir = Path(args.output_dir)

    if not cache_path.exists():
        print(json.dumps({"success": False, "error": f"Cache not found: {args.cache}"}))
        return 1

    # Load Figma data
    print(f"Loading cache for screen '{args.screen}'...", file=sys.stderr)
    with open(cache_path) as f:
        data = json.load(f)

    # Find screen
    screen_node = find_screen_by_name(data, args.screen)
    if not screen_node:
        # List available screens for error message
        available = []
        for page in data.get("document", {}).get("children", []):
            if is_reference_page(page.get("name", "")):
                continue
            for child in page.get("children", []):
                if child.get("type") == "FRAME" and is_screen_like(child):
                    available.append(child["name"])
        print(json.dumps({
            "success": False,
            "error": f"Screen '{args.screen}' not found",
            "available": available,
        }))
        return 1

    screen_name = screen_node["name"]

    # Read layout-shells.json to know which sections are shells
    shell_section_names = []
    layout_shells = None
    shells_path = output_dir / "layout-shells.json"
    if shells_path.exists():
        with open(shells_path) as f:
            layout_shells = json.load(f)

        # Get this screen's shell list
        screen_shells = layout_shells.get("screenShellMap", {}).get(screen_name, [])

        # Get the Figma section names for these shells
        for shell_key in screen_shells:
            shell_def = layout_shells.get("shells", {}).get(shell_key, {})
            section_name = shell_def.get("sectionName")
            if section_name:
                shell_section_names.append(section_name)

    # Build screen layout
    screen_layout = get_screen_layout(screen_node)

    # Get non-shell section subtrees
    section_subtrees = get_section_subtrees(screen_node, shell_section_names)

    # Read shell HTML fragments
    shell_html = read_shell_html(output_dir)

    # Read token CSS
    token_css = read_token_css(output_dir)

    # Read design context
    design_context = None
    context_path = output_dir / "design-system-context.json"
    if context_path.exists():
        with open(context_path) as f:
            design_context = json.load(f)

    # Filter icon/asset manifests for this screen
    icon_subset, asset_subset = filter_manifests_for_screen(screen_name, output_dir)

    # Pre-extract text content from each section subtree
    text_content = {}
    for section_name, subtree in section_subtrees.items():
        texts = extract_text_content(subtree)
        if texts:
            text_content[section_name] = texts

    # Build token lookup (name→value)
    token_lookup = build_token_lookup(output_dir)

    # Extract section styles (token-mapped CSS properties)
    tokens_dir = output_dir / "tokens"
    if tokens_dir.exists():
        print(f"Extracting section styles...", file=sys.stderr)
        lookups = build_all_lookups(tokens_dir)
        # Use the raw (non-slimmed) subtrees for style extraction
        raw_section_subtrees = {}
        shell_names_lower = {n.lower() for n in shell_section_names}
        for child in screen_node.get("children", []):
            child_name = child.get("name", "")
            if child_name.lower() not in shell_names_lower:
                raw_section_subtrees[child_name] = child
        section_styles = extract_styles_for_sections(raw_section_subtrees, lookups)
    else:
        section_styles = {}

    # Screenshot path
    screenshot_path = str(output_dir / "preview" / "layouts" / "screenshots" / f"{screen_name}.png")

    # Build package
    package = {
        "version": "1.0",
        "description": f"Complete input package for {screen_name} screen extraction",
        "screenName": screen_name,
        "screenshotPath": screenshot_path,
        "screenLayout": screen_layout,
        "sectionSubtrees": section_subtrees,
        "sectionStyles": section_styles,
        "textContent": text_content,
        "tokenLookup": token_lookup,
        "shellSections": shell_section_names,
        "shellHTML": shell_html,
        "shellConfig": {
            "screenShells": layout_shells.get("screenShellMap", {}).get(screen_name, []) if layout_shells else [],
            "shells": layout_shells.get("shells", {}) if layout_shells else {},
        },
        "tokenCSS": token_css,
        "designContext": design_context,
        "icons": icon_subset,
        "assets": asset_subset,
    }

    # Write package
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w") as f:
        json.dump(package, f, indent=2)

    size_kb = output_path.stat().st_size / 1024

    result = {
        "success": True,
        "screen": screen_name,
        "sectionCount": len(section_subtrees),
        "sectionNames": list(section_subtrees.keys()),
        "shellSections": shell_section_names,
        "shellHTMLCount": len(shell_html),
        "styleEntries": sum(len(v) for v in section_styles.values()),
        "iconCount": len(icon_subset),
        "assetCount": len(asset_subset),
        "packageSize": f"{size_kb:.1f}KB",
        "path": str(output_path),
    }

    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
