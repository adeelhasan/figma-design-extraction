#!/usr/bin/env python3
"""
prepare-components.py - Pre-package component data for LLM agent.

Bundles all component subtrees + design context into a single JSON file
so the component extraction agent needs only ~3 turns (read package → write spec).

Usage:
    python3 prepare-components.py \
      --cache ${OUTPUT_DIR}/.cache/figma-file.json \
      --context ${OUTPUT_DIR}/design-system-context.json \
      --output ${OUTPUT_DIR}/.cache/components-package.json

Output:
    Single JSON file with all component data needed for spec generation.
"""

import argparse
import json
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


def rgba_to_hex(color):
    r = round(color.get("r", 0) * 255)
    g = round(color.get("g", 0) * 255)
    b = round(color.get("b", 0) * 255)
    return f"#{r:02x}{g:02x}{b:02x}"


def is_reference_page(page_name):
    lower = page_name.lower()
    keywords = ["component", "symbol", "thumbnail", "license", "code version",
                "icon", "asset", "style", "token", "color", "typograph"]
    return any(kw in lower for kw in keywords)


# ── Component extraction ────────────────────────────────────────────────────

def find_all_components(data):
    """Find all COMPONENT and COMPONENT_SET nodes in the document."""
    components_meta = data.get("components", {})
    components = []

    def walk(node, page_name=""):
        node_type = node.get("type", "")

        if node_type in ("COMPONENT", "COMPONENT_SET"):
            comp_id = node.get("id")
            meta = components_meta.get(comp_id, {})
            bbox = node.get("absoluteBoundingBox", {})

            comp = {
                "id": comp_id,
                "name": meta.get("name", node.get("name", "")),
                "type": node_type,
                "page": page_name,
                "dimensions": {
                    "width": bbox.get("width"),
                    "height": bbox.get("height"),
                },
                "subtree": slim_node(node),
            }

            # For component sets, extract variant info
            if node_type == "COMPONENT_SET":
                variants = []
                variant_properties = {}

                for child in node.get("children", []):
                    variant_name = child.get("name", "")
                    child_bbox = child.get("absoluteBoundingBox", {})

                    # Parse "Prop=Value, Prop=Value" format
                    props = {}
                    parts = variant_name.split(",")
                    for part in parts:
                        part = part.strip()
                        if "=" in part:
                            key, val = part.split("=", 1)
                            key = key.strip()
                            val = val.strip()
                            props[key] = val
                            if key not in variant_properties:
                                variant_properties[key] = set()
                            variant_properties[key].add(val)

                    variants.append({
                        "name": variant_name,
                        "properties": props,
                        "dimensions": {
                            "width": child_bbox.get("width"),
                            "height": child_bbox.get("height"),
                        },
                    })

                comp["variants"] = variants
                comp["variantProperties"] = {
                    k: sorted(v) for k, v in variant_properties.items()
                }
                comp["totalVariants"] = len(variants)

            else:
                # Standalone component - extract key visual properties
                comp["fills"] = [
                    f for f in node.get("fills", []) if f.get("visible", True)
                ]
                comp["effects"] = [
                    e for e in node.get("effects", []) if e.get("visible", True)
                ]
                comp["cornerRadius"] = node.get("cornerRadius")
                comp["layoutMode"] = node.get("layoutMode")
                comp["itemSpacing"] = node.get("itemSpacing")

                children = node.get("children", [])
                comp["childCount"] = len(children)
                comp["childNames"] = [c.get("name", "?") for c in children]

            components.append(comp)

        # Recurse into children (but not into component children - already captured in subtree)
        if node_type not in ("COMPONENT", "COMPONENT_SET"):
            for child in node.get("children", []):
                walk(child, page_name)

    for page in data.get("document", {}).get("children", []):
        walk(page, page.get("name", ""))

    return components


def extract_token_summary(data):
    """Extract a compact summary of the design's token usage for context."""
    colors = set()
    text_styles = set()
    effects = set()
    radii = set()

    def walk(node, depth=0):
        # Colors
        for fill in node.get("fills", []):
            if fill.get("type") == "SOLID" and fill.get("visible", True):
                color = fill.get("color", {})
                colors.add(rgba_to_hex(color))

        # Text styles
        if node.get("type") == "TEXT":
            style = node.get("style", {})
            if style:
                key = (
                    style.get("fontFamily", ""),
                    style.get("fontSize", 0),
                    style.get("fontWeight", 400),
                )
                text_styles.add(key)

        # Effects
        for eff in node.get("effects", []):
            if eff.get("visible", True):
                effects.add(eff.get("type"))

        # Radii
        cr = node.get("cornerRadius")
        if cr and cr > 0:
            radii.add(cr)

        for child in node.get("children", []):
            walk(child, depth + 1)

    for page in data.get("document", {}).get("children", []):
        walk(page)

    return {
        "uniqueColors": len(colors),
        "uniqueTextStyles": len(text_styles),
        "effectTypes": sorted(effects),
        "uniqueRadii": sorted(radii),
    }


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Pre-package component data for LLM extraction"
    )
    parser.add_argument("--cache", required=True, help="Path to figma-file.json cache")
    parser.add_argument("--context", required=True, help="Path to design-system-context.json")
    parser.add_argument("--output", required=True, help="Output path for components-package.json")
    args = parser.parse_args()

    cache_path = Path(args.cache)
    context_path = Path(args.context)

    if not cache_path.exists():
        print(json.dumps({"success": False, "error": f"Cache not found: {args.cache}"}))
        return 1

    if not context_path.exists():
        print(json.dumps({"success": False, "error": f"Context not found: {args.context}"}))
        return 1

    print(f"Loading cache from {args.cache}...", file=sys.stderr)
    with open(cache_path) as f:
        data = json.load(f)

    print(f"Loading design context from {args.context}...", file=sys.stderr)
    with open(context_path) as f:
        design_context = json.load(f)

    print("Finding components...", file=sys.stderr)
    components = find_all_components(data)

    print(f"Found {len(components)} components", file=sys.stderr)

    token_summary = extract_token_summary(data)

    # Build package
    package = {
        "version": "1.0",
        "description": "Pre-packaged component data for spec generation",
        "designContext": design_context,
        "tokenSummary": token_summary,
        "componentCount": len(components),
        "components": components,
    }

    # Write package
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w") as f:
        json.dump(package, f, indent=2)

    # Size check
    size_kb = output_path.stat().st_size / 1024

    result = {
        "success": True,
        "componentCount": len(components),
        "componentNames": [c["name"] for c in components],
        "packageSize": f"{size_kb:.1f}KB",
        "path": str(output_path),
    }

    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
