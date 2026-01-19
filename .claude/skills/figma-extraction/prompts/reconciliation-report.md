# Reconciliation Report (Improvement 7)

## Purpose

Generate a comprehensive reconciliation report comparing extracted sections against the
visual inventory, showing coverage, pattern matches, actions captured, and recommendations.

## When to Generate

This report is generated:
- After extraction completes (always)
- With detailed comparison when `--thorough` mode was used (inventory exists)
- As part of `/sync --check` to preview changes

## Report Structure

### Section Coverage Table

```typescript
interface SectionCoverageRow {
  inventorySection: string;
  extracted: boolean;
  pattern: string;
  contentMatch: 'full' | 'partial' | 'none';
  extractionPass?: number;  // 1, 2, or 3
  score: number;
}

function generateSectionCoverageTable(
  inventory: VisualInventory,
  extracted: Section[],
  validationResults: ValidationResult[]
): SectionCoverageRow[] {
  const rows: SectionCoverageRow[] = [];

  for (const invSection of inventory.sections) {
    const extSection = extracted.find(s =>
      s.targetId === invSection.id ||
      s.id === invSection.id ||
      s.name.toLowerCase().includes(invSection.id.toLowerCase())
    );

    const validation = extSection
      ? validationResults.find(v => v.sectionId === extSection.id)
      : null;

    rows.push({
      inventorySection: invSection.id,
      extracted: !!extSection,
      pattern: extSection?.pattern || invSection.pattern || invSection.type,
      contentMatch: calculateContentMatch(invSection, extSection),
      extractionPass: extSection?.extractionPass,
      score: validation?.score || 0
    });
  }

  return rows;
}

function calculateContentMatch(
  invSection: InventorySection,
  extSection: Section | undefined
): 'full' | 'partial' | 'none' {
  if (!extSection) return 'none';
  if (!invSection.content && !invSection.children) return 'full';

  let matchCount = 0;
  let totalExpected = 0;

  // Check content fields
  if (invSection.content) {
    const expectedFields = Object.keys(invSection.content);
    totalExpected += expectedFields.length;

    for (const field of expectedFields) {
      const expectedValue = invSection.content[field];
      if (extSection.content?.[field] === expectedValue) {
        matchCount++;
      }
    }
  }

  // Check child count
  if (invSection.children?.count) {
    totalExpected++;
    if ((extSection.childCount || 0) >= invSection.children.count * 0.8) {
      matchCount++;
    }
  }

  if (totalExpected === 0) return 'full';
  if (matchCount === totalExpected) return 'full';
  if (matchCount > 0) return 'partial';
  return 'none';
}
```

### Action Coverage Table

```typescript
interface ActionCoverageRow {
  section: string;
  expectedActions: string[];
  foundActions: string[];
  missing: string[];
}

function generateActionCoverageTable(
  inventory: VisualInventory,
  extracted: Section[]
): ActionCoverageRow[] {
  const rows: ActionCoverageRow[] = [];

  for (const invSection of inventory.sections) {
    const expectedActions: string[] = [];

    if (invSection.headerAction) {
      expectedActions.push(invSection.headerAction);
    }
    if (invSection.hasActions) {
      // Infer expected actions from pattern
      if (invSection.children?.type === 'info-card') {
        expectedActions.push('DELETE', 'EDIT');
      }
      if (invSection.children?.type === 'invoice-item') {
        expectedActions.push('PDF');
      }
    }
    if (invSection.content?.addButton) {
      expectedActions.push('ADD NEW');
    }

    if (expectedActions.length === 0) continue;

    const extSection = extracted.find(s =>
      s.targetId === invSection.id || s.id === invSection.id
    );

    const foundActions = extSection?.actions?.map(a => a.label.toUpperCase()) || [];
    const missing = expectedActions.filter(exp =>
      !foundActions.some(found => found.includes(exp) || exp.includes(found))
    );

    rows.push({
      section: invSection.id,
      expectedActions,
      foundActions,
      missing
    });
  }

  return rows;
}
```

### Report Generation

