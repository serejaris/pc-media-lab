#!/usr/bin/env python3
"""Export inst-carousel HTML slides to postable PNG files.

Usage:
  python3 skills/inst-carousel/export.py output/inst-carousel/<date-slug>

Writes slide-01.png … into the run root (next to src/).
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

SLIDE_SIZE = 1080


def export_run(run_dir: Path) -> list[Path]:
    src = run_dir / "src" / "index.html"
    if not src.is_file():
        raise FileNotFoundError(f"Missing {src}")

    run_dir.mkdir(parents=True, exist_ok=True)
    file_url = src.resolve().as_uri()
    written: list[Path] = []

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(
            viewport={"width": SLIDE_SIZE, "height": SLIDE_SIZE},
            device_scale_factor=1,
        )
        page.goto(file_url, wait_until="networkidle")
        page.evaluate(
            """() => document.fonts && document.fonts.ready
                ? document.fonts.ready
                : Promise.resolve()"""
        )

        slides = page.locator(".slide")
        count = slides.count()
        if count == 0:
            browser.close()
            raise RuntimeError("No .slide elements found in index.html")

        # Hide all, then show one-by-one for clean capture
        page.evaluate(
            """() => {
              document.body.style.margin = '0';
              document.body.style.background = '#000';
              document.querySelectorAll('.slide').forEach((el) => {
                el.style.display = 'none';
              });
            }"""
        )

        for i in range(count):
            page.evaluate(
                """(idx) => {
                  document.querySelectorAll('.slide').forEach((el, j) => {
                    el.style.display = j === idx ? 'flex' : 'none';
                    el.classList.toggle('active', j === idx);
                  });
                }""",
                i,
            )
            page.wait_for_timeout(100)
            out = run_dir / f"slide-{i + 1:02d}.png"
            slides.nth(i).screenshot(path=str(out), type="png")
            written.append(out)
            print(f"wrote {out}")

        browser.close()

    return written


def main() -> int:
    parser = argparse.ArgumentParser(description="Export carousel slides to PNG")
    parser.add_argument(
        "run_dir",
        type=Path,
        help="Run folder, e.g. output/inst-carousel/2026-08-11-media-department",
    )
    args = parser.parse_args()
    run_dir = args.run_dir.resolve()
    try:
        files = export_run(run_dir)
    except Exception as exc:  # noqa: BLE001 — CLI surface
        print(f"export failed: {exc}", file=sys.stderr)
        return 1
    print(f"done: {len(files)} slides → {run_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
