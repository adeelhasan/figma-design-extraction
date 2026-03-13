# 01 - Connect to Figma & Analyze

## Trigger
When user provides a Figma URL for extraction.

## Important: MCP Tool Restriction

**DO NOT use Figma MCP tools (mcp__figma__*) during extraction.**

If these tools are available, they must not be used. The extraction process follows a structured prompt-based approach.

## Input
- Figma URL (file, design, or prototype link)
- OUTPUT_DIR: the timestamped output directory (created by init-extraction.py)
- SCRIPTS: path to `.claude/skills/figma-extraction/scripts`

## Authentication

Token is resolved automatically by the Python scripts. They check (in order):
1. `FIGMA_TOKEN` or `FIGMA_ACCESS_TOKEN` environment variable
2. `FIGMA_ACCESS_TOKEN=xxx` in `.env.local` at project root
3. `.claude/skills/figma-extraction/config/credentials.json`

If no token is found, the script returns an error with setup instructions.

## Process

### Step 1: Parse URL
The `fetch-figma-file.py` script handles URL parsing automatically. It accepts both formats:
- `https://www.figma.com/file/{key}/{name}`
- `https://www.figma.com/design/{key}/{name}`

### Step 2: Fetch Figma File

```bash
python3 ${SCRIPTS}/fetch-figma-file.py --url "${FIGMA_URL}" --output "${OUTPUT_DIR}"
```

This script:
- Parses the URL to extract file key and optional node ID
- Resolves the Figma token automatically
- Calls the Figma REST API
- Saves the full response to `${OUTPUT_DIR}/.cache/figma-file.json`
- Returns JSON summary with file info, screens, and component sets

Parse the JSON output to get:
- `fileKey` — needed for screenshot export
- `screens[]` — list of screen names, IDs, and dimensions
- `analysis` — style counts, component count

### Step 3: Report to User

Output a clear summary of what was found:

```
Connected to Figma

File: "{fileName}"
Last modified: {relativeTime}

What we found:
-- Pages: {pageCount}
-- Published Styles: Colors: {n}, Text: {n}, Effects: {n}
-- Components: {componentSetCount} component sets
-- Screens detected: {screenCount}
   {screenName} ({dimensions})
   ...

Proceeding with extraction...
```

**Detect presentation/preview canvases:** Check each screen's dimensions. If a frame is significantly wider than typical screen widths (e.g., >2000px wide for a desktop layout, suggesting multiple pages side-by-side), include a warning in the summary:

```
⚠ Note: "{screenName}" ({width}x{height}) appears to be a presentation canvas
  (multiple pages arranged side-by-side). Structured layout extraction may be
  limited for this frame — it likely contains flattened image fills rather than
  real component nodes. Tokens and other structured frames will still extract
  correctly. For full layout extraction, use the editable source Figma file.
```

Also flag if the file name contains "(Preview)", "(Handoff)", or similar suffixes:

```
⚠ Note: This appears to be a preview/handoff file. It may contain flattened
  image fills instead of editable component nodes. Tokens will extract correctly,
  but screen layouts may be limited.
```

### Step 4: Export Screen Screenshots

Use the export-images script to download screenshots of each screen frame:

```bash
python3 ${SCRIPTS}/export-images.py \
  --file-key "${FILE_KEY}" \
  --node-ids "${SCREEN_IDS}" \
  --names "${SCREEN_NAMES}" \
  --output "${OUTPUT_DIR}/preview/layouts/screenshots" \
  --flat \
  --scale 1
```

Where:
- `SCREEN_IDS` is a comma-separated list of screen node IDs from Step 2 (e.g., `0:263,0:1777,0:2136`)
- `SCREEN_NAMES` is a comma-separated list of screen names (e.g., `Dashboard,Tables,Billing`)
- `--flat` saves directly to the screenshots dir (no category subdirs)
- `--scale 1` for 1x resolution screenshots

Report screenshot status:
```
Screenshots captured:
-- Dashboard.png
-- Tables.png
-- Billing.png
...
```

**Note:** If screenshot export fails for any frame, log the error and continue. The extraction can proceed without screenshots, but fingerprinting accuracy may be reduced.

### Step 5: Generate Essentials File

After caching the Figma API response, generate the compact essentials summary:

```bash
python3 ${SCRIPTS}/figma-query.py \
  --cache ${OUTPUT_DIR}/.cache/figma-file.json essentials \
  > ${OUTPUT_DIR}/figma-essentials.json
```

This produces `figma-essentials.json` (~5KB) — a table-of-contents with:
- File metadata (name, version, lastModified)
- Pages with their frames and screens listed
- Design summary (unique colors, text styles, gradients, effects, radii, component count)

**All downstream agents read this file instead of the full 2.5MB cache.**

Verify the essentials file was created:
```bash
python3 -c "import json; d=json.load(open('${OUTPUT_DIR}/figma-essentials.json')); print(f'Essentials: {len(d[\"pages\"])} pages, {sum(len(p[\"screens\"]) for p in d[\"pages\"])} screens')"
```

### Step 6: Create Extraction Metadata

Write `${OUTPUT_DIR}/extraction-meta.json` with initial metadata:
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
  "screens": {
    "{ScreenName}": { "nodeId": "{id}", "dimensions": "{WxH}" }
  },
  "tokens": {},
  "components": {}
}
```

Note: Directory structure was already created by `init-extraction.py` in pre-flight. No need to create directories here.

## Error Handling

### Authentication Failed
If `fetch-figma-file.py` returns `success: false` with a token error:
```
Could not connect to Figma.

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
```

### File Not Found / Access Denied
If the script returns a 404 or 403 error, relay the error message to the user.

## Fallbacks

Different Figma files are organized differently. The extraction handles common variations:

- **No published styles?** Each extraction step scans nodes directly for values
- **Mixed organization?** Components and screens can be on any page
- **Non-standard screen sizes?** Name-based detection as fallback
- **Empty pages?** Skipped automatically
- **Presentation/preview canvases?** Frames wider than ~2000px are likely multi-page canvases with flattened image fills. Tokens still extract, but layouts will be image-only. Warn the user in the connect summary.

The goal is to extract what's there, not fail on what's missing.

## Query Tool

After this phase completes, all downstream agents use the query tool instead of reading the cache directly:

```bash
# Token agents use:
python3 ${SCRIPTS}/figma-query.py --cache ${OUTPUT_DIR}/.cache/figma-file.json colors
python3 ${SCRIPTS}/figma-query.py --cache ${OUTPUT_DIR}/.cache/figma-file.json gradients
python3 ${SCRIPTS}/figma-query.py --cache ${OUTPUT_DIR}/.cache/figma-file.json text-styles
python3 ${SCRIPTS}/figma-query.py --cache ${OUTPUT_DIR}/.cache/figma-file.json effects

# Screen agents use:
python3 ${SCRIPTS}/figma-query.py --cache ${OUTPUT_DIR}/.cache/figma-file.json screen-layout "ScreenName"
python3 ${SCRIPTS}/figma-query.py --cache ${OUTPUT_DIR}/.cache/figma-file.json section "ScreenName" "sectionName"
```

## Next Step
Proceed to: `design-system-fingerprint.md` (Phase 2)
