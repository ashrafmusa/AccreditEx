#!/usr/bin/env python3
import sys
import os
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

# Setup Path
ROOT_DIR = Path(__file__).parent.parent.resolve()
OUTPUT_DIR = ROOT_DIR / ".Agentica" / "logs" / "visuals"

def capture_screenshot(url, filename="screenshot.png"):
    """
    Captures a screenshot of the given URL and saves it to the visuals log.
    Returns the absolute path to the screenshot.
    """
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    file_path = OUTPUT_DIR / filename

    with sync_playwright() as p:
        # Launch browser (chromium)
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            print(f"[*] Navigating to {url}...")
            page.goto(url, wait_until="networkidle", timeout=30000)

            # Wait a bit for static assets
            time.sleep(1)

            page.screenshot(path=str(file_path), full_page=True)
            print(f"[+] Screenshot saved to {file_path}")
            return str(file_path)

        except Exception as e:
            print(f"[-] Failed to capture screenshot: {str(e)}")
            return None
        finally:
            browser.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python capture_ui.py <url> [filename]")
        sys.exit(1)

    target_url = sys.argv[1]
    name = sys.argv[2] if len(sys.argv) > 2 else f"capture_{int(time.time())}.png"

    capture_screenshot(target_url, name)
