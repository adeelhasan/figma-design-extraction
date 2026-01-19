# Visual Analysis Phase

This phase captures and analyzes screenshots of Figma frames to create a comprehensive section inventory before API-based extraction. This ensures no visible content is missed during the extraction process.

## When to Use

This phase runs when:
- The `--thorough` flag is passed to `/extract-design`
- Manual verification of extraction completeness is needed
- Complex layouts with nested sections are detected

## Step 1: Export Frame Screenshots

For each screen frame identified in the Figma file, export a PNG image.

### API Call

```
GET https://api.figma.com/v1/images/{fileKey}
```

### Parameters

```json
{
  "ids": "{frameNodeId}",
  "format": "png",
  "scale": 1
}
```

### Response

```json
{
  "images": {
    "{frameNodeId}": "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/..."
  }
}
```

### Saving Screenshots

1. Fetch the image URL from the response
2. Download the PNG content
3. Save to `preview/layouts/screenshots/{ScreenName}.png`

Create the screenshots directory if it doesn't exist:
```bash
mkdir -p preview/layouts/screenshots
```

## Step 2: Visual Section Inventory

Analyze each screenshot to identify ALL visible UI sections. Create a structured inventory.

### Analysis Guidelines

When analyzing the screenshot, identify:

#### 1. Top-Level Sections
- Header/Navigation areas
- Sidebar (if present)
- Main content area
- Footer (if present)

#### 2. Content Sections
For each distinct visual group, record:
- **Section name**: Descriptive identifier
- **Section type**: card, list, table, form, stat, navigation, etc.
- **Approximate bounds**: top/left quadrant, center, bottom-right, etc.
- **Child count**: Number of items if it's a repeating pattern
- **Has header**: Boolean - does it have a title row?
- **Has actions**: Boolean - does it have buttons/links?

#### 3. Repeating Patterns
Identify UI patterns that appear multiple times:
- **Stat cards**: Icon + large number + label
- **List items**: Avatar/icon + text + optional action
- **Table rows**: Column data with consistent structure
- **Info cards**: Title + key-value pairs + actions

#### 4. Missing Content Indicators
Look for:
- Truncated text (ellipsis)
- Scroll indicators
- "View all" or "See more" buttons
- Pagination controls

### Pattern Recognition Reference

| Pattern | Visual Signature | Structure |
|---------|-----------------|-----------|
| Stat Card | Colored icon box + large bold number + small label below | icon-container → value-text → label-text |
| Credit Card | Gradient background + card number + details | gradient-bg → chip-icon → number → name/date |
| List Item | Left icon/avatar + middle text content + right action | icon → content-stack → button/link |
| Info Card | Title text + multiple label:value rows + action links | title → info-rows → actions |
| Table | Header row + data rows with consistent columns | header-row → data-rows[] |
| Navigation Item | Icon + label, possibly with active state | icon → label (+ badge) |
| Button | Text with optional icon, distinct background | (icon) → text |
| Input Field | Label above + input box + optional helper text | label → input → helper |

## Step 3: Generate Section Inventory JSON

Create an inventory file for each screen.

### Output Path
```
preview/layouts/data/{ScreenName}-inventory.json
```

### Schema

```json
{
  "screenName": "Billing",
  "screenshotPath": "screenshots/Billing.png",
  "analyzedAt": "2024-01-15T10:30:00Z",
  "dimensions": {
    "width": 1440,
    "height": 1024
  },
  "sections": [
    {
      "id": "sidebar",
      "type": "navigation",
      "location": "left",
      "bounds": {
        "approximate": "left-edge, full-height",
        "width": "~250px"
      },
      "children": {
        "count": 7,
        "type": "nav-item"
      },
      "hasHeader": true,
      "hasActions": false
    },
    {
      "id": "credit-card",
      "type": "card",
      "subtype": "credit-card",
      "location": "top-left-main",
      "bounds": {
        "approximate": "first card in top row"
      },
      "pattern": "credit-card",
      "content": {
        "hasNumber": true,
        "hasDetails": true,
        "hasChip": true
      }
    },
    {
      "id": "salary-card",
      "type": "card",
      "subtype": "stat-card",
      "location": "top-row, second position",
      "pattern": "stat-card",
      "content": {
        "icon": "plus in circle",
        "value": "$2,000",
        "label": "Salary",
        "sublabel": "Belong Interactive"
      }
    },
    {
      "id": "paypal-card",
      "type": "card",
      "subtype": "stat-card",
      "location": "top-row, third position",
      "pattern": "stat-card",
      "content": {
        "icon": "PayPal logo",
        "value": "$49,000",
        "label": "Paypal",
        "sublabel": "Freelance Payment"
      }
    },
    {
      "id": "invoices",
      "type": "list",
      "location": "top-row, fourth position",
      "bounds": {
        "approximate": "right side of top row"
      },
      "hasHeader": true,
      "headerAction": "VIEW ALL",
      "children": {
        "count": 5,
        "type": "invoice-item"
      }
    },
    {
      "id": "payment-method",
      "type": "card",
      "location": "second row, full width",
      "hasHeader": true,
      "content": {
        "cards": 2,
        "addButton": true
      }
    },
    {
      "id": "billing-information",
      "type": "list",
      "location": "third row, left side",
      "hasHeader": true,
      "children": {
        "count": 3,
        "type": "info-card",
        "hasActions": true
      }
    },
    {
      "id": "transactions",
      "type": "list",
      "location": "third row, right side",
      "hasHeader": true,
      "headerSubtitle": true,
      "children": {
        "count": 6,
        "type": "transaction-item"
      }
    }
  ],
  "patterns": {
    "stat-card": {
      "count": 2,
      "instances": ["salary-card", "paypal-card"]
    },
    "list-item": {
      "count": 14,
      "locations": ["invoices", "billing-information", "transactions"]
    },
    "info-card": {
      "count": 3,
      "location": "billing-information"
    }
  },
  "totalSections": 8,
  "totalContentItems": 25
}
```

