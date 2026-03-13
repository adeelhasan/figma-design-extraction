#!/usr/bin/env python3
"""
Export images from Figma via Images API.

Usage:
    python3 export-images.py --file-key "abc123" --manifest "./assets/asset-manifest.json" --output "./assets/images"
    python3 export-images.py --file-key "abc123" --node-ids "1:234,1:235" --output "./assets/images"
    python3 export-images.py --file-key "abc123" --node-ids "0:263,0:1777" --names "Dashboard,Tables" --output "./screenshots" --flat --scale 1

Outputs:
    - Downloaded images to {output}/{category}/{filename} (or {output}/{filename} with --flat)
    - JSON summary to stdout
"""

import argparse
import json
import os
import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

try:
    import requests
except ImportError:
    print(json.dumps({
        "success": False,
        "error": "requests module not installed. Run: pip install requests"
    }))
    sys.exit(1)


def resolve_figma_token() -> str:
    """Resolve Figma access token from environment or config files."""
    token = os.environ.get('FIGMA_TOKEN') or os.environ.get('FIGMA_ACCESS_TOKEN')
    if token:
        return token

    env_local = Path('.env.local')
    if env_local.exists():
        content = env_local.read_text()
        for line in content.splitlines():
            if line.startswith('FIGMA_TOKEN=') or line.startswith('FIGMA_ACCESS_TOKEN='):
                return line.split('=', 1)[1].strip().strip('"\'')

    config_path = Path('.claude/skills/figma-extraction/config/credentials.json')
    if config_path.exists():
        try:
            config = json.loads(config_path.read_text())
            return config.get('figma', {}).get('accessToken')
        except (json.JSONDecodeError, KeyError):
            pass

    return None


def get_image_urls(file_key: str, node_ids: list, token: str, format: str = 'png', scale: int = 2) -> dict:
    """Get image URLs from Figma API."""
    if not node_ids:
        return {"error": "No node IDs provided"}

    ids_param = ','.join(node_ids)
    url = f"https://api.figma.com/v1/images/{file_key}"

    params = {
        'ids': ids_param,
        'format': format,
        'scale': scale
    }

    headers = {
        'X-Figma-Token': token
    }

    response = requests.get(url, headers=headers, params=params)

    if response.status_code != 200:
        return {"error": f"API error ({response.status_code}): {response.text}"}

    return response.json()


def download_image(url: str, output_path: Path) -> bool:
    """Download image from URL to file."""
    try:
        response = requests.get(url, stream=True, timeout=30)
        if response.status_code == 200:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            return True
    except Exception as e:
        print(f"Error downloading {url}: {e}", file=sys.stderr)
    return False


def get_category_dir(image_type: str) -> str:
    """Map image type to directory name."""
    type_map = {
        'banner': 'backgrounds',
        'background': 'backgrounds',
        'avatar': 'avatars',
        'photo': 'photos',
        'illustration': 'illustrations',
        'logo': 'logos',
        'image': 'misc'
    }
    return type_map.get(image_type, 'misc')


def sanitize_filename(name: str) -> str:
    """Convert name to safe filename."""
    # Remove special characters, convert spaces to hyphens
    name = re.sub(r'[^a-zA-Z0-9\s\-_]', '', name)
    name = re.sub(r'\s+', '-', name.strip())
    name = re.sub(r'-+', '-', name)
    return name


