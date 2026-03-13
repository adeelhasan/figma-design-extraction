#!/usr/bin/env python3
"""
Figma Query Tool — Extract specific data from cached Figma API response.

Agents call this via Bash to get focused slices of the 2.5MB cache file
instead of loading the entire thing into context.

Usage:
    python3 figma-query.py [--cache PATH] <command> [args...]

Commands:
    essentials                     Compact table-of-contents summary (~5-10KB)
    colors                         All unique solid fill colors with hex + context
    gradients                      All gradient definitions (type, angle, stops)
    text-styles                    All unique font/size/weight/lineHeight combos
    effects                        All shadow + blur definitions
    radii                          All unique corner radius values
    spacing                        Auto-layout spacing values
    screen-layout <screen>         Top-level sections of a screen frame
    section <screen> <path>        Full subtree of a named section
    components                     All component definitions
    component <name>               Specific component subtree
"""

import argparse
import json
import math
import sys
from collections import OrderedDict
from pathlib import Path


def load_cache(cache_path: str) -> dict:
    p = Path(cache_path)
    if not p.exists():
        print(f"Error: Cache file not found: {cache_path}", file=sys.stderr)
        sys.exit(1)
    with open(p) as f:
        return json.load(f)


# ── Helpers ──────────────────────────────────────────────────────────────────

def rgba_to_hex(color: dict) -> str:
    r = round(color.get("r", 0) * 255)
    g = round(color.get("g", 0) * 255)
    b = round(color.get("b", 0) * 255)
    return f"#{r:02x}{g:02x}{b:02x}"


def rgba_to_str(color: dict) -> str:
    a = color.get("a", 1.0)
    if a < 1.0:
        r = round(color["r"] * 255)
        g = round(color["g"] * 255)
        b = round(color["b"] * 255)
        return f"rgba({r}, {g}, {b}, {a:.2f})"
    return rgba_to_hex(color)


def gradient_angle(handles: list) -> float:
    """Convert Figma gradient handle positions to CSS angle in degrees."""
    if len(handles) < 2:
        return 180.0
    start = handles[0]
    end = handles[1]
    dx = end["x"] - start["x"]
    dy = end["y"] - start["y"]
    # Figma uses a coordinate system where y increases downward
    angle_rad = math.atan2(dx, -dy)
    angle_deg = math.degrees(angle_rad)
    # Normalize to 0-360
    return round(angle_deg % 360, 1)


def is_reference_page(page_name: str) -> bool:
    """Pages that contain reference material, not app screens."""
    lower = page_name.lower()
    keywords = ["component", "symbol", "thumbnail", "license", "code version",
                "icon", "asset", "style", "token", "color", "typograph"]
    return any(kw in lower for kw in keywords)


def is_screen_like(node: dict) -> bool:
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


def get_pages(doc: dict) -> list:
    return doc.get("document", {}).get("children", [])


def find_screens(data: dict) -> list:
    """Return list of (screen_node, page_name) tuples.
    Only considers screens from non-reference pages."""
    screens = []
    for page in get_pages(data):
        if is_reference_page(page["name"]):
            continue
        for child in page.get("children", []):
            if child.get("type") == "FRAME" and is_screen_like(child):
                screens.append((child, page["name"]))
    return screens


def find_screen_by_name(data: dict, name: str) -> dict | None:
    """Find a screen frame by name (case-insensitive, partial match)."""
    name_lower = name.lower().replace("-", " ").replace("_", " ")
    for screen, _ in find_screens(data):
        sname = screen["name"].lower().replace("-", " ").replace("_", " ")
        if sname == name_lower or name_lower in sname:
            return screen
    return None


def walk_nodes(node: dict, visitor, depth=0):
    """Walk the node tree, calling visitor(node, depth) on each node."""
    visitor(node, depth)
    for child in node.get("children", []):
        walk_nodes(child, visitor, depth + 1)


