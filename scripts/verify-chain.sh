#!/bin/bash
#
# verify-chain.sh - Verify the extraction prompt chain is complete and valid
#
# Usage: ./scripts/verify-chain.sh
#
# Checks:
# 1. All prompt files exist
# 2. Each "Next Step" link points to an existing file
# 3. Chain forms a complete path from connect.md to preview.md
# 4. No orphaned prompts (files not in the chain)

set -e

PROMPTS_DIR=".claude/skills/figma-extraction/prompts"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Expected chain order
EXPECTED_CHAIN=(
  "connect.md"
  "extract-colors.md"
  "extract-typography.md"
  "extract-spacing.md"
  "extract-effects.md"
  "extract-components.md"
  "extract-layouts.md"
  "extract-icons.md"
  "extract-assets.md"
  "extract-content.md"
  "validate.md"
  "preview.md"
)

echo "=================================="
echo "Extraction Chain Verification"
echo "=================================="
echo ""

errors=0
warnings=0

# Check 1: All expected files exist
echo "Check 1: Required files exist"
echo "------------------------------"
for file in "${EXPECTED_CHAIN[@]}"; do
  if [[ -f "$PROMPTS_DIR/$file" ]]; then
    echo -e "  ${GREEN}✓${NC} $file"
  else
    echo -e "  ${RED}✗${NC} $file - MISSING"
    ((errors++))
  fi
done

# Also check for CHECKLIST.md
if [[ -f "$PROMPTS_DIR/CHECKLIST.md" ]]; then
  echo -e "  ${GREEN}✓${NC} CHECKLIST.md"
else
  echo -e "  ${RED}✗${NC} CHECKLIST.md - MISSING"
  ((errors++))
fi
echo ""

# Check 2: Verify chain links
echo "Check 2: Chain link verification"
echo "---------------------------------"
for i in "${!EXPECTED_CHAIN[@]}"; do
  current="${EXPECTED_CHAIN[$i]}"

  if [[ $i -lt $((${#EXPECTED_CHAIN[@]} - 1)) ]]; then
    expected_next="${EXPECTED_CHAIN[$((i+1))]}"

    if [[ -f "$PROMPTS_DIR/$current" ]]; then
      # Extract the "Proceed to:" target
      actual_next=$(grep -o "Proceed to: \`[^\`]*\`" "$PROMPTS_DIR/$current" 2>/dev/null | head -1 | sed 's/Proceed to: `\([^`]*\)`/\1/')

      if [[ -z "$actual_next" ]]; then
        echo -e "  ${YELLOW}⚠${NC} $current - No 'Next Step' found"
        ((warnings++))
      elif [[ "$actual_next" == "$expected_next" ]]; then
        echo -e "  ${GREEN}✓${NC} $current → $actual_next"
      else
        echo -e "  ${RED}✗${NC} $current → $actual_next (expected: $expected_next)"
        ((errors++))
      fi
    fi
  else
    echo -e "  ${GREEN}✓${NC} $current → END (final step)"
  fi
done
echo ""

# Check 3: Look for orphaned files
echo "Check 3: Orphaned files check"
echo "-----------------------------"
for file in "$PROMPTS_DIR"/*.md; do
  filename=$(basename "$file")

  # Skip CHECKLIST.md - it's not in the chain but is required
  if [[ "$filename" == "CHECKLIST.md" ]]; then
    continue
  fi

  # Check if file is in expected chain
  found=false
  for expected in "${EXPECTED_CHAIN[@]}"; do
    if [[ "$filename" == "$expected" ]]; then
      found=true
      break
    fi
  done

  if [[ "$found" == false ]]; then
    echo -e "  ${YELLOW}⚠${NC} $filename - Not in chain (orphaned?)"
    ((warnings++))
  fi
done

if [[ $warnings -eq 0 ]]; then
  echo -e "  ${GREEN}✓${NC} No orphaned files"
fi
echo ""

# Summary
echo "=================================="
echo "Summary"
echo "=================================="
if [[ $errors -eq 0 && $warnings -eq 0 ]]; then
  echo -e "${GREEN}✓ Chain verification passed${NC}"
  exit 0
elif [[ $errors -eq 0 ]]; then
  echo -e "${YELLOW}⚠ Chain valid with $warnings warning(s)${NC}"
  exit 0
else
  echo -e "${RED}✗ Chain verification failed: $errors error(s), $warnings warning(s)${NC}"
  exit 1
fi
