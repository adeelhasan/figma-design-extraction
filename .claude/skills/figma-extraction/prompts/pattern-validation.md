# Pattern Validation (Improvement 4)

## Purpose

Validate that extracted sections contain all required fields for their detected patterns.
This ensures extraction quality and catches incomplete extractions early.

## Pattern Definitions

Each UI pattern has required and optional fields with validation rules.

### Stat Card Pattern

```typescript
interface StatCardValidation {
  pattern: 'stat-card';
  required: ['icon', 'value', 'label'];
  optional: ['sublabel', 'trend', 'iconColor'];
  rules: {
    value: {
      format: /[\$\€\£]?[\d,]+(\.\d{2})?|[\d,]+%/;  // Currency, number, or percentage
      description: 'Must be a currency value, number, or percentage'
    };
    icon: {
      format: 'present';  // Just needs to exist
      description: 'Must have an icon or icon container'
    };
    label: {
      format: /.+/;  // Non-empty string
      description: 'Must have a descriptive label'
    };
  };
}

function validateStatCard(section: Section): ValidationResult {
  const content = section.content || {};
  const missing: string[] = [];
  const invalid: { field: string; reason: string }[] = [];

  // Check required fields
  if (!content.icon && !content.iconBox && !hasIconChild(section)) {
    missing.push('icon');
  }

  if (!content.value) {
    missing.push('value');
  } else if (!/[\$\€\£]?[\d,]+(\.\d{2})?|[\d,]+%/.test(content.value)) {
    invalid.push({ field: 'value', reason: 'Value does not match expected format (currency/number/percentage)' });
  }

  if (!content.label) {
    missing.push('label');
  }

  return {
    valid: missing.length === 0 && invalid.length === 0,
    pattern: 'stat-card',
    sectionId: section.id,
    missing,
    invalid,
    score: calculateFieldScore(['icon', 'value', 'label'], content)
  };
}
```

### Credit Card Pattern

```typescript
interface CreditCardValidation {
  pattern: 'credit-card';
  required: ['number', 'holder'];
  optional: ['expires', 'cvv', 'type', 'chip'];
  rules: {
    number: {
      format: /(\d{4}[\s•\*]+){3}\d{4}|\*{4}[\s•]+\*{4}[\s•]+\*{4}[\s•]+\d{4}/;
      description: 'Card number (possibly masked)'
    };
    holder: {
      format: /[A-Za-z\s]+/;
      description: 'Cardholder name'
    };
    expires: {
      format: /\d{2}\/\d{2,4}/;
      description: 'Expiry date MM/YY or MM/YYYY'
    };
  };
}

function validateCreditCard(section: Section): ValidationResult {
  const content = section.content || {};
  const missing: string[] = [];
  const invalid: { field: string; reason: string }[] = [];

  // Check card number
  if (!content.number && !content.cardNumber) {
    missing.push('number');
  } else {
    const num = content.number || content.cardNumber;
    if (!/(\d{4}[\s•\*]+){3}\d{4}|\*{4}[\s•]+\*{4}[\s•]+\*{4}[\s•]+\d{4}/.test(num)) {
      invalid.push({ field: 'number', reason: 'Card number format invalid' });
    }
  }

  // Check holder
  if (!content.holder && !content.name && !content.cardHolder) {
    missing.push('holder');
  }

  return {
    valid: missing.length === 0 && invalid.length === 0,
    pattern: 'credit-card',
    sectionId: section.id,
    missing,
    invalid,
    score: calculateFieldScore(['number', 'holder'], content)
  };
}
```

### Info Card Pattern

```typescript
interface InfoCardValidation {
  pattern: 'info-card';
  required: ['title', 'fields'];
  optional: ['actions', 'subtitle', 'icon'];
  rules: {
    title: {
      format: /.+/;
      description: 'Must have a title'
    };
    fields: {
      format: 'array';
      minLength: 1;
      description: 'Must have at least one field (label:value pair)'
    };
    actions: {
      format: 'array';
      description: 'Action buttons (edit, delete, etc.)'
    };
  };
}

function validateInfoCard(section: Section): ValidationResult {
  const content = section.content || {};
  const missing: string[] = [];
  const invalid: { field: string; reason: string }[] = [];

  if (!content.title) {
    missing.push('title');
  }

  if (!content.fields || !Array.isArray(content.fields) || content.fields.length === 0) {
    // Try to find fields in nested content
    const inferredFields = inferFieldsFromContent(content);
    if (inferredFields.length === 0) {
      missing.push('fields');
    }
  }

  return {
    valid: missing.length === 0 && invalid.length === 0,
    pattern: 'info-card',
    sectionId: section.id,
    missing,
    invalid,
    score: calculateFieldScore(['title', 'fields'], content)
  };
}

function inferFieldsFromContent(content: any): { label: string; value: string }[] {
  const fields: { label: string; value: string }[] = [];

  // Look for label:value patterns in content
  for (const [key, value] of Object.entries(content)) {
    if (typeof value === 'string' && key !== 'title' && key !== 'subtitle') {
      fields.push({ label: key, value: value as string });
    }
  }

  return fields;
}
```