# Keys to strip — layout/rendering metadata not needed for HTML extraction
SLIM_STRIP_KEYS = {
    "id", "scrollBehavior", "blendMode", "constraints",
    "absoluteBoundingBox", "absoluteRenderBounds",
    "interactions", "complexStrokeProperties", "strokeType",
    "strokeAlign", "strokeWeight", "exportSettings",
    "layoutAlign", "layoutGrow", "layoutSizingHorizontal",
    "layoutSizingVertical", "primaryAxisAlignItems",
    "counterAxisAlignItems", "primaryAxisSizingMode",
    "counterAxisSizingMode", "isMask", "isMaskOutline",
    "preserveRatio", "locked", "componentPropertyReferences",
    "overrides", "componentId", "isFixed",
}


def slim_node(node):
    """Strip verbose metadata from a node tree, keeping structure + visual properties."""
    if isinstance(node, dict):
        return {k: slim_node(v) for k, v in node.items() if k not in SLIM_STRIP_KEYS}
    elif isinstance(node, list):
        return [slim_node(item) for item in node]
    return node


def node_summary(node: dict, max_children_depth: int = 0) -> dict:
    """Create a compact summary of a node without full subtree."""
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


# ── Commands ─────────────────────────────────────────────────────────────────

def cmd_essentials(data: dict):
    """Generate compact table-of-contents summary."""
    doc = data.get("document", {})
    result = {
        "file": {
            "name": data.get("name"),
            "lastModified": data.get("lastModified"),
            "version": data.get("version"),
        },
        "pages": [],
        "designSummary": {},
    }

    # Collect stats while building page list
    all_colors = set()
    all_text_styles = set()
    all_gradients = []
    all_effect_types = set()
    all_radii = set()
    component_count = len(data.get("components", {}))

    def collect_stats(node, depth):
        # Colors
        for fill in node.get("fills", []):
            if fill.get("type") == "SOLID" and fill.get("visible", True):
                color = fill.get("color", {})
                all_colors.add(rgba_to_hex(color))
            elif "GRADIENT" in fill.get("type", "") and fill.get("visible", True):
                all_gradients.append(fill)
        # Text styles
        if node.get("type") == "TEXT":
            style = node.get("style", {})
            if style:
                key = (
                    style.get("fontFamily", ""),
                    style.get("fontSize", 0),
                    style.get("fontWeight", 400),
                    style.get("lineHeightPx", 0),
                )
                all_text_styles.add(key)
        # Effects
        for eff in node.get("effects", []):
            if eff.get("visible", True):
                all_effect_types.add(eff.get("type"))
        # Radii
        cr = node.get("cornerRadius")
        if cr is not None and cr > 0:
            all_radii.add(cr)
        rr = node.get("rectangleCornerRadii")
        if rr:
            for r in rr:
                if r > 0:
                    all_radii.add(r)

    for page in doc.get("children", []):
        page_info = {"name": page["name"], "frames": [], "screens": []}
        ref_page = is_reference_page(page["name"])
        for child in page.get("children", []):
            if child.get("type") in ("FRAME", "COMPONENT", "COMPONENT_SET"):
                if not ref_page and child.get("type") == "FRAME" and is_screen_like(child):
                    bbox = child.get("absoluteBoundingBox", {})
                    sections = [
                        c.get("name", "?")
                        for c in child.get("children", [])
                    ]
                    page_info["screens"].append({
                        "name": child["name"],
                        "id": child["id"],
                        "width": bbox.get("width"),
                        "height": bbox.get("height"),
                        "sections": sections,
                    })
                else:
                    page_info["frames"].append(child["name"])
        # Only include pages with content
        if page_info["frames"] or page_info["screens"]:
            result["pages"].append(page_info)
        # Walk this page for stats
        walk_nodes(page, collect_stats)

    # Deduplicate gradients by stops
    unique_gradients = set()
    for g in all_gradients:
        stops = tuple(
            rgba_to_hex(s["color"]) for s in g.get("gradientStops", [])
        )
        unique_gradients.add(stops)

    result["designSummary"] = {
        "uniqueColors": len(all_colors),
        "uniqueTextStyles": len(all_text_styles),
        "uniqueGradients": len(unique_gradients),
        "effectTypes": sorted(all_effect_types),
        "uniqueRadii": sorted(all_radii),
        "publishedStyles": len(data.get("styles", {})),
        "components": component_count,
    }

    return result


