#!/usr/bin/env python3
"""
NeoForge Documentation Navigator
CLI tool for quick navigation to project documentation
"""

import json
import os
import sys
import argparse
from pathlib import Path

def load_navigation_index():
    """Load the navigation index JSON file."""
    nav_file = Path(__file__).parent.parent / "NAVIGATION_INDEX.json"
    try:
        with open(nav_file, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print("❌ Navigation index not found. Run from project root.")
        sys.exit(1)

def show_help():
    """Show available navigation options."""
    nav = load_navigation_index()
    
    print("🧭 NeoForge Documentation Navigator")
    print("=" * 40)
    
    print("\n📋 Main Sections:")
    for key, section in nav["navigation"].items():
        priority = section.get("priority", 99)
        status = "✅" if section.get("status") == "production_ready" else "⚠️"
        print(f"  {priority}. {status} {key.replace('_', ' ').title()}: {section['description']}")
    
    print("\n⚡ Quick Commands:")
    for cmd, action in nav["quick_commands"].items():
        print(f"  {cmd}: {action}")
    
    print("\n🎯 Single Sources of Truth:")
    for topic, file in nav["single_sources_of_truth"].items():
        print(f"  {topic}: {file}")
    
    print("\n📖 Common Workflows:")
    for workflow in nav["common_workflows"].keys():
        print(f"  {workflow.replace('_', ' ').title()}")

def show_section(section_name):
    """Show details for a specific section."""
    nav = load_navigation_index()
    
    if section_name not in nav["navigation"]:
        print(f"❌ Section '{section_name}' not found.")
        available = ", ".join(nav["navigation"].keys())
        print(f"Available sections: {available}")
        return
    
    section = nav["navigation"][section_name]
    print(f"📖 {section_name.replace('_', ' ').title()}")
    print("=" * 40)
    print(f"Description: {section['description']}")
    print(f"Status: {'✅ Production Ready' if section['status'] == 'production_ready' else '⚠️ In Progress'}")
    
    print("\n📄 Files:")
    for key, value in section.items():
        if key in ["description", "priority", "status"]:
            continue
        if isinstance(value, dict):
            print(f"  {key.replace('_', ' ').title()}:")
            for subkey, subvalue in value.items():
                print(f"    {subkey}: {subvalue}")
        else:
            print(f"  {key.replace('_', ' ').title()}: {value}")

def show_workflow(workflow_name):
    """Show files for a specific workflow."""
    nav = load_navigation_index()
    
    if workflow_name not in nav["common_workflows"]:
        print(f"❌ Workflow '{workflow_name}' not found.")
        available = ", ".join(nav["common_workflows"].keys())
        print(f"Available workflows: {available}")
        return
    
    files = nav["common_workflows"][workflow_name]
    print(f"🔄 {workflow_name.replace('_', ' ').title()} Workflow")
    print("=" * 40)
    
    for i, file in enumerate(files, 1):
        print(f"  {i}. {file}")

def open_file(file_path):
    """Open a documentation file in the default editor."""
    project_root = Path(__file__).parent.parent
    full_path = project_root / file_path
    
    if not full_path.exists():
        print(f"❌ File not found: {file_path}")
        return
    
    # Try to open with common editors
    editors = ["code", "subl", "atom", "vim", "nano"]
    for editor in editors:
        if os.system(f"which {editor} > /dev/null 2>&1") == 0:
            os.system(f"{editor} {full_path}")
            return
    
    # Fallback to cat
    os.system(f"cat {full_path}")

def main():
    parser = argparse.ArgumentParser(description="NeoForge Documentation Navigator")
    parser.add_argument("command", nargs="?", help="Command to execute")
    parser.add_argument("target", nargs="?", help="Target section or file")
    parser.add_argument("--open", "-o", action="store_true", help="Open file in editor")
    
    args = parser.parse_args()
    
    nav = load_navigation_index()
    
    if not args.command or args.command == "help":
        show_help()
        return
    
    if args.command == "section" and args.target:
        show_section(args.target)
    elif args.command == "workflow" and args.target:
        show_workflow(args.target)
    elif args.command == "open" and args.target:
        # Try to find the file in single sources of truth
        if args.target in nav["single_sources_of_truth"]:
            file_path = nav["single_sources_of_truth"][args.target]
            open_file(file_path)
        else:
            open_file(args.target)
    elif args.command == "status":
        metadata = nav["metadata"]
        print("📊 Project Documentation Status")
        print("=" * 40)
        print(f"Total docs: {metadata['total_docs']}")
        print(f"Broken links fixed: {metadata['broken_links_fixed']}")
        print(f"Duplicate files consolidated: {metadata['duplicate_files_consolidated']}")
        print(f"Last updated: {metadata['last_updated']}")
    else:
        print("❌ Invalid command. Use 'help' to see available options.")
        print("\nExamples:")
        print("  python scripts/nav.py section getting_started")
        print("  python scripts/nav.py workflow new_developer_onboarding")
        print("  python scripts/nav.py open system_architecture")
        print("  python scripts/nav.py status")

if __name__ == "__main__":
    main()