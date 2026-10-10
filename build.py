"""Assemble the static pages from src/pages + src/partials.

Each page in src/pages starts with front-matter lines:
    title: ...
    description: ...
    ---
Run:  python3 build.py
"""
from pathlib import Path

ROOT = Path(__file__).parent
head = (ROOT / "src/partials/head.html").read_text(encoding="utf-8")
foot = (ROOT / "src/partials/foot.html").read_text(encoding="utf-8")

for src in sorted((ROOT / "src/pages").glob("*.html")):
    meta_block, body = src.read_text(encoding="utf-8").split("\n---\n", 1)
    meta = dict(line.split(": ", 1) for line in meta_block.strip().splitlines())
    page = src.stem
    top = head.replace("{{title}}", meta["title"]).replace("{{description}}", meta["description"]).replace("{{page}}", page)
    out = top + body.rstrip() + "\n" + foot
    (ROOT / f"{page}.html").write_text(out, encoding="utf-8")
    print("built", f"{page}.html")