### List Section Pattern

```typescript
interface ListSectionValidation {
  pattern: 'list-section';
  required: ['title', 'items'];
  optional: ['headerAction', 'emptyState'];
  rules: {
    title: {
      format: /.+/;
      description: 'Section title'
    };
    items: {
      format: 'array';
      minLength: 1;
      description: 'List items'
    };
    headerAction: {
      format: /.+/;
      description: 'Action link in header (VIEW ALL, etc.)'
    };
  };
}

function validateListSection(section: Section): ValidationResult {
  const content = section.content || {};
  const missing: string[] = [];
  const invalid: { field: string; reason: string }[] = [];

  if (!content.title && !section.header?.title) {
    missing.push('title');
  }

  if (!content.items || !Array.isArray(content.items)) {
    // Check if section has child count
    if ((section.childCount || 0) === 0) {
      missing.push('items');
    }
  }

  return {
    valid: missing.length === 0 && invalid.length === 0,
    pattern: 'list-section',
    sectionId: section.id,
    missing,
    invalid,
    score: calculateFieldScore(['title', 'items'], content)
  };
}
```

### Transaction Item Pattern

```typescript
interface TransactionItemValidation {
  pattern: 'transaction-item';
  required: ['name', 'amount'];
  optional: ['date', 'status', 'icon', 'category'];
  rules: {
    name: {
      format: /.+/;
      description: 'Transaction description'
    };
    amount: {
      format: /[+-]?[\$\€\£]?[\d,]+(\.\d{2})?/;
      description: 'Transaction amount with optional +/- prefix'
    };
    status: {
      format: /completed|pending|failed|processing/i;
      description: 'Transaction status'
    };
  };
}

function validateTransactionItem(section: Section): ValidationResult {
  const content = section.content || {};
  const missing: string[] = [];
  const invalid: { field: string; reason: string }[] = [];

  if (!content.name && !content.description && !content.title) {
    missing.push('name');
  }

  if (!content.amount && !content.value) {
    missing.push('amount');
  } else {
    const amount = content.amount || content.value;
    if (!/[+-]?[\$\€\£]?[\d,]+(\.\d{2})?/.test(amount)) {
      invalid.push({ field: 'amount', reason: 'Amount format invalid' });
    }
  }

  return {
    valid: missing.length === 0 && invalid.length === 0,
    pattern: 'transaction-item',
    sectionId: section.id,
    missing,
    invalid,
    score: calculateFieldScore(['name', 'amount'], content)
  };
}
```

## Validation Registry

```typescript
interface ValidationResult {
  valid: boolean;
  pattern: string;
  sectionId: string;
  missing: string[];
  invalid: { field: string; reason: string }[];
  score: number;  // 0-100
}

type PatternValidator = (section: Section) => ValidationResult;

const PATTERN_VALIDATORS: Map<string, PatternValidator> = new Map([
  ['stat-card', validateStatCard],
  ['credit-card', validateCreditCard],
  ['info-card', validateInfoCard],
  ['list-section', validateListSection],
  ['list', validateListSection],
  ['transaction-item', validateTransactionItem],
  ['list-item', validateListItem],
  ['navigation', validateNavigation],
  ['header', validateHeader],
  ['footer', validateFooter]
]);

function validateSection(section: Section): ValidationResult {
  if (!section.pattern) {
    return {
      valid: true,  // No pattern = no validation rules
      pattern: 'unknown',
      sectionId: section.id,
      missing: [],
      invalid: [],
      score: 50  // Neutral score for unrecognized patterns
    };
  }

  const validator = PATTERN_VALIDATORS.get(section.pattern);

  if (!validator) {
    return {
      valid: true,
      pattern: section.pattern,
      sectionId: section.id,
      missing: [],
      invalid: [],
      score: 50
    };
  }

  return validator(section);
}
```

## Additional Validators

```typescript
function validateListItem(section: Section): ValidationResult {
  const content = section.content || {};
  const missing: string[] = [];

  // List items typically need some text content
  const hasText = content.title || content.name || content.label || content.description;
  if (!hasText) {
    missing.push('text-content');
  }

  return {
    valid: missing.length === 0,
    pattern: 'list-item',
    sectionId: section.id,
    missing,
    invalid: [],
    score: hasText ? 80 : 40
  };
}

function validateNavigation(section: Section): ValidationResult {
  const missing: string[] = [];

  // Navigation needs items
  if ((section.childCount || 0) === 0 && !section.content?.items) {
    missing.push('nav-items');
  }

  return {
    valid: missing.length === 0,
    pattern: 'navigation',
    sectionId: section.id,
    missing,
    invalid: [],
    score: (section.childCount || 0) > 0 ? 90 : 30
  };
}

function validateHeader(section: Section): ValidationResult {
  const content = section.content || {};
  const missing: string[] = [];

  // Headers typically have title or navigation
  const hasContent = content.title || content.logo || (section.childCount || 0) > 0;
  if (!hasContent) {
    missing.push('header-content');
  }

  return {
    valid: missing.length === 0,
    pattern: 'header',
    sectionId: section.id,
    missing,
    invalid: [],
    score: hasContent ? 85 : 40
  };
}

function validateFooter(section: Section): ValidationResult {
  // Footers are flexible - just check they exist and have some content
  const hasContent = (section.childCount || 0) > 0;

  return {
    valid: true,
    pattern: 'footer',
    sectionId: section.id,
    missing: [],
    invalid: [],
    score: hasContent ? 80 : 60
  };
}
```

