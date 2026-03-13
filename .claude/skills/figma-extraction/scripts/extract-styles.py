#!/usr/bin/env python3
"""
extract-styles.py - Extract and token-map CSS styles from Figma node subtrees.

Walks every node in a screen's section subtrees, extracts CSS-relevant visual
properties, and maps Figma values to design tokens. Output is a compact
sectionStyles JSON that screen extraction agents consume directly.

Usage (standalone):
    python3 extract-styles.py \
      --cache ${OUTPUT_DIR}/.cache/figma-file.json \
      --tokens-dir ${OUTPUT_DIR}/tokens/ \
      --screen "Dashboard" \
      --output ${OUTPUT_DIR}/.cache/screen-styles/Dashboard.json

Or called by prepare-screen.py as an import.
"""

import argparse
import json
import math
import re
import sys
from pathlib import Path


# ── Figma value converters (ported from figma-query.py) ──────────────────────

def rgba_to_hex(color: dict) -> str:
    r = round(color.get("r", 0) * 255)
    g = round(color.get("g", 0) * 255)
    b = round(color.get("b", 0) * 255)
    return f"#{r:02x}{g:02x}{b:02x}"


def rgba_to_css(color: dict) -> str:
    """Convert Figma color to CSS rgba or hex string."""
    a = color.get("a", 1.0)
    r = round(color.get("r", 0) * 255)
    g = round(color.get("g", 0) * 255)
    b = round(color.get("b", 0) * 255)
    if a < 1.0:
        return f"rgba({r}, {g}, {b}, {a:.2f})"
    return f"#{r:02x}{g:02x}{b:02x}"


def figma_shadow_to_css(effect: dict) -> str:
    """Convert a Figma DROP_SHADOW/INNER_SHADOW effect to a CSS box-shadow string."""
    offset = effect.get("offset", {})
    x = offset.get("x", 0)
    y = offset.get("y", 0)
    radius = effect.get("radius", 0)
    spread = effect.get("spread", 0)
    color = effect.get("color", {})
    rgba = rgba_to_css(color)
    inset = "inset " if effect.get("type") == "INNER_SHADOW" else ""
    parts = [f"{inset}{x}px", f"{y}px", f"{radius}px"]
    if spread:
        parts.append(f"{spread}px")
    parts.append(rgba)
    return " ".join(parts)


def gradient_angle(handles: list) -> float:
    """Convert Figma gradient handle positions to CSS angle in degrees."""
    if len(handles) < 2:
        return 180.0
    start, end = handles[0], handles[1]
    dx = end["x"] - start["x"]
    dy = end["y"] - start["y"]
    angle_rad = math.atan2(dx, -dy)
    return round(math.degrees(angle_rad) % 360, 1)


def figma_gradient_to_css(fill: dict) -> str:
    """Convert a Figma gradient fill to a CSS linear-gradient string."""
    handles = fill.get("gradientHandlePositions", [])
    stops = fill.get("gradientStops", [])
    angle = gradient_angle(handles)
    stop_strs = []
    for s in stops:
        color = rgba_to_css(s.get("color", {}))
        pos = round(s.get("position", 0) * 100)
        stop_strs.append(f"{color} {pos}%")
    return f"linear-gradient({angle}deg, {', '.join(stop_strs)})"


# ── Reverse token lookup builders ────────────────────────────────────────────

def _parse_css_vars(css_text: str) -> dict:
    """Parse CSS custom properties from a CSS file. Returns {name: value}."""
    result = {}
    for match in re.finditer(r'(--[\w-]+)\s*:\s*([^;]+);', css_text):
        name = match.group(1).strip()
        value = match.group(2).strip()
        if value and not value.startswith('/*'):
            result[name] = value
    return result


