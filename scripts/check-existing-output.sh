#!/bin/bash
#
# check-existing-output.sh - Check if design system output already exists
#
# Usage: ./scripts/check-existing-output.sh
#
# Exit codes:
#   0 - No existing output (safe to proceed)
#   1 - Existing output found (need user decision)
#
# This script is called by Claude Code hooks before extraction starts.

OUTPUT_DIR="design-system"

if [[ -d "$OUTPUT_DIR" ]]; then
  # Count existing files
  token_count=$(find "$OUTPUT_DIR/tokens" -name "*.css" 2>/dev/null | wc -l | tr -d ' ')
  spec_count=$(find "$OUTPUT_DIR/specs" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
  preview_count=$(find "$OUTPUT_DIR/preview" -name "*.html" 2>/dev/null | wc -l | tr -d ' ')

  echo "⚠️  EXISTING OUTPUT DETECTED"
  echo ""
  echo "Found in $OUTPUT_DIR/:"
  echo "  - Token files: $token_count"
  echo "  - Spec files: $spec_count"
  echo "  - Preview files: $preview_count"
  echo ""
  echo "Options:"
  echo "  1. Delete existing and start fresh"
  echo "  2. Overwrite into existing folder"
  echo "  3. Abort extraction"
  echo ""
  echo "Please choose an option before proceeding."

  exit 1
else
  echo "✓ No existing output found. Safe to proceed."
  exit 0
fi