def main():
    parser = argparse.ArgumentParser(description='Export images from Figma')
    parser.add_argument('--file-key', required=True, help='Figma file key')
    parser.add_argument('--manifest', help='Path to asset-manifest.json')
    parser.add_argument('--node-ids', help='Comma-separated node IDs (alternative to manifest)')
    parser.add_argument('--names', help='Comma-separated custom filenames (parallel to --node-ids)')
    parser.add_argument('--output', required=True, help='Output directory for images')
    parser.add_argument('--format', default='png', choices=['png', 'jpg', 'svg'], help='Image format')
    parser.add_argument('--scale', type=int, default=2, choices=[1, 2, 3, 4], help='Export scale')
    parser.add_argument('--flat', action='store_true', help='Save directly to output dir (skip category subdirs)')
    parser.add_argument('--workers', type=int, default=8, help='Parallel download workers (default: 8)')
    parser.add_argument('--batch-size', type=int, default=100, help='Node IDs per Figma API call (default: 100)')
    parser.add_argument('--token', help='Figma access token (optional)')

    args = parser.parse_args()

    # Resolve token
    token = args.token or resolve_figma_token()
    if not token:
        print(json.dumps({
            "success": False,
            "error": "No Figma token found"
        }))
        return 1

    # Get node IDs from manifest or command line
    images_to_export = []
    flat_mode = args.flat

    if args.manifest:
        manifest_path = Path(args.manifest)
        if not manifest_path.exists():
            print(json.dumps({
                "success": False,
                "error": f"Manifest not found: {args.manifest}"
            }))
            return 1

        manifest = json.loads(manifest_path.read_text())

        for image in manifest.get('images', []):
            has_exportable_image = (
                image.get('hasOriginal', False) or
                image.get('imageRef') is not None
            )
            if has_exportable_image:
                images_to_export.append({
                    'id': image['id'],
                    'name': image['name'],
                    'type': image.get('type', 'image')
                })

    elif args.node_ids:
        node_ids = [nid.strip() for nid in args.node_ids.split(',') if nid.strip()]
        custom_names = []
        if args.names:
            custom_names = [n.strip() for n in args.names.split(',')]

        for i, node_id in enumerate(node_ids):
            name = custom_names[i] if i < len(custom_names) else node_id.replace(':', '-')
            images_to_export.append({
                'id': node_id,
                'name': name,
                'type': 'image'
            })

    else:
        print(json.dumps({
            "success": False,
            "error": "Must provide either --manifest or --node-ids"
        }))
        return 1

    if not images_to_export:
        print(json.dumps({
            "success": True,
            "exported": 0,
            "message": "No exportable images found (no image fills)"
        }))
        return 0

    # Get image URLs from Figma API (batched to avoid URL length limits)
    node_ids = [img['id'] for img in images_to_export]
    image_urls = {}
    batch_size = args.batch_size

    for i in range(0, len(node_ids), batch_size):
        batch = node_ids[i:i + batch_size]
        print(f"Fetching URLs for batch {i // batch_size + 1} ({len(batch)} images)...", file=sys.stderr)
        api_response = get_image_urls(args.file_key, batch, token, args.format, args.scale)

        if 'error' in api_response:
            print(json.dumps({
                "success": False,
                "error": api_response['error']
            }))
            return 1

        image_urls.update(api_response.get('images', {}))

    # Build download task list
    output_dir = Path(args.output)
    exported = []
    failed = []
    download_tasks = []

    for image in images_to_export:
        node_id = image['id']
        url = image_urls.get(node_id)

        if not url:
            failed.append({
                'id': node_id,
                'name': image['name'],
                'reason': 'No URL returned from API'
            })
            continue

        filename = f"{sanitize_filename(image['name'])}.{args.format}"
        if flat_mode:
            output_path = output_dir / filename
        else:
            category = get_category_dir(image['type'])
            output_path = output_dir / category / filename

        download_tasks.append((image, url, output_path))

    # Download images in parallel
    print(f"Downloading {len(download_tasks)} images ({args.workers} workers)...", file=sys.stderr)

    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {
            executor.submit(download_image, url, output_path): (image, output_path)
            for image, url, output_path in download_tasks
        }

        for future in as_completed(futures):
            image, output_path = futures[future]
            if future.result():
                exported.append({
                    'id': image['id'],
                    'name': image['name'],
                    'type': image['type'],
                    'path': str(output_path)
                })
            else:
                failed.append({
                    'id': image['id'],
                    'name': image['name'],
                    'reason': 'Download failed'
                })

    # Update manifest if provided
    if args.manifest and exported:
        manifest_path = Path(args.manifest)
        manifest = json.loads(manifest_path.read_text())

        exported_ids = {e['id']: e['path'] for e in exported}
        for image in manifest.get('images', []):
            if image['id'] in exported_ids:
                image['exportPath'] = exported_ids[image['id']]

        manifest['summary']['exported'] = len([img for img in manifest['images'] if img.get('exportPath')])
        manifest['summary']['placeholders'] = manifest['summary']['totalImages'] - manifest['summary']['exported']

        with open(manifest_path, 'w') as f:
            json.dump(manifest, f, indent=2)

    # Output result
    result = {
        "success": True,
        "exported": len(exported),
        "failed": len(failed),
        "images": exported
    }

    if failed:
        result["failures"] = failed

    print(json.dumps(result, indent=2))
    return 0


if __name__ == '__main__':
    sys.exit(main())
