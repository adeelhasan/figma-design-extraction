# Verify Extraction (Phase 6)

## Purpose

Verify extraction completeness and fidelity by comparing extracted content against the visual inventory created during the analysis phase. This ensures no content was missed during API-based extraction.

## When to Run

This phase runs:
- Automatically when `--thorough` flag is used
- Manually via `/extract-design --verify`
- After any extraction that generated visual inventories

## Prerequisites

Required files:
- `preview/layouts/data/{ScreenName}-inventory.json` (from visual analysis)
- `preview/layouts/data/{ScreenName}.json` (from content extraction)
- `specs/layouts/{ScreenName}.md` (from layout extraction)

## Process

### Step 1: Load Extraction Artifacts

For each screen, load:

```typescript
interface VerificationInputs {
  screenName: string;
  inventory: InventoryFile;      // From visual analysis
  content: ContentFile;          // From content extraction
  layout: LayoutSpec;            // From layout extraction
}

function loadVerificationInputs(screenName: string): VerificationInputs {
  return {
    screenName,
    inventory: loadJson(`preview/layouts/data/${screenName}-inventory.json`),
    content: loadJson(`preview/layouts/data/${screenName}.json`),
    layout: parseMarkdown(`specs/layouts/${screenName}.md`)
  };
}
```

### Step 2: Section Count Verification

Compare section counts:

```typescript
interface SectionVerification {
  status: 'pass' | 'warn' | 'fail';
  inventoryCount: number;
  extractedCount: number;
  coverage: number;
  missing: string[];
  extra: string[];
}

function verifySectionCount(inputs: VerificationInputs): SectionVerification {
  const inventorySections = inputs.inventory.sections;
  const extractedSections = inputs.content.sections;

  const inventoryIds = new Set(inventorySections.map(s => s.id));
  const extractedIds = new Set(extractedSections.map(s => s.id));

  const missing = [...inventoryIds].filter(id => !extractedIds.has(id));
  const extra = [...extractedIds].filter(id => !inventoryIds.has(id));

  const coverage = ((inventorySections.length - missing.length) / inventorySections.length) * 100;

  return {
    status: coverage >= 90 ? 'pass' : coverage >= 70 ? 'warn' : 'fail',
    inventoryCount: inventorySections.length,
    extractedCount: extractedSections.length,
    coverage,
    missing,
    extra
  };
}
```

### Step 3: Content Coverage Verification

Verify text content was captured:

```typescript
interface ContentVerification {
  status: 'pass' | 'warn' | 'fail';
  expectedTextNodes: number;
  extractedTextNodes: number;
  coverage: number;
  missingSamples: string[];    // Sample of missing text
}

function verifyContentCoverage(inputs: VerificationInputs): ContentVerification {
  // Count expected text items from inventory
  let expectedCount = 0;
  for (const section of inputs.inventory.sections) {
    if (section.children?.count) {
      expectedCount += section.children.count;
    }
    if (section.hasHeader) expectedCount++;
    if (section.headerAction) expectedCount++;
  }

  // Count extracted text
  let extractedCount = 0;
  const extractedTexts = new Set<string>();
  for (const section of inputs.content.sections) {
    extractedCount += countTextItems(section.content);
    collectTexts(section.content, extractedTexts);
  }

  // Find missing content (sample)
  const missingSamples: string[] = [];
  for (const section of inputs.inventory.sections) {
    if (section.content?.value && !extractedTexts.has(section.content.value)) {
      missingSamples.push(section.content.value);
    }
  }

  const coverage = (extractedCount / expectedCount) * 100;

  return {
    status: coverage >= 95 ? 'pass' : coverage >= 80 ? 'warn' : 'fail',
    expectedTextNodes: expectedCount,
    extractedTextNodes: extractedCount,
    coverage,
    missingSamples: missingSamples.slice(0, 5)  // First 5 samples
  };
}
```

### Step 4: Pattern Detection Verification

Verify UI patterns were recognized:

```typescript
interface PatternVerification {
  status: 'pass' | 'warn' | 'fail';
  patterns: {
    name: string;
    expected: number;
    found: number;
    match: boolean;
  }[];
}

function verifyPatternDetection(inputs: VerificationInputs): PatternVerification {
  const results: PatternVerification = {
    status: 'pass',
    patterns: []
  };

  const inventoryPatterns = inputs.inventory.patterns || {};
  const extractedSections = inputs.content.sections;

  for (const [patternName, patternData] of Object.entries(inventoryPatterns)) {
    const foundCount = extractedSections.filter(s => s.pattern === patternName).length;
    const match = foundCount >= patternData.count;

    results.patterns.push({
      name: patternName,
      expected: patternData.count,
      found: foundCount,
      match
    });

    if (!match) {
      results.status = results.status === 'pass' ? 'warn' : results.status;
    }
  }

  // Fail if more than 1 pattern is completely missing
  const missingPatterns = results.patterns.filter(p => p.found === 0);
  if (missingPatterns.length > 1) {
    results.status = 'fail';
  }

  return results;
}
```