def cmd_colors(data: dict):
    """Extract all unique solid fill colors with context."""
    colors = {}  # hex -> list of contexts

    def visitor(node, depth):
        for fill in node.get("fills", []):
            if fill.get("type") == "SOLID" and fill.get("visible", True):
                color = fill.get("color", {})
                hex_val = rgba_to_hex(color)
                alpha = color.get("a", 1.0)
                ctx = {
                    "nodeName": node.get("name"),
                    "nodeType": node.get("type"),
                }
                if alpha < 1.0:
                    ctx["alpha"] = round(alpha, 2)
                    ctx["rgba"] = rgba_to_str(color)
                colors.setdefault(hex_val, []).append(ctx)

    for page in get_pages(data):
        walk_nodes(page, visitor)

    # Deduplicate contexts and limit to 3 examples per color
    result = []
    for hex_val, contexts in sorted(colors.items()):
        seen_names = set()
        unique_ctx = []
        for ctx in contexts:
            name = ctx["nodeName"]
            if name not in seen_names:
                seen_names.add(name)
                unique_ctx.append(ctx)
            if len(unique_ctx) >= 3:
                break
        entry = {
            "hex": hex_val,
            "occurrences": len(contexts),
            "examples": unique_ctx,
        }
        if contexts[0].get("rgba"):
            entry["rgba"] = contexts[0]["rgba"]
        result.append(entry)

    # Sort by occurrence count descending
    result.sort(key=lambda x: x["occurrences"], reverse=True)
    return {"colors": result, "totalUnique": len(result)}


def cmd_gradients(data: dict):
    """Extract all gradient definitions."""
    gradients = []
    seen = set()

    def visitor(node, depth):
        for fill in node.get("fills", []):
            if "GRADIENT" in fill.get("type", "") and fill.get("visible", True):
                stops = fill.get("gradientStops", [])
                handles = fill.get("gradientHandlePositions", [])
                stop_key = tuple(
                    (rgba_to_hex(s["color"]), round(s["position"], 2))
                    for s in stops
                )
                if stop_key in seen:
                    return
                seen.add(stop_key)

                angle = gradient_angle(handles)
                grad = {
                    "type": fill["type"],
                    "angle": angle,
                    "stops": [
                        {
                            "color": rgba_to_str(s["color"]),
                            "hex": rgba_to_hex(s["color"]),
                            "position": round(s["position"], 2),
                        }
                        for s in stops
                    ],
                    "nodeName": node.get("name"),
                    "nodeType": node.get("type"),
                }
                gradients.append(grad)

    for page in get_pages(data):
        walk_nodes(page, visitor)

    return {"gradients": gradients, "totalUnique": len(gradients)}


def cmd_text_styles(data: dict):
    """Extract all unique text style combinations."""
    styles = {}  # key -> style info

    def visitor(node, depth):
        if node.get("type") != "TEXT":
            return
        style = node.get("style", {})
        if not style:
            return
        family = style.get("fontFamily", "unknown")
        size = style.get("fontSize", 0)
        weight = style.get("fontWeight", 400)
        lh = style.get("lineHeightPx", 0)
        ls = style.get("letterSpacing", 0)
        key = (family, size, weight, round(lh, 1), round(ls, 2))
        if key not in styles:
            styles[key] = {
                "fontFamily": family,
                "fontSize": size,
                "fontWeight": weight,
                "fontStyle": style.get("fontStyle", "Regular"),
                "lineHeightPx": round(lh, 1) if lh else None,
                "letterSpacing": round(ls, 2) if ls else None,
                "textAlignHorizontal": style.get("textAlignHorizontal"),
                "examples": [],
            }
        if len(styles[key]["examples"]) < 3:
            chars = node.get("characters", "")
            styles[key]["examples"].append({
                "nodeName": node.get("name"),
                "text": chars[:60] + ("..." if len(chars) > 60 else ""),
            })

    for page in get_pages(data):
        walk_nodes(page, visitor)

    result = sorted(styles.values(), key=lambda s: -s["fontSize"])
    return {"textStyles": result, "totalUnique": len(result)}


