#!/bin/bash
# Clean extraction and generation output
# Usage: ./scripts/clean-output.sh [--all]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

CLEAN_ALL=false

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --all) CLEAN_ALL=true ;;
        -h|--help)
            echo "Usage: $0 [--all]"
            echo ""
            echo "Clean design system extraction and generation output."
            echo ""
            echo "Options:"
            echo "  --all    Also delete generated app pages (dashboard, signin, etc.)"
            echo "  -h       Show this help message"
            exit 0
            ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
    shift
done

cd "$PROJECT_ROOT"

echo "Cleaning design system output..."
echo ""

# Design system generated files
if [ -d "design-system/tokens" ]; then
    rm -rf design-system/tokens/
    echo "✓ Removed design-system/tokens/"
fi

if [ -d "design-system/specs" ]; then
    rm -rf design-system/specs/
    echo "✓ Removed design-system/specs/"
fi

if [ -d "design-system/preview" ]; then
    rm -rf design-system/preview/
    echo "✓ Removed design-system/preview/"
fi

if [ -f "design-system/extraction-meta.json" ]; then
    rm -f design-system/extraction-meta.json
    echo "✓ Removed design-system/extraction-meta.json"
fi

if [ -f "design-system/extraction-report.md" ]; then
    rm -f design-system/extraction-report.md
    echo "✓ Removed design-system/extraction-report.md"
fi

# App copies
if [ -d "app/design-system" ]; then
    rm -rf app/design-system/
    echo "✓ Removed app/design-system/"
fi

if [ -d "app/src/components/ui" ]; then
    rm -rf app/src/components/ui/
    echo "✓ Removed app/src/components/ui/"
fi

# Optionally clean generated pages
if [ "$CLEAN_ALL" = true ]; then
    echo ""
    echo "Cleaning generated pages..."

    for page in dashboard signin signup tables billing profile; do
        if [ -d "app/src/app/$page" ]; then
            rm -rf "app/src/app/$page/"
            echo "✓ Removed app/src/app/$page/"
        fi
    done
fi

echo ""
echo "Done. Run /extract-design to start fresh."
