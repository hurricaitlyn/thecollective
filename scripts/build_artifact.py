"""Bundle GttDrop into one self-contained page for publishing as a claude.ai artifact.

Usage: python3 scripts/build_artifact.py [out_dir]
Writes <out_dir>/gttdrop.html (no doctype/html/head/body: the artifact host adds them)
and copies downloads/*.pdf beside it.
"""
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
out = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "dist"
out.mkdir(parents=True, exist_ok=True)

html = (ROOT / "index.html").read_text()
body = re.search(r"<body>(.*)</body>", html, re.S).group(1)
body = re.sub(r'\s*<script src="[^"]+"></script>', "", body)
css = (ROOT / "css/styles.css").read_text()
js = "\n".join((ROOT / f).read_text() for f in
               ["js/data/atlas.js", "js/data/drops.js", "js/data/content.js", "js/app.js"])

page = f"""<title>GttDrop</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="Timed ICU clinical drops, a searchable atlas, and a dated evidence shelf.">
<style>
{css}
</style>
{body.strip()}
<script>
{js}
</script>
"""
(out / "gttdrop.html").write_text(page)
(out / "downloads").mkdir(exist_ok=True)
for pdf in (ROOT / "downloads").glob("*.pdf"):
    shutil.copy(pdf, out / "downloads" / pdf.name)
print("Wrote", out / "gttdrop.html")
