# 01 - Connect to Figma & Analyze

## Trigger
When user provides a Figma URL for extraction.

## Important: MCP Tool Restriction

**DO NOT use Figma MCP tools (mcp__figma__*) during extraction.**

If these tools are available, they must not be used. The extraction process follows a structured prompt-based approach.

## Input
- Figma URL (file, design, or prototype link)
- Optional: specific page or node ID

## Authentication: Figma Access Token

The skill requires a Figma Personal Access Token. Check these locations **in order**:

### Token Lookup Chain

```bash
# 1. Environment variable (highest priority)
$FIGMA_ACCESS_TOKEN

# 2. Project .env.local file
# Look for: FIGMA_ACCESS_TOKEN=xxx in .env.local at project root

# 3. Skill config file
# Look for: .claude/skills/figma-extraction/config/credentials.json
# Format: { "figma": { "accessToken": "xxx" } }
```

### Token Resolution Process

```bash
# Step 1: Check environment variable
if [ -n "$FIGMA_ACCESS_TOKEN" ]; then
  TOKEN="$FIGMA_ACCESS_TOKEN"

# Step 2: Check .env.local
elif [ -f ".env.local" ]; then
  TOKEN=$(grep '^FIGMA_ACCESS_TOKEN=' .env.local | cut -d '=' -f2)

# Step 3: Check skill config
elif [ -f ".claude/skills/figma-extraction/config/credentials.json" ]; then
  TOKEN=$(python3 -c "import json; print(json.load(open('.claude/skills/figma-extraction/config/credentials.json'))['figma']['accessToken'])")
fi

# Step 4: If no token found, show setup instructions
if [ -z "$TOKEN" ]; then
  # Display error with setup instructions (see below)
fi
```

### Token Not Found Error

If no token is found in any location, display:

```
Figma Access Token not found.

Please set up your token using ONE of these methods:

1. Environment variable:
   export FIGMA_ACCESS_TOKEN="figd_your_token_here"

2. Project .env.local file (create in project root):
   FIGMA_ACCESS_TOKEN=figd_your_token_here

3. Skill config file:
   cp .claude/skills/figma-extraction/config/credentials.example.json \
      .claude/skills/figma-extraction/config/credentials.json
   # Then edit credentials.json with your token

To get a token:
1. Go to Figma Settings > Account > Personal access tokens
2. Generate a new token
3. Copy the token (starts with figd_)

See: .claude/skills/figma-extraction/config/README.md for details.
```

## URL Patterns

```
File URL:
https://www.figma.com/file/{fileKey}/{fileName}

Design URL:
https://www.figma.com/design/{fileKey}/{fileName}

With Node:
...?node-id={nodeId}

With Page:
...?node-id={pageId}-0
```

## Process

### Step 1: Parse URL
Extract the file key from the URL:
```
https://www.figma.com/file/abc123xyz/MyDesign
                            ^^^^^^^^^ 
                            file key
```

If node-id parameter present, note it for targeted extraction.

### Step 2: Analyze File Structure

Gather high-level information about what's in the file. Each extraction step will do its own detailed traversal.

#### 2a. Count Published Styles

```typescript
const styles = {
  colors: Object.values(file.styles).filter(s => s.styleType === 'FILL').length,
  text: Object.values(file.styles).filter(s => s.styleType === 'TEXT').length,
  effects: Object.values(file.styles).filter(s => s.styleType === 'EFFECT').length
};
```

#### 2b. Find Components and Screens

Walk top-level frames in each page to identify:
- Component sets (`type === 'COMPONENT_SET'`)
- Screen-like frames (by size or name)

```typescript
function analyzePages(document: FigmaDocument): PageAnalysis[] {
  return document.children.map(page => {
    const components = [];
    const screens = [];

    for (const child of page.children) {
      if (child.type === 'COMPONENT_SET') {
        components.push({ name: child.name, variants: child.children?.length });
      } else if (child.type === 'FRAME' && isScreenLike(child)) {
        screens.push({ name: child.name, dimensions: getDimensions(child) });
      }
    }

    return { name: page.name, components, screens };
  });
}

function isScreenLike(node: FigmaNode): boolean {
  const { width, height } = node.absoluteBoundingBox || {};
  // Common screen widths (with tolerance)
  const screenWidths = [320, 375, 390, 414, 428, 768, 834, 1024, 1280, 1440, 1920];
  const isScreenWidth = screenWidths.some(w => Math.abs(width - w) < 30);
  // Or has meaningful name
  const hasScreenName = /page|screen|view|dashboard|home|login|signup|profile|settings|billing|table/i.test(node.name);
  // Or is reasonably large
  const isLargeFrame = width > 300 && height > 400;

  return (isScreenWidth && height > 400) || hasScreenName || isLargeFrame;
}
```

### Step 3: Report to User

Output a clear summary of what was found:

