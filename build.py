"""Assemble the static pages from src/pages + src/partials.

Each page in src/pages starts with front-matter lines:
    title: ...
    description: ...
    ---
Run:  python3 build.py
"""
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).parent
# Public address of the site — switch to "https://iran-truck.com/" once the domain points here.
SITE = "https://reallmatinhosseini-ux.github.io/irantruck/"
head = (ROOT / "src/partials/head.html").read_text(encoding="utf-8")
foot = (ROOT / "src/partials/foot.html").read_text(encoding="utf-8")

for src in sorted((ROOT / "src/pages").glob("*.html")):
    meta_block, body = src.read_text(encoding="utf-8").split("\n---\n", 1)
    meta = dict(line.split(": ", 1) for line in meta_block.strip().splitlines())
    page = src.stem
    top = head.replace("{{title}}", meta["title"]).replace("{{description}}", meta["description"]).replace("{{page}}", page).replace("{{site}}", SITE).replace("{{path}}", "" if page == "index" else f"{page}.html")
    if page == "404":
        # served from any missing URL, so anchor relative links at the site root; keep it out of search
        base = urlparse(SITE).path or "/"
        top = top.replace('<meta charset="utf-8">', f'<meta charset="utf-8">\n  <base href="{base}">\n  <meta name="robots" content="noindex">', 1)
    out = top + body.rstrip() + "\n" + foot
    (ROOT / f"{page}.html").write_text(out, encoding="utf-8")
    print("built", f"{page}.html")

# sitemap for search engines
pages = sorted(p.stem for p in (ROOT / "src/pages").glob("*.html") if p.stem != "404")
urls = "".join(f"  <url><loc>{SITE}{'' if p == 'index' else p + '.html'}</loc></url>\n" for p in ["index"] + [p for p in pages if p != "index"])
(ROOT / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n', encoding="utf-8")
(ROOT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {SITE}sitemap.xml\n", encoding="utf-8")
print("built sitemap.xml, robots.txt")
