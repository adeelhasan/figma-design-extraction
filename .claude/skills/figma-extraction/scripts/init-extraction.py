#!/usr/bin/env python3
"""
init-extraction.py - Initialize extraction directory structure

Usage:
    python3 init-extraction.py [--name <name>]
    python3 init-extraction.py <output-dir>

Output:
    JSON { "outputDir": "...", "created": [...], "symlink": "design-system-latest" }
"""

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description='Initialize extraction directory structure')
    parser.add_argument('output_dir', nargs='?', help='Output directory path')
    parser.add_argument('--name', help='Named output folder (design-system-<name>)')
    args = parser.parse_args()

    # Determine output directory
    if args.output_dir:
        output_dir = args.output_dir
    elif args.name:
        output_dir = f"design-system-{args.name}"
    else:
        timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
        output_dir = f"design-system-{timestamp}"

    # Directory structure to create
    directories = [
        "tokens",
        "specs/layouts",
        "assets",
        "preview/layouts/data",
        "preview/layouts/screenshots",
        "preview/layouts/shells",
        ".cache",
        ".cache/screen-packages",
    ]

    created = []

    # Create directories
    for subdir in directories:
        dir_path = Path(output_dir) / subdir
        if not dir_path.exists():
            dir_path.mkdir(parents=True, exist_ok=True)
            created.append(str(dir_path))

    # Create/update symlink
    symlink_path = Path("design-system-latest")

    # Remove existing symlink if it exists
    if symlink_path.is_symlink() or symlink_path.exists():
        symlink_path.unlink()

    # Create new symlink
    symlink_path.symlink_to(output_dir)

    # Output JSON result
    result = {
        "outputDir": output_dir,
        "created": created,
        "symlink": "design-system-latest",
        "directories": directories
    }

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
