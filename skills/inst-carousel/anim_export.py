#!/usr/bin/env python3
"""Export an animated Telegram card from inst-carousel HTML.

Contract: src/index.html must expose window.setT(t), t ∈ [0,1] driving all
animation state deterministically. This exporter samples FRAMES screenshots
into tmp, then assembles a silent looping MP4 (the "GIF" of Telegram) plus
an optional true GIF fallback.

Usage:
    python3 skills/inst-carousel/anim_export.py output/inst-carousel/<date-slug> \
        [--seconds 4 --fps 24]
Produces in the run root: anim.mp4 (deliverable for sendAnimation), anim.gif.
"""

from __future__ import annotations

import argparse
import subprocess
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

SIZE = 1080


def export_anim(run_dir: Path, seconds: float, fps: int) -> list[Path]:
    src = run_dir / "src" / "index.html"
    if not src.is_file():
        raise FileNotFoundError(f"Missing {src}")

    frames_total = int(seconds * fps)
    written: list[Path] = []
    with tempfile.TemporaryDirectory() as td:
        td_path = Path(td)
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={"width": SIZE, "height": SIZE}, device_scale_factor=1)
            page.goto(src.resolve().as_uri())
            page.wait_for_timeout(300)
            for i in range(frames_total):
                t = i / frames_total
                page.evaluate(f"window.setT({t})")
                frame = td_path / f"f{i:04d}.png"
                page.screenshot(path=str(frame))
                written.append(frame)
            browser.close()

        silent_mp4 = run_dir / "anim.mp4"
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error",
                "-framerate", str(fps), "-i", str(td_path / "f%04d.png"),
                "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "23",
                "-movflags", "+faststart", "-an",
                str(silent_mp4),
            ],
            check=True,
        )
        written.append(silent_mp4)

        palette = td_path / "palette.png"
        gif_path = run_dir / "anim.gif"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(fps),
                        "-i", str(td_path / "f%04d.png"), "-vf", "palettegen", str(palette)], check=True)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(fps),
                        "-i", str(td_path / "f%04d.png"), "-i", str(palette),
                        "-lavfi", "paletteuse", str(gif_path)], check=True)
        written.append(gif_path)

    return written


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("run_dir", type=Path)
    parser.add_argument("--seconds", type=float, default=4.0)
    parser.add_argument("--fps", type=int, default=24)
    args = parser.parse_args()

    outputs = export_anim(args.run_dir, args.seconds, args.fps)
    for item in outputs:
        print(item)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
