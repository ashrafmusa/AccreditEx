#!/usr/bin/env python3
import argparse
import json
import os
import shutil
import sys
import datetime
from pathlib import Path

# Paths
ROOT_DIR = Path(__file__).parent.parent.resolve()
REGISTRY_FILE = ROOT_DIR / ".Agentica" / "registry.json"
AGENTS_DIR = ROOT_DIR / "agents"
SKILLS_DIR = ROOT_DIR / "skills"

# Mock Remote (to be replaced with real URL)
REMOTE_MANIFEST_URL = "https://raw.githubusercontent.com/ashrafmusa/agenticana/main/exchange/manifest.json"

def init_registry():
    """Ensure registry exists."""
    if not REGISTRY_FILE.exists():
        REGISTRY_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(REGISTRY_FILE, "w") as f:
            json.dump({
                "installed": {},
                "last_sync": None,
                "config": {
                    "sources": [REMOTE_MANIFEST_URL],
                    "auto_update": False
                }
            }, f, indent=2)

def load_registry():
    init_registry()
    with open(REGISTRY_FILE, "r") as f:
        return json.load(f)

def save_registry(data):
    with open(REGISTRY_FILE, "w") as f:
        json.dump(data, f, indent=2)

def list_installed():
    reg = load_registry()
    print("\n--- Installed Agentica Components ---")
    if not reg["installed"]:
        print("No external components installed.")
    else:
        for slug, info in reg["installed"].items():
            print(f"- {slug} (version: {info['version']}, source: {info['source']})")
    print("-" * 38 + "\n")

def info(slug):
    reg = load_registry()
    item = reg["installed"].get(slug)
    if not item:
        print(f"Error: {slug} is not installed.")
        return
    print(f"\n--- {slug} Info ---")
    for k, v in item.items():
        print(f"{k.capitalize()}: {v}")
    print("-" * 20 + "\n")

import urllib.request
import urllib.error
import datetime

def sync():
    """Sync remote manifest."""
    reg = load_registry()
    url = reg["config"]["sources"][0]
    print(f"[*] Syncing with {url}...")
    try:
        # User-Agent header for GitHub API/Raw
        req = urllib.request.Request(url, headers={'User-Agent': 'Agentica-Exchange'})
        with urllib.request.urlopen(req, timeout=10) as response:
            manifest = json.loads(response.read().decode())
            reg["available"] = manifest.get("components", {})
            reg["last_sync"] = datetime.datetime.now().isoformat()
            save_registry(reg)
            print("[+] Sync complete.")
    except Exception as e:
        print(f"[-] Sync failed: {str(e)}")

def install(slug, force=False):
    """Install or update component."""
    reg = load_registry()
    available = reg.get("available", {})
    if slug not in available:
        print(f"Error: {slug} not found in registry. Run 'sync' first.")
        return

    comp = available[slug]
    target_path = ROOT_DIR / comp["path"]

    if target_path.exists() and not force:
        print(f"[!] {slug} already exists at {comp['path']}. Use --force to overwrite.")
        return

    print(f"[*] Downloading {slug} from {comp['url']}...")
    try:
        req = urllib.request.Request(comp["url"], headers={'User-Agent': 'Agentica-Exchange'})
        with urllib.request.urlopen(req, timeout=15) as response:
            content = response.read().decode('utf-8')
            target_path.parent.mkdir(parents=True, exist_ok=True)
            with open(target_path, "w", encoding="utf-8") as f:
                f.write(content)

            reg["installed"][slug] = {
                "version": comp.get("version", "1.0.0"),
                "source": comp["url"],
                "installed_at": datetime.datetime.now().isoformat(),
                "type": comp.get("type", "unknown")
            }
            save_registry(reg)
            print(f"[+] Successfully installed {slug}!")
    except Exception as e:
        print(f"[-] Installation failed: {str(e)}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Agentica Exchange CLI")
    subparsers = parser.add_subparsers(dest="command")

    # List
    subparsers.add_parser("list", help="List installed components")

    # Sync
    subparsers.add_parser("sync", help="Sync with remote registry")

    # Install
    install_p = subparsers.add_parser("install", help="Install a component")
    install_p.add_argument("slug", help="Component slug to install")
    install_p.add_argument("--force", action="store_true", help="Force overwrite")

    # Info
    info_p = subparsers.add_parser("info", help="Get info on an installed component")
    info_p.add_argument("slug", help="Component slug")

    args = parser.parse_args()

    if args.command == "list":
        list_installed()
    elif args.command == "sync":
        sync()
    elif args.command == "install":
        install(args.slug, args.force)
    elif args.command == "info":
        info(args.slug)
    else:
        parser.print_help()