def cmd_effects(data: dict):
    """Extract all shadow and blur effect definitions."""
    effects = {}  # key -> effect info

    def visitor(node, depth):
        for eff in node.get("effects", []):
            if not eff.get("visible", True):
                continue
            etype = eff.get("type")
            if etype not in ("DROP_SHADOW", "INNER_SHADOW", "LAYER_BLUR", "BACKGROUND_BLUR"):
                continue

            if etype in ("DROP_SHADOW", "INNER_SHADOW"):
                offset = eff.get("offset", {})
                color = eff.get("color", {})
                key = (
                    etype,
                    offset.get("x", 0),
                    offset.get("y", 0),
                    eff.get("radius", 0),
                    eff.get("spread", 0),
                    rgba_to_str(color),
                )
                if key not in effects:
                    effects[key] = {
                        "type": etype,
                        "offset": {"x": offset.get("x", 0), "y": offset.get("y", 0)},
                        "radius": eff.get("radius", 0),
                        "spread": eff.get("spread", 0),
                        "color": rgba_to_str(color),
                        "css": _shadow_to_css(eff),
                        "examples": [],
                    }
                if len(effects[key]["examples"]) < 2:
                    effects[key]["examples"].append(node.get("name"))
            else:
                key = (etype, eff.get("radius", 0))
                if key not in effects:
                    effects[key] = {
                        "type": etype,
                        "radius": eff.get("radius", 0),
                        "css": f"blur({eff.get('radius', 0)}px)",
                        "examples": [],
                    }
                if len(effects[key]["examples"]) < 2:
                    effects[key]["examples"].append(node.get("name"))

    for page in get_pages(data):
        walk_nodes(page, visitor)

    result = list(effects.values())
    return {"effects": result, "totalUnique": len(result)}


def _shadow_to_css(eff: dict) -> str:
    offset = eff.get("offset", {})
    x = offset.get("x", 0)
    y = offset.get("y", 0)
    radius = eff.get("radius", 0)
    spread = eff.get("spread", 0)
    color = eff.get("color", {})
    rgba = rgba_to_str(color)
    inset = "inset " if eff.get("type") == "INNER_SHADOW" else ""
    parts = [f"{inset}{x}px", f"{y}px", f"{radius}px"]
    if spread:
        parts.append(f"{spread}px")
    parts.append(rgba)
    return " ".join(parts)


def cmd_radii(data: dict):
    """Extract all unique corner radius values with context."""
    radii = {}  # value -> examples

    def visitor(node, depth):
        cr = node.get("cornerRadius")
        if cr is not None and cr > 0:
            radii.setdefault(cr, [])
            if len(radii[cr]) < 3:
                radii[cr].append({
                    "nodeName": node.get("name"),
                    "nodeType": node.get("type"),
                })
        rr = node.get("rectangleCornerRadii")
        if rr:
            for r in rr:
                if r > 0:
                    radii.setdefault(r, [])

    for page in get_pages(data):
        walk_nodes(page, visitor)

    result = [
        {"value": v, "px": f"{v}px", "examples": exs}
        for v, exs in sorted(radii.items())
    ]
    return {"radii": result, "totalUnique": len(result)}