```typescript
interface ReconciliationReport {
  screenName: string;
  timestamp: string;

  // Coverage metrics
  sectionCoverage: {
    expected: number;
    extracted: number;
    percentage: number;
  };

  contentCoverage: {
    full: number;
    partial: number;
    none: number;
  };

  actionCoverage: {
    expected: number;
    found: number;
    percentage: number;
  };

  patternCoverage: {
    patterns: { name: string; expected: number; found: number }[];
  };

  // Detailed tables
  sectionTable: SectionCoverageRow[];
  actionTable: ActionCoverageRow[];

  // Validation summary
  validation: {
    valid: number;
    invalid: number;
    avgScore: number;
  };

  // Recommendations
  recommendations: string[];

  // Overall status
  status: 'pass' | 'warn' | 'fail';
}

function generateReconciliationReport(
  screenName: string,
  inventory: VisualInventory | null,
  extracted: Section[],
  validationResults: ValidationResult[]
): ReconciliationReport {
  const timestamp = new Date().toISOString();

  // If no inventory, generate simple report
  if (!inventory) {
    return {
      screenName,
      timestamp,
      sectionCoverage: {
        expected: extracted.length,
        extracted: extracted.length,
        percentage: 100
      },
      contentCoverage: { full: extracted.length, partial: 0, none: 0 },
      actionCoverage: { expected: 0, found: 0, percentage: 100 },
      patternCoverage: { patterns: [] },
      sectionTable: [],
      actionTable: [],
      validation: calculateValidationSummary(validationResults),
      recommendations: [],
      status: 'pass'
    };
  }

  // Generate coverage tables
  const sectionTable = generateSectionCoverageTable(inventory, extracted, validationResults);
  const actionTable = generateActionCoverageTable(inventory, extracted);

  // Calculate metrics
  const extractedCount = sectionTable.filter(r => r.extracted).length;
  const sectionPercentage = (extractedCount / inventory.sections.length) * 100;

  const contentCounts = {
    full: sectionTable.filter(r => r.contentMatch === 'full').length,
    partial: sectionTable.filter(r => r.contentMatch === 'partial').length,
    none: sectionTable.filter(r => r.contentMatch === 'none').length
  };

  const actionExpected = actionTable.reduce((sum, r) => sum + r.expectedActions.length, 0);
  const actionFound = actionTable.reduce((sum, r) => sum + r.foundActions.length, 0);
  const actionPercentage = actionExpected > 0 ? (actionFound / actionExpected) * 100 : 100;

  // Pattern coverage
  const patternCoverage = calculatePatternCoverage(inventory, extracted);

  // Generate recommendations
  const recommendations = generateRecommendations(sectionTable, actionTable, validationResults);

  // Determine overall status
  const status = determineStatus(sectionPercentage, actionPercentage, validationResults);

  return {
    screenName,
    timestamp,
    sectionCoverage: {
      expected: inventory.sections.length,
      extracted: extractedCount,
      percentage: sectionPercentage
    },
    contentCoverage: contentCounts,
    actionCoverage: {
      expected: actionExpected,
      found: actionFound,
      percentage: actionPercentage
    },
    patternCoverage,
    sectionTable,
    actionTable,
    validation: calculateValidationSummary(validationResults),
    recommendations,
    status
  };
}

function calculatePatternCoverage(
  inventory: VisualInventory,
  extracted: Section[]
): { patterns: { name: string; expected: number; found: number }[] } {
  const patterns: { name: string; expected: number; found: number }[] = [];

  if (inventory.patterns) {
    for (const [patternName, data] of Object.entries(inventory.patterns)) {
      const found = extracted.filter(s => s.pattern === patternName).length;
      patterns.push({
        name: patternName,
        expected: data.count,
        found
      });
    }
  }

  return { patterns };
}

function calculateValidationSummary(results: ValidationResult[]): {
  valid: number;
  invalid: number;
  avgScore: number;
} {
  const valid = results.filter(r => r.valid).length;
  const invalid = results.length - valid;
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / Math.max(results.length, 1);

  return { valid, invalid, avgScore };
}

function generateRecommendations(
  sectionTable: SectionCoverageRow[],
  actionTable: ActionCoverageRow[],
  validationResults: ValidationResult[]
): string[] {
  const recommendations: string[] = [];

  // Missing sections
  const missingSections = sectionTable.filter(r => !r.extracted);
  if (missingSections.length > 0) {
    recommendations.push(
      `Missing sections: ${missingSections.map(r => r.inventorySection).join(', ')}. ` +
      `Consider increasing traversal depth or using --thorough mode.`
    );
  }

  // Partial content matches
  const partialMatches = sectionTable.filter(r => r.contentMatch === 'partial');
  if (partialMatches.length > 0) {
    recommendations.push(
      `Partial content in: ${partialMatches.map(r => r.inventorySection).join(', ')}. ` +
      `Check if all text nodes are being traversed.`
    );
  }

  // Missing actions
  const missingActions = actionTable.filter(r => r.missing.length > 0);
  if (missingActions.length > 0) {
    const actionList = missingActions.flatMap(r =>
      r.missing.map(a => `${r.section}:${a}`)
    ).join(', ');
    recommendations.push(
      `Missing actions: ${actionList}. ` +
      `Review ACTION_KEYWORDS and button detection heuristics.`
    );
  }

  // Low validation scores
  const lowScores = validationResults.filter(r => r.score < 60);
  if (lowScores.length > 0) {
    recommendations.push(
      `Low validation scores for: ${lowScores.map(r => r.sectionId).join(', ')}. ` +
      `Pattern detection may be incorrect or content extraction incomplete.`
    );
  }

  return recommendations;
}

function determineStatus(
  sectionPercentage: number,
  actionPercentage: number,
  validationResults: ValidationResult[]
): 'pass' | 'warn' | 'fail' {
  const avgScore = validationResults.reduce((sum, r) => sum + r.score, 0) /
                   Math.max(validationResults.length, 1);

  if (sectionPercentage >= 90 && actionPercentage >= 90 && avgScore >= 80) {
    return 'pass';
  }

  if (sectionPercentage >= 70 && actionPercentage >= 70 && avgScore >= 60) {
    return 'warn';
  }

  return 'fail';
}
```

