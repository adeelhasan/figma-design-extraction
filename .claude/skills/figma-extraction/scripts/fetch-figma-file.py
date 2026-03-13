#!/usr/bin/env python3
"""
Fetch Figma file data via API and save to cache.

Usage:
    python3 fetch-figma-file.py --url "https://www.figma.com/file/..." --output "./design-system-xxx"
    python3 fetch-figma-file.py --file-key "abc123" --output "./design-system-xxx"

Outputs:
    - {output}/.cache/figma-file.json - Full Figma file data
    - JSON summary to stdout
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path

try:
    import requests
except ImportError:
    print(json.dumps({
        "success": False,
        "error": "requests module not installed. Run: pip install requests"
    }))
    sys.exit(1)


def parse_figma_url(url: str) -> dict:
    """Extract file key and optional node ID from Figma URL."""
    # Patterns:
    # https://www.figma.com/file/{key}/{name}
    # https://www.figma.com/design/{key}/{name}
    # ?node-id={nodeId}

    patterns = [
        r'figma\.com/(?:file|design)/([a-zA-Z0-9]+)',
    ]

    file_key = None
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            file_key = match.group(1)
            break

    node_id = None
    node_match = re.search(r'node-id=([^&]+)', url)
    if node_match:
        node_id = node_match.group(1).replace('-', ':')

    return {
        "file_key": file_key,
        "node_id": node_id,
        "original_url": url
    }


def resolve_figma_token() -> str:
    """Resolve Figma access token from environment or config files."""
    # 1. Environment variables
    token = os.environ.get('FIGMA_TOKEN') or os.environ.get('FIGMA_ACCESS_TOKEN')
    if token:
        return token

    # 2. .env.local file
    env_local = Path('.env.local')
    if env_local.exists():
        content = env_local.read_text()
        for line in content.splitlines():
            if line.startswith('FIGMA_TOKEN=') or line.startswith('FIGMA_ACCESS_TOKEN='):
                return line.split('=', 1)[1].strip().strip('"\'')

    # 3. Skill config file
    config_path = Path('.claude/skills/figma-extraction/config/credentials.json')
    if config_path.exists():
        try:
            config = json.loads(config_path.read_text())
            return config.get('figma', {}).get('accessToken')
        except (json.JSONDecodeError, KeyError):
            pass

    return None


def fetch_figma_file(file_key: str, token: str, node_id: str = None) -> dict:
    """Fetch Figma file data via API."""
    base_url = f"https://api.figma.com/v1/files/{file_key}"

    params = {}
    if node_id:
        params['ids'] = node_id

    headers = {
        'X-Figma-Token': token
    }

    response = requests.get(base_url, headers=headers, params=params)

    if response.status_code == 401:
        return {"error": "Authentication failed (401). Check your Figma token.", "status": 401}
    elif response.status_code == 403:
        return {"error": "Access denied (403). Token may not have access to this file.", "status": 403}
    elif response.status_code == 404:
        return {"error": "File not found (404). Check the file key.", "status": 404}
    elif response.status_code != 200:
        return {"error": f"API error ({response.status_code}): {response.text}", "status": response.status_code}

    return response.json()


def is_reference_page(page_name: str) -> bool:
    """Check if a page is a reference/component page (not real screens)."""
    lower = page_name.lower()
    keywords = ["component", "symbol", "thumbnail", "license", "code version",
                "icon", "asset", "style", "token", "color", "typograph"]
    return any(kw in lower for kw in keywords)


def analyze_file_structure(file_data: dict) -> dict:
    """Analyze the structure of the Figma file."""
    document = file_data.get('document', {})
    styles = file_data.get('styles', {})

    # Count styles by type
    style_counts = {
        'colors': 0,
        'text': 0,
        'effects': 0,
        'grid': 0
    }

    for style_id, style_info in styles.items():
        style_type = style_info.get('styleType', '')
        if style_type == 'FILL':
            style_counts['colors'] += 1
        elif style_type == 'TEXT':
            style_counts['text'] += 1
        elif style_type == 'EFFECT':
            style_counts['effects'] += 1
        elif style_type == 'GRID':
            style_counts['grid'] += 1

    # Analyze pages
    pages = []
    total_frames = 0
    component_sets = []
    screens = []

    for page in document.get('children', []):
        page_frames = 0
        page_components = []
        page_screens = []
        page_name = page.get('name', '')
        skip_screens = is_reference_page(page_name)

        for child in page.get('children', []):
            if child.get('type') == 'FRAME':
                page_frames += 1

                # Check if screen-like
                bounds = child.get('absoluteBoundingBox', {})
                width = bounds.get('width', 0)
                height = bounds.get('height', 0)
                name = child.get('name', '')

                screen_widths = [320, 375, 390, 414, 428, 768, 834, 1024, 1280, 1440, 1920]
                is_screen_width = any(abs(width - w) < 30 for w in screen_widths)
                has_screen_name = any(kw in name.lower() for kw in
                    ['page', 'screen', 'view', 'dashboard', 'home', 'login', 'signup', 'profile', 'settings', 'billing', 'table'])
                is_large = width > 300 and height > 400

                if not skip_screens and ((is_screen_width and height > 400) or has_screen_name or is_large):
                    page_screens.append({
                        'name': name,
                        'id': child.get('id'),
                        'dimensions': f"{int(width)}x{int(height)}"
                    })

            elif child.get('type') == 'COMPONENT_SET':
                page_components.append({
                    'name': child.get('name'),
                    'variants': len(child.get('children', []))
                })

        pages.append({
            'name': page.get('name'),
            'frames': page_frames
        })

        total_frames += page_frames
        component_sets.extend(page_components)
        screens.extend(page_screens)

    return {
        'name': file_data.get('name', 'Unknown'),
        'lastModified': file_data.get('lastModified'),
        'version': file_data.get('version'),
        'pages': pages,
        'totalFrames': total_frames,
        'styles': style_counts,
        'componentSets': component_sets,
        'screens': screens
    }


def main():
    parser = argparse.ArgumentParser(description='Fetch Figma file data via API')
    parser.add_argument('--url', help='Figma file URL')
    parser.add_argument('--file-key', help='Figma file key (alternative to URL)')
    parser.add_argument('--output', required=True, help='Output directory path')
    parser.add_argument('--token', help='Figma access token (optional, will auto-resolve)')

    args = parser.parse_args()

    # Parse URL or use file key directly
    if args.url:
        parsed = parse_figma_url(args.url)
        file_key = parsed['file_key']
        node_id = parsed['node_id']
        original_url = parsed['original_url']
    elif args.file_key:
        file_key = args.file_key
        node_id = None
        original_url = f"https://www.figma.com/file/{file_key}"
    else:
        print(json.dumps({
            "success": False,
            "error": "Must provide either --url or --file-key"
        }))
        return 1

    if not file_key:
        print(json.dumps({
            "success": False,
            "error": "Could not parse file key from URL"
        }))
        return 1

    # Resolve token
    token = args.token or resolve_figma_token()
    if not token:
        print(json.dumps({
            "success": False,
            "error": "No Figma token found. Set FIGMA_TOKEN env var or create .env.local"
        }))
        return 1

    # Fetch file data
    file_data = fetch_figma_file(file_key, token, node_id)

    if 'error' in file_data:
        print(json.dumps({
            "success": False,
            "error": file_data['error']
        }))
        return 1

    # Create output directory and cache
    output_path = Path(args.output)
    cache_path = output_path / '.cache'
    cache_path.mkdir(parents=True, exist_ok=True)

    # Save full file data
    cache_file = cache_path / 'figma-file.json'
    with open(cache_file, 'w') as f:
        json.dump(file_data, f, indent=2)

    # Analyze structure
    analysis = analyze_file_structure(file_data)

    # Output summary
    result = {
        "success": True,
        "fileKey": file_key,
        "fileName": analysis['name'],
        "lastModified": analysis['lastModified'],
        "url": original_url,
        "cachePath": str(cache_file),
        "analysis": {
            "pages": len(analysis['pages']),
            "totalFrames": analysis['totalFrames'],
            "styles": analysis['styles'],
            "componentSets": len(analysis['componentSets']),
            "screens": len(analysis['screens'])
        },
        "screens": analysis['screens'],
        "componentSets": analysis['componentSets']
    }

    print(json.dumps(result, indent=2))
    return 0


if __name__ == '__main__':
    sys.exit(main())
