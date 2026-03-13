# Download Image Assets (Phase 4b)

## Purpose

Download exportable images from Figma using the pre-generated asset manifest. The icon-manifest.json and asset-manifest.json are already created by `prepare-icons-assets.py` — this agent just handles the download step.

## Input

- Asset manifest: `${OUTPUT_DIR}/assets/asset-manifest.json` (already exists)
- Icon manifest: `${OUTPUT_DIR}/assets/icon-manifest.json` (already exists)
- File key: `${FILE_KEY}` (passed by orchestrator)

## Process

### Step 1: Check Manifest

Read `${OUTPUT_DIR}/assets/asset-manifest.json` and check if any images have `hasOriginal: true`.

If no images have `hasOriginal: true`, report "No exportable images" and exit.

### Step 2: Download Images

Run the export script to download all images with original fills:

```bash
python3 ${SCRIPTS}/export-images.py \
  --file-key "${FILE_KEY}" \
  --manifest "${OUTPUT_DIR}/assets/asset-manifest.json" \
  --output "${OUTPUT_DIR}/assets/images"
```

### Step 3: Report

```
Done: Asset Download
├── icon-manifest.json (pre-generated)
├── asset-manifest.json (pre-generated)
├── Images with originals: {count}
├── Downloaded: {count}
└── Failed: {count}
```