## Step 4: Validation Checklist

Before proceeding to API extraction, verify the inventory:

### Completeness Check
- [ ] All visible cards/panels identified
- [ ] All list sections with item counts
- [ ] All buttons and action links noted
- [ ] Navigation structure captured
- [ ] Footer content (if any) recorded

### Pattern Check
- [ ] Repeating patterns identified and counted
- [ ] Stat cards recognized (icon + value + label)
- [ ] List items recognized (icon + content + action)
- [ ] Info cards recognized (title + details + actions)

### Layout Check
- [ ] Grid structure understood (columns, rows)
- [ ] Section positions recorded
- [ ] Nesting relationships clear

## Step 5: Guide API Extraction

The inventory guides the subsequent extraction phases:

### For extract-layouts.md
- Use `totalSections` count as target
- Match section IDs from inventory
- Verify all `patterns` are detected

### For extract-content.md
- Use `children.count` to verify item extraction
- Match `content` fields with extracted text
- Verify `headerAction` buttons are captured

### For verify-extraction.md
- Compare extracted sections vs inventory sections
- Calculate coverage percentage
- Flag missing sections for review

## Example: Billing Page Analysis

### Screenshot Shows:
1. **Sidebar** (left, full height) - 7 nav items
2. **Top Row** (4 cards):
   - Credit Card (gradient, card display)
   - Salary Card (stat: +$2,000)
   - PayPal Card (stat: $49,000)
   - Invoices (list: 5 items + "VIEW ALL")
3. **Second Row** (full width):
   - Payment Method (2 credit cards + "ADD NEW CARD")
4. **Third Row** (2 columns):
   - Billing Information (3 info cards with DELETE/EDIT)
   - Transactions (6 items, some "Pending")
5. **Footer** (optional) - Copyright + links

### Expected Extraction:
- 8 main sections (not 5)
- 3 stat-card pattern instances
- 14+ list items across sections
- 6+ action buttons

## Error Handling

### Screenshot Export Fails
If the Figma API returns an error for image export:
1. Log the error with frame ID
2. Continue with API-only extraction
3. Note in extraction report that visual verification was skipped

### Vision Analysis Incomplete
If pattern recognition is uncertain:
1. Mark section as "needs-review" in inventory
2. Include screenshot reference in extraction report
3. Proceed with best-effort extraction

## Integration with Other Phases

```
┌─────────────────────────────────────────┐
│  Phase 0: Visual Analysis               │
│  - Export screenshots                   │
│  - Analyze sections                     │
│  - Create inventory                     │
└─────────────────────────────────────────┘
                    │
                    ▼ (inventory.json)
┌─────────────────────────────────────────┐
│  Phase 2: Extract Layouts               │
│  - Use inventory as target              │
│  - Deep traverse to match sections      │
│  - Verify section count                 │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  Phase 3: Extract Content               │
│  - Match item counts from inventory     │
│  - Verify patterns detected             │
│  - Capture all noted actions            │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  Phase 6: Verification                  │
│  - Compare extraction vs inventory      │
│  - Calculate coverage                   │
│  - Generate fidelity report             │
└─────────────────────────────────────────┘
```

## Summary

Visual analysis serves as the "ground truth" for extraction:
1. **Capture** what the design actually looks like
2. **Inventory** all visible sections and patterns
3. **Guide** API extraction with specific targets
4. **Verify** extraction completeness against visual evidence

This ensures the extraction process captures everything visible in the Figma design, not just what the API traversal happens to find.