## Output Formats

### Console Output

```
═══════════════════════════════════════════════════════════════════════════════
  EXTRACTION RECONCILIATION: Billing
═══════════════════════════════════════════════════════════════════════════════

Section Coverage: 10/10 (100%) ✓

┌─────────────────────┬───────────┬────────────────┬───────────────┬───────┐
│ Inventory Section   │ Extracted │ Pattern        │ Content Match │ Score │
├─────────────────────┼───────────┼────────────────┼───────────────┼───────┤
│ sidebar             │ ✓         │ navigation     │ ✓ full        │ 90%   │
│ header              │ ✓         │ header         │ ✓ full        │ 85%   │
│ credit-card         │ ✓         │ credit-card    │ ✓ full        │ 100%  │
│ salary-card         │ ✓         │ stat-card      │ ✓ full        │ 95%   │
│ paypal-card         │ ✓         │ stat-card      │ ✓ full        │ 95%   │
│ invoices-list       │ ✓         │ list           │ ✓ full        │ 90%   │
│ payment-method      │ ✓         │ card           │ ✓ full        │ 88%   │
│ billing-information │ ✓         │ info-list      │ ✓ full        │ 92%   │
│ transactions        │ ✓         │ transaction    │ ✓ full        │ 90%   │
│ footer              │ ✓         │ footer         │ ✓ full        │ 80%   │
└─────────────────────┴───────────┴────────────────┴───────────────┴───────┘

Action Coverage: 8/8 (100%) ✓

┌─────────────────────┬──────────────────────┬──────────────────────┐
│ Section             │ Expected Actions     │ Found                │
├─────────────────────┼──────────────────────┼──────────────────────┤
│ invoices-list       │ VIEW ALL             │ ✓ VIEW ALL           │
│ payment-method      │ ADD NEW CARD         │ ✓ ADD NEW CARD       │
│ billing-information │ DELETE (×3), EDIT (×3)│ ✓ DELETE (3), EDIT (3)│
│ invoices items      │ PDF (×5)             │ ✓ PDF (5)            │
└─────────────────────┴──────────────────────┴──────────────────────┘

Pattern Coverage:

┌──────────────────┬──────────┬───────┐
│ Pattern          │ Expected │ Found │
├──────────────────┼──────────┼───────┤
│ stat-card        │ 2        │ 2     │
│ credit-card      │ 1        │ 1     │
│ list-item        │ 14       │ 14    │
│ info-card        │ 3        │ 3     │
└──────────────────┴──────────┴───────┘

Validation Summary:
  Valid sections: 10/10 (100%)
  Average score: 90.5%

Overall Status: ✓ PASS

───────────────────────────────────────────────────────────────────────────────
```

### JSON Output

Save to `preview/layouts/data/{ScreenName}-reconciliation.json`:

```json
{
  "screenName": "Billing",
  "timestamp": "2026-01-17T18:00:00Z",
  "status": "pass",
  "sectionCoverage": {
    "expected": 10,
    "extracted": 10,
    "percentage": 100
  },
  "contentCoverage": {
    "full": 10,
    "partial": 0,
    "none": 0
  },
  "actionCoverage": {
    "expected": 8,
    "found": 8,
    "percentage": 100
  },
  "patternCoverage": {
    "patterns": [
      { "name": "stat-card", "expected": 2, "found": 2 },
      { "name": "credit-card", "expected": 1, "found": 1 },
      { "name": "list-item", "expected": 14, "found": 14 },
      { "name": "info-card", "expected": 3, "found": 3 }
    ]
  },
  "validation": {
    "valid": 10,
    "invalid": 0,
    "avgScore": 90.5
  },
  "recommendations": []
}
```

### Markdown Report Append

Append to `design-system/extraction-report.md`:

```markdown
## Reconciliation: Billing

| Metric | Expected | Extracted | Coverage |
|--------|----------|-----------|----------|
| Sections | 10 | 10 | 100% |
| Actions | 8 | 8 | 100% |
| Content Match | - | 10 full | 100% |

### Patterns

| Pattern | Expected | Found | Match |
|---------|----------|-------|-------|
| stat-card | 2 | 2 | ✓ |
| credit-card | 1 | 1 | ✓ |
| list-item | 14 | 14 | ✓ |
| info-card | 3 | 3 | ✓ |

### Validation

- Valid sections: 10/10
- Average score: 90.5%

**Status: PASS** ✓
```

## Status Thresholds

| Metric | Pass | Warn | Fail |
|--------|------|------|------|
| Section Coverage | ≥90% | ≥70% | <70% |
| Action Coverage | ≥90% | ≥70% | <70% |
| Content Match (full) | ≥80% | ≥50% | <50% |
| Validation Score | ≥80 | ≥60 | <60 |

## Integration

```typescript
/**
 * Main entry point for reconciliation report
 */
async function generateFullReconciliationReport(
  screenName: string,
  inventoryPath: string | null,
  contentPath: string,
  outputDir: string
): Promise<ReconciliationReport> {
  // Load data
  const inventory = inventoryPath ? loadJson(inventoryPath) : null;
  const content = loadJson(contentPath);
  const sections = content.sections || [];

  // Validate sections
  const validationResults = validateAllSections(sections);

  // Generate report
  const report = generateReconciliationReport(
    screenName,
    inventory,
    sections,
    validationResults.results
  );

  // Save outputs
  const jsonPath = `${outputDir}/data/${screenName}-reconciliation.json`;
  saveJson(jsonPath, report);

  // Append to extraction report
  appendToExtractionReport(report);

  // Print to console
  printReconciliationReport(report);

  return report;
}
```

## CLI Summary

After running reconciliation on all screens:

```
═══════════════════════════════════════════════════════════════════════════════
  EXTRACTION RECONCILIATION SUMMARY
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────┬────────┬──────────┬─────────┬──────────┬─────────────────┐
│ Screen          │ Status │ Sections │ Actions │ Content  │ Avg Score       │
├─────────────────┼────────┼──────────┼─────────┼──────────┼─────────────────┤
│ Dashboard       │ ✓ PASS │ 12/12    │ 6/6     │ 100%     │ 92.1%           │
│ Tables          │ ✓ PASS │ 8/8      │ 4/4     │ 100%     │ 89.5%           │
│ Billing         │ ✓ PASS │ 10/10    │ 8/8     │ 100%     │ 90.5%           │
│ Profile         │ ⚠ WARN │ 9/10     │ 5/6     │ 90%      │ 78.2%           │
│ Sign-In         │ ✓ PASS │ 4/4      │ 2/2     │ 100%     │ 95.0%           │
│ Sign-Up         │ ✓ PASS │ 5/5      │ 3/3     │ 100%     │ 94.2%           │
└─────────────────┴────────┴──────────┴─────────┴──────────┴─────────────────┘

Overall: 5/6 screens PASS, 1 screen WARN

Recommendations:
  • Profile: Missing section 'social-links'. Check sidebar navigation depth.
  • Profile: Missing action 'EDIT PROFILE'. Review header action detection.

Reports saved to:
  preview/layouts/data/{Screen}-reconciliation.json

Extraction report updated:
  design-system/extraction-report.md
```

## Next Steps

After reconciliation:
- If PASS: Proceed to preview generation
- If WARN: Review recommendations, optionally re-extract
- If FAIL: Re-run with `--thorough` or manually review configuration