def build_reverse_color_lookup(tokens_dir: Path) -> dict:
    """Parse colors.css, build hex → var(--color-*) map.

    Prioritizes semantic tokens over primitives.
    """
    colors_path = tokens_dir / "colors.css"
    if not colors_path.exists():
        return {}

    css_vars = _parse_css_vars(colors_path.read_text())
    hex_to_token = {}

    # First pass: all color vars (primitives get added first)
    for name, value in css_vars.items():
        # Skip gradients and non-hex values
        if value.startswith("linear-gradient") or value.startswith("var("):
            continue
        hex_val = value.lower().strip()
        if re.match(r'^#[0-9a-f]{6}$', hex_val):
            hex_to_token[hex_val] = f"var({name})"

    # Second pass: semantic tokens override primitives (ordered by priority)
    # Lower-priority semantic tokens first, higher-priority ones last (last write wins)
    semantic_priority = [
        # Low priority: status colors (rarely the right match for general UI)
        ("--color-status-",),
        # Medium: brand/social colors
        ("--color-facebook", "--color-twitter", "--color-instagram",
         "--color-slack-", "--color-spotify", "--color-shopify",
         "--color-jira", "--color-apple"),
        # High: intent colors
        ("--color-info", "--color-success", "--color-warning",
         "--color-danger", "--color-error"),
        # Higher: core semantic + text
        ("--color-primary", "--color-secondary",
         "--color-text-", "--color-border"),
        # Highest: surface, background (most useful for layout backgrounds)
        ("--color-surface", "--color-background"),
    ]
    for prefixes in semantic_priority:
        for name, value in css_vars.items():
            if any(name.startswith(p) or name == p for p in prefixes):
                hex_val = value.lower().strip()
                if re.match(r'^#[0-9a-f]{6}$', hex_val):
                    hex_to_token[hex_val] = f"var({name})"

    # Also build gradient lookup: CSS gradient string → var(--gradient-*)
    gradient_lookup = {}
    for name, value in css_vars.items():
        if name.startswith("--gradient-") and value.startswith("linear-gradient"):
            gradient_lookup[name] = value

    return hex_to_token, gradient_lookup


def build_reverse_radius_lookup(tokens_dir: Path) -> dict:
    """Parse effects.css, build px value → var(--radius-*) map.

    Prioritizes semantic aliases (--radius-card, --radius-button) over scale tokens.
    """
    effects_path = tokens_dir / "effects.css"
    if not effects_path.exists():
        return {}

    css_vars = _parse_css_vars(effects_path.read_text())
    px_to_token = {}

    # First pass: scale tokens
    for name, value in css_vars.items():
        if not name.startswith("--radius-"):
            continue
        # Resolve var() references
        resolved = value
        if value.startswith("var("):
            ref_name = value.replace("var(", "").rstrip(")")
            resolved = css_vars.get(ref_name, value)
        # Extract numeric px value
        m = re.match(r'^([\d.]+)px$', resolved.strip())
        if m:
            px_val = float(m.group(1))
            px_to_token[px_val] = f"var({name})"

    # Second pass: semantic aliases override
    semantic_radius = (
        "--radius-card", "--radius-button", "--radius-input",
        "--radius-modal", "--radius-avatar", "--radius-badge",
        "--radius-pill", "--radius-tag",
    )
    for name, value in css_vars.items():
        if name in semantic_radius:
            resolved = value
            if value.startswith("var("):
                ref_name = value.replace("var(", "").rstrip(")")
                resolved = css_vars.get(ref_name, value)
            m = re.match(r'^([\d.]+)px$', resolved.strip())
            if m:
                px_val = float(m.group(1))
                px_to_token[px_val] = f"var({name})"

    return px_to_token


def build_reverse_shadow_lookup(tokens_dir: Path) -> dict:
    """Parse effects.css, build normalized CSS shadow string → var(--shadow-*) map."""
    effects_path = tokens_dir / "effects.css"
    if not effects_path.exists():
        return {}

    css_vars = _parse_css_vars(effects_path.read_text())
    shadow_to_token = {}

    for name, value in css_vars.items():
        if not name.startswith("--shadow-"):
            continue
        if value == "none" or value.startswith("var("):
            continue
        # Normalize whitespace for matching
        normalized = " ".join(value.split())
        shadow_to_token[normalized] = f"var({name})"

    return shadow_to_token


# ── Role inference ───────────────────────────────────────────────────────────

def infer_role(node_name: str, node_type: str, bounds: dict, corner_radius, has_gradient: bool) -> str:
    """Pattern-match node properties to assign a semantic role."""
    name_lower = node_name.lower()
    w = bounds.get("width", 0)
    h = bounds.get("height", 0)

    # Background rectangles
    if node_type == "RECTANGLE" and any(kw in name_lower for kw in ("background", "bg")):
        return "card-background"

    # Buttons
    if any(kw in name_lower for kw in ("button", "btn")):
        return "button"

    # Dividers (thin rectangles)
    if node_type == "RECTANGLE" and (h <= 2 or w <= 2):
        return "divider"

    # Line nodes are dividers
    if node_type == "LINE":
        return "divider"

    # Avatars
    if any(kw in name_lower for kw in ("avatar", "face", "profile-pic", "user-pic")):
        return "avatar"

    # Cards
    if "card" in name_lower:
        return "card"

    # Badges/tags/chips
    if any(kw in name_lower for kw in ("badge", "tag", "chip", "label")):
        return "badge"

    # Inputs
    if any(kw in name_lower for kw in ("input", "field", "text-field", "search")):
        return "input"

    # Gradient surfaces
    if has_gradient:
        return "gradient-surface"

    return "element"


# ── Core: extract node styles ────────────────────────────────────────────────

