#!/usr/bin/env python3
"""
file-ops.py - File operations for extraction scripts

Usage:
    # Count files matching pattern:
    python3 file-ops.py count --pattern "specs/layouts/*.md" --dir "${OUTPUT_DIR}"
    -> { "count": 6, "files": [...] }

    # Check existence of files:
    python3 file-ops.py exists --files "tokens/colors.css,tokens/typography.css" --dir "${OUTPUT_DIR}"
    -> { "allExist": true, "missing": [] }

    # Compare file counts between patterns:
    python3 file-ops.py compare --pattern-a "specs/layouts/*.md" --pattern-b "preview/layouts/*.html" --exclude-b "index.html"
    -> { "match": true, "countA": 6, "countB": 6 }
"""

import argparse
import json
import sys
from pathlib import Path


def cmd_count(args):
    """Count files matching a glob pattern."""
    base_dir = Path(args.dir) if args.dir else Path('.')
    pattern = args.pattern

    # Handle pattern - if it starts with the dir, strip it
    if pattern.startswith(str(base_dir)):
        pattern = pattern[len(str(base_dir)):].lstrip('/')

    files = sorted([str(f.relative_to(base_dir)) for f in base_dir.glob(pattern)])

    result = {
        "count": len(files),
        "files": files,
        "pattern": args.pattern,
        "dir": str(base_dir)
    }
    print(json.dumps(result, indent=2))


def cmd_exists(args):
    """Check if files exist."""
    base_dir = Path(args.dir) if args.dir else Path('.')
    files_to_check = [f.strip() for f in args.files.split(',') if f.strip()]

    missing = []
    found = []

    for rel_path in files_to_check:
        full_path = base_dir / rel_path
        if full_path.exists():
            found.append(rel_path)
        else:
            missing.append(rel_path)

    result = {
        "allExist": len(missing) == 0,
        "missing": missing,
        "found": found,
        "dir": str(base_dir)
    }
    print(json.dumps(result, indent=2))


def cmd_compare(args):
    """Compare file counts between two patterns."""
    base_dir = Path(args.dir) if args.dir else Path('.')

    pattern_a = args.pattern_a
    pattern_b = args.pattern_b
    exclude_b = args.exclude_b.split(',') if args.exclude_b else []

    files_a = list(base_dir.glob(pattern_a))
    files_b = list(base_dir.glob(pattern_b))

    # Apply exclusions to pattern B
    if exclude_b:
        files_b = [f for f in files_b if f.name not in exclude_b]

    count_a = len(files_a)
    count_b = len(files_b)

    result = {
        "match": count_a == count_b,
        "countA": count_a,
        "countB": count_b,
        "patternA": pattern_a,
        "patternB": pattern_b,
        "filesA": sorted([f.name for f in files_a]),
        "filesB": sorted([f.name for f in files_b]),
        "dir": str(base_dir)
    }
    print(json.dumps(result, indent=2))


def cmd_list(args):
    """List files matching a pattern."""
    base_dir = Path(args.dir) if args.dir else Path('.')
    pattern = args.pattern

    files = sorted(base_dir.glob(pattern))

    # Get file info
    file_info = []
    for f in files:
        info = {
            "name": f.name,
            "path": str(f.relative_to(base_dir)),
            "size": f.stat().st_size if f.is_file() else 0,
            "isDir": f.is_dir()
        }
        file_info.append(info)

    result = {
        "files": file_info,
        "count": len(file_info),
        "pattern": pattern,
        "dir": str(base_dir)
    }
    print(json.dumps(result, indent=2))


def main():
    parser = argparse.ArgumentParser(description='File operations utility')
    subparsers = parser.add_subparsers(dest='command', help='Command to run')

    # Count command
    count_parser = subparsers.add_parser('count', help='Count files matching pattern')
    count_parser.add_argument('--pattern', '-p', required=True, help='Glob pattern')
    count_parser.add_argument('--dir', '-d', help='Base directory')

    # Exists command
    exists_parser = subparsers.add_parser('exists', help='Check if files exist')
    exists_parser.add_argument('--files', '-f', required=True,
                               help='Comma-separated list of files')
    exists_parser.add_argument('--dir', '-d', help='Base directory')

    # Compare command
    compare_parser = subparsers.add_parser('compare', help='Compare file counts')
    compare_parser.add_argument('--pattern-a', '-a', required=True, help='First pattern')
    compare_parser.add_argument('--pattern-b', '-b', required=True, help='Second pattern')
    compare_parser.add_argument('--exclude-b', '-e', help='Comma-separated files to exclude from B')
    compare_parser.add_argument('--dir', '-d', help='Base directory')

    # List command
    list_parser = subparsers.add_parser('list', help='List files with details')
    list_parser.add_argument('--pattern', '-p', required=True, help='Glob pattern')
    list_parser.add_argument('--dir', '-d', help='Base directory')

    args = parser.parse_args()

    if args.command == 'count':
        cmd_count(args)
    elif args.command == 'exists':
        cmd_exists(args)
    elif args.command == 'compare':
        cmd_compare(args)
    elif args.command == 'list':
        cmd_list(args)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