```
✓ Connected to Figma

File: "{fileName}"
Last modified: {relativeTime}

What we found:
├── Pages: {pageCount}
│   {{#each pages}}
│   ├── {name} ({frameCount} frames)
│   {{/each}}
│
├── Published Styles:
│   ├── Colors: {colorCount} {{if colorCount > 0}}✓{{else}}⚠ none{{/if}}
│   ├── Text: {textCount} {{if textCount > 0}}✓{{else}}⚠ none{{/if}}
│   └── Effects: {effectCount} {{if effectCount > 0}}✓{{else}}(will infer){{/if}}
│
├── Components: {componentSetCount} component sets
│   {{#each componentSets}}
│   ├── {name} ({variantCount} variants)
│   {{/each}}
│
└── Screens detected: {screenCount}
    {{#each screens}}
    ├── {name} ({dimensions})
    {{/each}}

Proceeding with extraction...
```

**Notes:**
- If published styles are missing, extraction will scan nodes directly
- If no component sets found, will look for standalone components
- If screens not detected by size, will use name-based matching

### Step 4: Export Screen Images (if --thorough)

When the `--thorough` flag is passed, capture screenshots of each screen frame for visual analysis.

#### 4a. Request Frame Images

For each screen frame identified in Step 2b:

```
GET https://api.figma.com/v1/images/{fileKey}?ids={frameNodeIds}&format=png&scale=1
```

Where `frameNodeIds` is a comma-separated list of screen frame IDs.

#### 4b. Download and Save Images

```bash
# Create screenshots directory
mkdir -p design-system/preview/layouts/screenshots

# For each frame in the response:
# 1. Fetch the image URL from response.images[frameId]
# 2. Download the PNG content
# 3. Save to design-system/preview/layouts/screenshots/{ScreenName}.png
```

#### 4c. Visual Analysis

For each screenshot:
1. Analyze the image to identify all visible UI sections
2. Count distinct cards, lists, tables, and other UI patterns
3. Create a section inventory (see `visual-analysis.md` for details)
4. Save inventory to `design-system/preview/layouts/data/{ScreenName}-inventory.json`

The inventory serves as "ground truth" for validating extraction completeness.

#### 4d. Report Screenshot Status

```
Screenshot capture (--thorough mode):
├── Dashboard.png ✓ (8 sections identified)
├── Tables.png ✓ (5 sections identified)
├── Billing.png ✓ (10 sections identified)
├── Profile.png ✓ (7 sections identified)
├── Sign-In.png ✓ (4 sections identified)
└── Sign-Up.png ✓ (5 sections identified)

Visual inventories saved to preview/layouts/data/
```

**Note:** If screenshot export fails for any frame, log the error and continue with API-only extraction. The extraction can still proceed without visual verification.

### Step 5: Initialize Output Directory

Create directory structure at project root:
```
design-system/
├── tokens/
└── preview/
    └── layouts/
        ├── screenshots/    # (if --thorough)
        └── data/           # (if --thorough)
```

Create initial `extraction-meta.json`:
```json
{
  "figma": {
    "fileKey": "{fileKey}",
    "fileName": "{fileName}",
    "url": "{originalUrl}",
    "lastModified": "{lastModified}"
  },
  "extraction": {
    "startedAt": "{now}",
    "version": "1.0.0",
    "tool": "figma-extraction-skill"
  },
  "tokens": {},
  "components": {},
  "screens": {}
}
```

## Error Handling

### Invalid URL
```
❌ Could not parse Figma URL.

Expected formats:
- https://www.figma.com/file/{key}/{name}
- https://www.figma.com/design/{key}/{name}

Please check the URL and try again.
```

### Authentication Failed
```
❌ Could not connect to Figma (401/403)

Possible causes:
1. Invalid or expired Personal Access Token
2. Token doesn't have access to this file
3. File requires specific permissions

To fix:
1. Check your token is set correctly (see Token Lookup Chain above)
2. Ensure the file is shared with you in Figma
3. Generate a new token at: Figma Settings > Account > Personal access tokens

See: .claude/skills/figma-extraction/config/README.md for setup details.
```

### File Not Found
```
❌ Figma file not found (404)

The file may have been:
- Deleted
- Moved to a different location
- URL copied incorrectly

Please verify the URL in Figma and try again.
```

## Fallbacks

Different Figma files are organized differently. The extraction handles common variations:

- **No published styles?** Each extraction step scans nodes directly for values
- **Mixed organization?** Components and screens can be on any page
- **Non-standard screen sizes?** Name-based detection as fallback
- **Empty pages?** Skipped automatically

The goal is to extract what's there, not fail on what's missing.

## --thorough Flag

The `--thorough` flag enables deeper extraction with visual verification:

| Feature | Standard | --thorough |
|---------|----------|------------|
| Screenshot capture | No | Yes |
| Visual section inventory | No | Yes |
| Recursive depth | 3 levels | 10 levels |
| Pattern detection | Basic | Enhanced |
| Verification pass | No | Yes |

Use `--thorough` when:
- Extracting complex dashboards with nested sections
- Fidelity is critical (design handoff)
- Standard extraction missed content

## Next Step
Proceed to: `extract-colors.md`