def extract_node_styles(node: dict, color_lookup: dict, gradient_lookup: dict,
                        radius_lookup: dict, shadow_lookup: dict, path: str = "") -> list:
    """Walk subtree and extract CSS-relevant visual properties for each node.

    Returns a flat list of style entries with token-mapped values.
    """
    results = []
    name = node.get("name", "")
    node_type = node.get("type", "")
    current_path = f"{path}/{name}" if path else name

    # Skip TEXT nodes (handled by textContent)
    if node_type == "TEXT":
        return results

    # Skip invisible nodes
    if node.get("visible") is False:
        return results

    # Collect visual properties
    background = None
    background_raw = None
    border_radius = None
    shadow = None
    border = None
    opacity_val = None
    has_gradient = False

    # --- Background ---
    fills = node.get("fills", [])
    for fill in fills:
        if not fill.get("visible", True):
            continue
        fill_type = fill.get("type", "")

        if fill_type == "SOLID":
            color = fill.get("color", {})
            hex_val = rgba_to_hex(color).lower()
            fill_opacity = fill.get("opacity", 1.0)
            color_alpha = color.get("a", 1.0)

            if fill_opacity < 1.0 or color_alpha < 1.0:
                # Use rgba for semi-transparent fills
                effective_alpha = fill_opacity * color_alpha
                r = round(color.get("r", 0) * 255)
                g = round(color.get("g", 0) * 255)
                b = round(color.get("b", 0) * 255)
                background_raw = f"rgba({r}, {g}, {b}, {effective_alpha:.2f})"
                background = color_lookup.get(hex_val, background_raw)
            else:
                background_raw = hex_val
                background = color_lookup.get(hex_val, hex_val)

        elif "GRADIENT" in fill_type:
            has_gradient = True
            css_gradient = figma_gradient_to_css(fill)
            background_raw = css_gradient
            # Try to match against known gradient tokens
            matched_gradient = None
            stops = fill.get("gradientStops", [])
            stop_hexes = [rgba_to_hex(s.get("color", {})).lower() for s in stops]

            for gname, gvalue in gradient_lookup.items():
                # Check if gradient stop colors match
                gstops_match = all(
                    any(sh in gvalue.lower() for sh in [h])
                    for h in stop_hexes
                )
                if gstops_match:
                    matched_gradient = f"var({gname})"
                    break
            background = matched_gradient or css_gradient

    # --- Border Radius ---
    cr = node.get("cornerRadius")
    rr = node.get("rectangleCornerRadii")
    if rr:
        # Non-uniform radii
        unique_radii = list(set(rr))
        if len(unique_radii) == 1 and unique_radii[0] > 0:
            px_val = float(unique_radii[0])
            border_radius = radius_lookup.get(px_val, f"{unique_radii[0]}px")
        elif any(r > 0 for r in rr):
            # Map each corner individually
            mapped = []
            for r in rr:
                if r > 0:
                    mapped.append(radius_lookup.get(float(r), f"{r}px"))
                else:
                    mapped.append("0")
            border_radius = " ".join(mapped)
    elif cr is not None and cr > 0:
        border_radius = radius_lookup.get(float(cr), f"{cr}px")

    # --- Shadows ---
    effects = node.get("effects", [])
    shadow_parts = []
    for eff in effects:
        if not eff.get("visible", True):
            continue
        eff_type = eff.get("type", "")
        if eff_type in ("DROP_SHADOW", "INNER_SHADOW"):
            shadow_parts.append(figma_shadow_to_css(eff))

    if shadow_parts:
        combined_css = ", ".join(shadow_parts)
        normalized = " ".join(combined_css.split())
        shadow = shadow_lookup.get(normalized, combined_css)

    # --- Border ---
    strokes = node.get("strokes", [])
    stroke_weight = node.get("strokeWeight", 0)
    if strokes and stroke_weight and stroke_weight > 0:
        for stroke in strokes:
            if not stroke.get("visible", True):
                continue
            if stroke.get("type") == "SOLID":
                stroke_color = stroke.get("color", {})
                hex_val = rgba_to_hex(stroke_color).lower()
                color_token = color_lookup.get(hex_val, hex_val)
                border = f"{stroke_weight}px solid {color_token}"
                break

    # --- Opacity ---
    op = node.get("opacity")
    if op is not None and op < 1.0:
        opacity_val = round(op, 2)

    # Only emit entry if node has at least one visual property
    has_visuals = any(v is not None for v in [background, border_radius, shadow, border, opacity_val])

    if has_visuals:
        bounds = node.get("absoluteBoundingBox", {})
        role = infer_role(name, node_type, bounds, cr, has_gradient)

        entry = {
            "path": current_path,
            "role": role,
        }
        if background is not None:
            entry["background"] = background
        if border_radius is not None:
            entry["borderRadius"] = border_radius
        if shadow is not None:
            entry["shadow"] = shadow
        if border is not None:
            entry["border"] = border
        if opacity_val is not None:
            entry["opacity"] = opacity_val

        results.append(entry)

    # Recurse into children
    for child in node.get("children", []):
        results.extend(
            extract_node_styles(child, color_lookup, gradient_lookup,
                                radius_lookup, shadow_lookup, current_path)
        )

    return results