def cmd_spacing(data: dict):
    """Extract auto-layout spacing values."""
    spacings = {}  # value -> contexts

    def visitor(node, depth):
        if not node.get("layoutMode"):
            return
        item_spacing = node.get("itemSpacing")
        if item_spacing is not None and item_spacing > 0:
            spacings.setdefault(item_spacing, {"type": "itemSpacing", "examples": []})
            if len(spacings[item_spacing]["examples"]) < 3:
                spacings[item_spacing]["examples"].append(node.get("name"))

        for key in ("paddingLeft", "paddingRight", "paddingTop", "paddingBottom"):
            val = node.get(key)
            if val is not None and val > 0:
                spacings.setdefault(val, {"type": "padding", "examples": []})
                if len(spacings[val]["examples"]) < 3:
                    spacings[val]["examples"].append(f"{node.get('name')}.{key}")

        counter = node.get("counterAxisSpacing")
        if counter is not None and counter > 0:
            spacings.setdefault(counter, {"type": "counterAxisSpacing", "examples": []})

    for page in get_pages(data):
        walk_nodes(page, visitor)

    result = [
        {"value": v, "px": f"{v}px", **info}
        for v, info in sorted(spacings.items())
    ]
    return {"spacing": result, "totalUnique": len(result)}


def cmd_screen_layout(data: dict, screen_name: str):
    """Return top-level sections of a screen frame (not full subtrees)."""
    screen = find_screen_by_name(data, screen_name)
    if not screen:
        return {"error": f"Screen '{screen_name}' not found", "available": [
            s["name"] for s, _ in find_screens(data)
        ]}

    bbox = screen.get("absoluteBoundingBox", {})
    sections = []
    for child in screen.get("children", []):
        sections.append(node_summary(child, max_children_depth=1))

    return {
        "screen": screen["name"],
        "id": screen["id"],
        "dimensions": {
            "width": bbox.get("width"),
            "height": bbox.get("height"),
        },
        "layoutMode": screen.get("layoutMode"),
        "sections": sections,
    }


def cmd_section(data: dict, screen_name: str, section_path: str, slim: bool = False):
    """Return full subtree of a named section within a screen."""
    screen = find_screen_by_name(data, screen_name)
    if not screen:
        return {"error": f"Screen '{screen_name}' not found"}

    # Navigate the path (e.g., "content/Widget-1")
    parts = section_path.split("/")
    current = screen
    for part in parts:
        found = None
        part_lower = part.lower().replace("-", " ").replace("_", " ")
        for child in current.get("children", []):
            child_name = child.get("name", "").lower().replace("-", " ").replace("_", " ")
            if child_name == part_lower or part_lower in child_name:
                found = child
                break
        if not found:
            available = [c.get("name", "?") for c in current.get("children", [])]
            return {
                "error": f"Section '{part}' not found in '{current.get('name')}'",
                "available": available,
            }
        current = found

    return slim_node(current) if slim else current


def cmd_components(data: dict):
    """Return all component definitions with variants."""
    components_meta = data.get("components", {})
    components = []

    # Find component nodes in the tree
    def visitor(node, depth):
        if node.get("type") in ("COMPONENT", "COMPONENT_SET"):
            comp_id = node.get("id")
            meta = components_meta.get(comp_id, {})
            comp = {
                "id": comp_id,
                "name": meta.get("name", node.get("name")),
                "type": node.get("type"),
            }
            bbox = node.get("absoluteBoundingBox", {})
            if bbox:
                comp["dimensions"] = {
                    "width": bbox.get("width"),
                    "height": bbox.get("height"),
                }
            if node.get("type") == "COMPONENT_SET":
                comp["variants"] = [
                    {"name": c.get("name"), "id": c.get("id")}
                    for c in node.get("children", [])
                ]
            else:
                # For standalone components, include key properties
                comp["fills"] = [
                    f for f in node.get("fills", []) if f.get("visible", True)
                ]
                comp["effects"] = [
                    e for e in node.get("effects", []) if e.get("visible", True)
                ]
                comp["cornerRadius"] = node.get("cornerRadius")
                if node.get("children"):
                    comp["childCount"] = len(node["children"])
                    comp["childNames"] = [
                        c.get("name", "?") for c in node["children"]
                    ]
            components.append(comp)

    for page in get_pages(data):
        walk_nodes(page, visitor)

    return {"components": components, "totalCount": len(components)}