## Batch Validation

```typescript
interface BatchValidationResult {
  totalSections: number;
  validSections: number;
  invalidSections: number;
  averageScore: number;
  results: ValidationResult[];
  byPattern: Map<string, {
    count: number;
    validCount: number;
    avgScore: number;
  }>;
}

function validateAllSections(sections: Section[]): BatchValidationResult {
  const results: ValidationResult[] = [];
  const byPattern = new Map<string, { count: number; validCount: number; scores: number[] }>();

  for (const section of sections) {
    const result = validateSection(section);
    results.push(result);

    // Aggregate by pattern
    const pattern = section.pattern || 'unknown';
    if (!byPattern.has(pattern)) {
      byPattern.set(pattern, { count: 0, validCount: 0, scores: [] });
    }
    const stats = byPattern.get(pattern)!;
    stats.count++;
    if (result.valid) stats.validCount++;
    stats.scores.push(result.score);
  }

  // Calculate summary
  const validCount = results.filter(r => r.valid).length;
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / Math.max(results.length, 1);

  // Convert pattern stats
  const patternSummary = new Map<string, { count: number; validCount: number; avgScore: number }>();
  for (const [pattern, stats] of byPattern.entries()) {
    patternSummary.set(pattern, {
      count: stats.count,
      validCount: stats.validCount,
      avgScore: stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length
    });
  }

  return {
    totalSections: sections.length,
    validSections: validCount,
    invalidSections: sections.length - validCount,
    averageScore: avgScore,
    results,
    byPattern: patternSummary
  };
}
```

## Helper Functions

```typescript
function calculateFieldScore(requiredFields: string[], content: any): number {
  if (!content || typeof content !== 'object') return 0;

  let found = 0;
  for (const field of requiredFields) {
    // Check direct field
    if (content[field] !== undefined && content[field] !== null && content[field] !== '') {
      found++;
      continue;
    }

    // Check common aliases
    const aliases = getFieldAliases(field);
    if (aliases.some(alias => content[alias] !== undefined && content[alias] !== null)) {
      found++;
    }
  }

  return Math.round((found / requiredFields.length) * 100);
}

function getFieldAliases(field: string): string[] {
  const aliasMap: Record<string, string[]> = {
    'icon': ['iconBox', 'iconContainer', 'leadingIcon'],
    'value': ['amount', 'number', 'stat', 'metric'],
    'label': ['title', 'name', 'description', 'text'],
    'title': ['header', 'heading', 'name'],
    'fields': ['items', 'data', 'rows', 'content'],
    'number': ['cardNumber', 'card', 'num'],
    'holder': ['name', 'cardHolder', 'owner'],
    'name': ['title', 'description', 'label', 'text'],
    'amount': ['value', 'total', 'price', 'sum']
  };

  return aliasMap[field] || [];
}
```

## Console Output

```
═══════════════════════════════════════════════════════════════
  PATTERN VALIDATION RESULTS
═══════════════════════════════════════════════════════════════

Total Sections: 10
Valid: 8 (80%)
Invalid: 2 (20%)
Average Score: 85.2

By Pattern:
┌──────────────────┬───────┬───────┬──────────┐
│ Pattern          │ Count │ Valid │ Avg Score│
├──────────────────┼───────┼───────┼──────────┤
│ stat-card        │ 3     │ 2     │ 78%      │
│ credit-card      │ 1     │ 1     │ 100%     │
│ list-section     │ 2     │ 2     │ 90%      │
│ info-card        │ 3     │ 3     │ 95%      │
│ navigation       │ 1     │ 0     │ 40%      │
└──────────────────┴───────┴───────┴──────────┘

Invalid Sections:
  ❌ salary-card (stat-card)
     Missing: icon
     Score: 66%

  ❌ sidebar (navigation)
     Missing: nav-items
     Score: 40%

Recommendations:
  • salary-card: Check if icon was extracted or add iconBox field
  • sidebar: Verify navigation items were traversed (may need deeper config)
```

## Integration

Pattern validation runs after extraction and before reconciliation report:

```
Extraction → Pattern Validation → Reconciliation Report
                   ↓
           Re-extract if score < 50%
```

## Next Step

Proceed to: `reconciliation-report.md` (generate final extraction report)