### Step 5: Action Verification

Verify interactive elements were captured:

```typescript
interface ActionVerification {
  status: 'pass' | 'warn' | 'fail';
  expectedActions: number;
  extractedActions: number;
  missingActions: {
    section: string;
    expected: string;
  }[];
}

function verifyActions(inputs: VerificationInputs): ActionVerification {
  let expectedCount = 0;
  let extractedCount = 0;
  const missingActions: ActionVerification['missingActions'] = [];

  for (const invSection of inputs.inventory.sections) {
    if (invSection.hasActions) expectedCount++;
    if (invSection.headerAction) expectedCount++;

    const extSection = inputs.content.sections.find(s => s.id === invSection.id);
    if (extSection) {
      if (extSection.actions?.length > 0) extractedCount++;
      if (extSection.header?.action) extractedCount++;
    } else if (invSection.hasActions || invSection.headerAction) {
      missingActions.push({
        section: invSection.id,
        expected: invSection.headerAction || 'action button'
      });
    }
  }

  const coverage = expectedCount > 0 ? (extractedCount / expectedCount) * 100 : 100;

  return {
    status: coverage >= 90 ? 'pass' : coverage >= 70 ? 'warn' : 'fail',
    expectedActions: expectedCount,
    extractedActions: extractedCount,
    missingActions
  };
}
```

### Step 6: Generate Verification Report

Create comprehensive verification report:

```typescript
interface VerificationReport {
  screenName: string;
  timestamp: string;
  overallStatus: 'pass' | 'warn' | 'fail';
  overallCoverage: number;
  sections: SectionVerification;
  content: ContentVerification;
  patterns: PatternVerification;
  actions: ActionVerification;
  recommendations: string[];
}

function generateVerificationReport(inputs: VerificationInputs): VerificationReport {
  const sections = verifySectionCount(inputs);
  const content = verifyContentCoverage(inputs);
  const patterns = verifyPatternDetection(inputs);
  const actions = verifyActions(inputs);

  // Calculate overall status
  const statuses = [sections.status, content.status, patterns.status, actions.status];
  const overallStatus = statuses.includes('fail') ? 'fail' :
                        statuses.includes('warn') ? 'warn' : 'pass';

  // Calculate overall coverage
  const overallCoverage = (
    sections.coverage +
    content.coverage +
    (patterns.patterns.filter(p => p.match).length / Math.max(patterns.patterns.length, 1)) * 100 +
    (actions.extractedActions / Math.max(actions.expectedActions, 1)) * 100
  ) / 4;

  // Generate recommendations
  const recommendations: string[] = [];
  if (sections.missing.length > 0) {
    recommendations.push(`Missing sections: ${sections.missing.join(', ')}. Consider increasing traversal depth.`);
  }
  if (content.missingSamples.length > 0) {
    recommendations.push(`Some text content not captured. Check node depth limits.`);
  }
  if (patterns.patterns.some(p => !p.match)) {
    recommendations.push(`Pattern detection incomplete. Review UI_PATTERNS definitions.`);
  }
  if (actions.missingActions.length > 0) {
    recommendations.push(`Action buttons missing. Check action detection heuristics.`);
  }

  return {
    screenName: inputs.screenName,
    timestamp: new Date().toISOString(),
    overallStatus,
    overallCoverage,
    sections,
    content,
    patterns,
    actions,
    recommendations
  };
}
```

### Step 7: Output Report

#### Console Output

```
═══════════════════════════════════════════════════════════════
  EXTRACTION VERIFICATION: {ScreenName}
═══════════════════════════════════════════════════════════════

Overall Status: {✓|⚠|❌} {PASS|WARN|FAIL}
Overall Coverage: {coverage}%

┌─────────────────────┬─────────┬──────────────┬────────────┐
│ Category            │ Status  │ Coverage     │ Details    │
├─────────────────────┼─────────┼──────────────┼────────────┤
│ Sections            │ {status}│ {n}/{m} ({%})│ {missing}  │
│ Content             │ {status}│ {n}/{m} ({%})│            │
│ Patterns            │ {status}│ {n}/{m}      │            │
│ Actions             │ {status}│ {n}/{m} ({%})│ {missing}  │
└─────────────────────┴─────────┴──────────────┴────────────┘

{{#if recommendations}}
Recommendations:
{{#each recommendations}}
  • {.}
{{/each}}
{{/if}}

{{#if missingSections}}
Missing Sections:
{{#each missingSections}}
  ❌ {.}
{{/each}}
{{/if}}

{{#if missingPatterns}}
Missing Patterns:
{{#each missingPatterns}}
  ❌ {name}: expected {expected}, found {found}
{{/each}}
{{/if}}
```

#### JSON Report File

Save to `preview/layouts/data/{ScreenName}-verification.json`:

```json
{
  "screenName": "Billing",
  "timestamp": "2026-01-15T18:00:00Z",
  "overallStatus": "warn",
  "overallCoverage": 85.5,
  "sections": {
    "status": "warn",
    "inventoryCount": 10,
    "extractedCount": 8,
    "coverage": 80,
    "missing": ["salary-card", "paypal-card"],
    "extra": []
  },
  "content": {
    "status": "pass",
    "expectedTextNodes": 45,
    "extractedTextNodes": 43,
    "coverage": 95.5,
    "missingSamples": ["$2,000", "$49,000"]
  },
  "patterns": {
    "status": "warn",
    "patterns": [
      { "name": "stat-card", "expected": 3, "found": 1, "match": false },
      { "name": "list-item", "expected": 14, "found": 12, "match": true },
      { "name": "info-card", "expected": 3, "found": 3, "match": true }
    ]
  },
  "actions": {
    "status": "pass",
    "expectedActions": 8,
    "extractedActions": 7,
    "missingActions": [
      { "section": "payment-method", "expected": "ADD NEW CARD" }
    ]
  },
  "recommendations": [
    "Missing sections: salary-card, paypal-card. Consider increasing traversal depth.",
    "Pattern detection incomplete. Review UI_PATTERNS definitions for stat-card."
  ]
}
```

#### Markdown Report Addendum

Append to `extraction-report.md`:

```markdown
## Verification Results

### {ScreenName}

| Metric | Expected | Extracted | Coverage |
|--------|----------|-----------|----------|
| Sections | {n} | {m} | {%}% |
| Content items | {n} | {m} | {%}% |
| Patterns | {n} | {m} | {%}% |
| Actions | {n} | {m} | {%}% |

**Overall: {STATUS}** ({coverage}%)

{{#if recommendations}}
#### Recommendations
{{#each recommendations}}
- {.}
{{/each}}
{{/if}}
```

## Verification Thresholds

| Category | Pass | Warn | Fail |
|----------|------|------|------|
| Section coverage | ≥90% | ≥70% | <70% |
| Content coverage | ≥95% | ≥80% | <80% |
| Pattern match | All | ≥50% | <50% |
| Action coverage | ≥90% | ≥70% | <70% |

## Error Handling

### Inventory Not Found

```
⚠ No inventory found for {ScreenName}.
Skipping verification (visual analysis was not run).
Run with --thorough to enable visual verification.
```

### Content Not Found

```
❌ Content file not found for {ScreenName}.
Extraction may have failed. Check extract-content logs.
```

### Partial Verification

If inventory exists but content is missing:
```
⚠ Partial verification for {ScreenName}.
Inventory sections: {n}
Content sections: 0

This suggests extraction failed. Re-run extraction with --thorough.
```

## Integration

This phase integrates with the extraction workflow:

```
┌─────────────────────────────────────────┐
│  Phase 0: Visual Analysis (--thorough)  │
│  Creates: {Screen}-inventory.json       │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  Phase 2-5: Extraction                  │
│  Creates: {Screen}.json, {Screen}.md    │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  Phase 6: Verification (THIS PHASE)     │
│  Creates: {Screen}-verification.json    │
│  Updates: extraction-report.md          │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  Decision: Re-extract or Proceed?       │
│  - PASS: Continue to preview generation │
│  - WARN: Proceed with caveats           │
│  - FAIL: Re-run with deeper settings    │
└─────────────────────────────────────────┘
```

## CLI Output Summary

After running verification on all screens:

```
═══════════════════════════════════════════════════════════════
  EXTRACTION VERIFICATION SUMMARY
═══════════════════════════════════════════════════════════════

┌─────────────────┬────────┬──────────┬─────────────────────────┐
│ Screen          │ Status │ Coverage │ Issues                  │
├─────────────────���────────┼──────────┼─────────────────────────┤
│ Dashboard       │ ✓ PASS │ 95.2%    │ -                       │
│ Tables          │ ✓ PASS │ 92.1%    │ -                       │
│ Billing         │ ⚠ WARN │ 85.5%    │ 2 sections, 1 pattern   │
│ Profile         │ ✓ PASS │ 91.0%    │ -                       │
│ Sign-In         │ ✓ PASS │ 98.5%    │ -                       │
│ Sign-Up         │ ✓ PASS │ 97.2%    │ -                       │
└─────────────────┴────────┴──────────┴─────────────────────────┘

Overall: 5/6 screens PASS, 1 screen WARN
Average coverage: 93.2%

Verification reports saved to:
  preview/layouts/data/{Screen}-verification.json

Continue to preview generation? [Y/n]
```

## Next Step

If verification passes (or user accepts warnings):
- Proceed to: `preview.md` (generate HTML previews)

If verification fails:
- Review recommendations
- Increase `maxDepth` in extraction config
- Re-run extraction with `--thorough`
- Consider manual additions to content.json