# ── Public API (for import by prepare-screen.py) ─────────────────────────────

def build_all_lookups(tokens_dir: Path) -> dict:
    """Build all reverse token lookup tables from token CSS files.

    Returns a dict with keys: color, gradient, radius, shadow.
    """
    color_result = build_reverse_color_lookup(tokens_dir)
    if isinstance(color_result, tuple):
        color_lookup, gradient_lookup = color_result
    else:
        color_lookup = color_result
        gradient_lookup = {}

    radius_lookup = build_reverse_radius_lookup(tokens_dir)
    shadow_lookup = build_reverse_shadow_lookup(tokens_dir)

    return {
        "color": color_lookup,
        "gradient": gradient_lookup,
        "radius": radius_lookup,
        "shadow": shadow_lookup,
    }


def extract_styles_for_sections(section_subtrees: dict, lookups: dict) -> dict:
    """Extract token-mapped styles for all sections.

    Args:
        section_subtrees: {sectionName: figmaSubtreeNode} from screen package
        lookups: result of build_all_lookups()

    Returns:
        {sectionName: [styleEntries...]} dict ready for sectionStyles in package
    """
    section_styles = {}
    for section_name, subtree in section_subtrees.items():
        styles = extract_node_styles(
            subtree,
            lookups["color"],
            lookups["gradient"],
            lookups["radius"],
            lookups["shadow"],
        )
        if styles:
            section_styles[section_name] = styles
    return section_styles


# ── Standalone CLI ───────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Extract and token-map CSS styles from Figma node subtrees"
    )
    parser.add_argument("--cache", required=True, help="Path to figma-file.json cache")
    parser.add_argument("--tokens-dir", required=True, help="Path to tokens/ directory")
    parser.add_argument("--screen", required=True, help="Screen name")
    parser.add_argument("--output", required=True, help="Output path for styles JSON")
    args = parser.parse_args()

    cache_path = Path(args.cache)
    tokens_dir = Path(args.tokens_dir)

    if not cache_path.exists():
        print(json.dumps({"error": f"Cache not found: {args.cache}"}))
        return 1

    if not tokens_dir.exists():
        print(json.dumps({"error": f"Tokens dir not found: {args.tokens_dir}"}))
        return 1

    # Load Figma data
    print(f"Loading cache for screen '{args.screen}'...", file=sys.stderr)
    with open(cache_path) as f:
        data = json.load(f)

    # Find screen (reuse logic from figma-query.py)
    screen_node = _find_screen(data, args.screen)
    if not screen_node:
        print(json.dumps({"error": f"Screen '{args.screen}' not found"}))
        return 1

    # Build lookups
    print("Building token lookups...", file=sys.stderr)
    lookups = build_all_lookups(tokens_dir)

    # Extract styles for each top-level section
    section_styles = {}
    for child in screen_node.get("children", []):
        section_name = child.get("name", "")
        styles = extract_node_styles(
            child,
            lookups["color"],
            lookups["gradient"],
            lookups["radius"],
            lookups["shadow"],
        )
        if styles:
            section_styles[section_name] = styles

    result = {"sectionStyles": section_styles}

    # Write output
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(result, f, indent=2)

    total_entries = sum(len(v) for v in section_styles.values())
    size_kb = output_path.stat().st_size / 1024
    print(json.dumps({
        "success": True,
        "screen": args.screen,
        "sections": len(section_styles),
        "totalEntries": total_entries,
        "sizeKB": f"{size_kb:.1f}",
        "path": str(output_path),
    }))
    return 0


def _find_screen(data: dict, name: str):
    """Find screen by name (minimal reimplementation for standalone use)."""
    name_lower = name.lower().replace("-", " ").replace("_", " ")
    for page in data.get("document", {}).get("children", []):
        page_name = page.get("name", "").lower()
        skip_keywords = ["component", "symbol", "thumbnail", "license", "code version",
                         "icon", "asset", "style", "token", "color", "typograph"]
        if any(kw in page_name for kw in skip_keywords):
            continue
        for child in page.get("children", []):
            if child.get("type") != "FRAME":
                continue
            sname = child.get("name", "").lower().replace("-", " ").replace("_", " ")
            if sname == name_lower or name_lower in sname:
                return child
    return None


if __name__ == "__main__":
    sys.exit(main())
