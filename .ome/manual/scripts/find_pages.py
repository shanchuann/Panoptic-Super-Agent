"""Locate manual headings in the first print pass and write the table of contents."""
from pathlib import Path
import pymupdf, json, sys
sys.stdout.reconfigure(encoding='utf-8')
manual_dir = Path(__file__).resolve().parents[1]
doc = pymupdf.open(manual_dir / 'print' / 'manual-pass1.pdf')
titles = [line[3:].strip() for line in (manual_dir / 'manual.md').read_text(encoding='utf-8').splitlines() if line.startswith('## ')]
res = []
for t in titles:
    found = 0
    for i in range(2, len(doc)):
        if doc[i].search_for(t):
            found = i + 1
            break
    res.append(found)
print(json.dumps({"pages": len(doc), "toc": res}, ensure_ascii=False))
(manual_dir / 'print' / 'pages.json').write_text(json.dumps(res) + '\n', encoding='utf-8')