def cmd_component(data: dict, name: str):
    """Return specific component subtree by name."""
    name_lower = name.lower()

    def find_component(node):
        if node.get("type") in ("COMPONENT", "COMPONENT_SET"):
            if node.get("name", "").lower() == name_lower:
                return node
        for child in node.get("children", []):
            result = find_component(child)
            if result:
                return result
        return None

    for page in get_pages(data):
        result = find_component(page)
        if result:
            return result

    # Try partial match
    for page in get_pages(data):
        def find_partial(node):
            if node.get("type") in ("COMPONENT", "COMPONENT_SET"):
                if name_lower in node.get("name", "").lower():
                    return node
            for child in node.get("children", []):
                r = find_partial(child)
                if r:
                    return r
            return None
        result = find_partial(page)
        if result:
            return result

    return {"error": f"Component '{name}' not found"}


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Query cached Figma data for specific slices"
    )
    parser.add_argument(
        "--cache",
        default=None,
        help="Path to figma-file.json cache (default: auto-detect)",
    )
    subparsers = parser.add_subparsers(dest="command", help="Query command")

    subparsers.add_parser("essentials", help="Compact table-of-contents summary")
    subparsers.add_parser("colors", help="All unique solid fill colors")
    subparsers.add_parser("gradients", help="All gradient definitions")
    subparsers.add_parser("text-styles", help="All unique text styles")
    subparsers.add_parser("effects", help="All shadow/blur effects")
    subparsers.add_parser("radii", help="All corner radius values")
    subparsers.add_parser("spacing", help="Auto-layout spacing values")

    p_sl = subparsers.add_parser("screen-layout", help="Screen top-level sections")
    p_sl.add_argument("screen", help="Screen name")

    p_sec = subparsers.add_parser("section", help="Section subtree")
    p_sec.add_argument("screen", help="Screen name")
    p_sec.add_argument("path", help="Section path (e.g. 'sidebar' or 'content/Widget-1')")
    p_sec.add_argument("--slim", action="store_true", help="Strip layout metadata for smaller output")

    subparsers.add_parser("components", help="All component definitions")

    p_comp = subparsers.add_parser("component", help="Specific component subtree")
    p_comp.add_argument("name", help="Component name")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    # Auto-detect cache path
    cache_path = args.cache
    if not cache_path:
        # Try common locations
        candidates = [
            Path.cwd() / ".cache" / "figma-file.json",
            Path.cwd() / "design-system" / ".cache" / "figma-file.json",
        ]
        for c in candidates:
            if c.exists():
                cache_path = str(c)
                break
        if not cache_path:
            print("Error: No cache file found. Specify with --cache PATH", file=sys.stderr)
            sys.exit(1)

    data = load_cache(cache_path)

    # Dispatch
    commands = {
        "essentials": lambda: cmd_essentials(data),
        "colors": lambda: cmd_colors(data),
        "gradients": lambda: cmd_gradients(data),
        "text-styles": lambda: cmd_text_styles(data),
        "effects": lambda: cmd_effects(data),
        "radii": lambda: cmd_radii(data),
        "spacing": lambda: cmd_spacing(data),
        "screen-layout": lambda: cmd_screen_layout(data, args.screen),
        "section": lambda: cmd_section(data, args.screen, args.path, getattr(args, 'slim', False)),
        "components": lambda: cmd_components(data),
        "component": lambda: cmd_component(data, args.name),
    }

    result = commands[args.command]()
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
