"""Add page numbers to the second print pass and save the final manual PDF."""
from pathlib import Path
import pymupdf, sys
sys.stdout.reconfigure(encoding='utf-8')
manual_dir = Path(__file__).resolve().parents[1]
src = manual_dir / 'print' / 'manual-pass2.pdf'
out = manual_dir / 'manual.pdf'
doc = pymupdf.open(src)
total = len(doc)
for i, page in enumerate(doc):
    if i == 0: continue
    w = page.rect.width; h = page.rect.height
    page.draw_line(pymupdf.Point(54, h-38), pymupdf.Point(w-54, h-38), color=(0.82,0.85,0.89), width=0.6)
    text = f'万象超级智能体设计说明书    第 {i+1} 页 / 共 {total} 页'
    tw = pymupdf.get_text_length(text, fontname='china-s', fontsize=8.5)
    page.insert_text(pymupdf.Point((w-tw)/2, h-24), text, fontsize=8.5, fontname='china-s', color=(0.45,0.50,0.56))
doc.set_metadata({'title':'万象超级智能体设计说明书','author':'Panoptic Super 项目组','subject':'项目设计说明书','creator':'Chrome print'})
doc.save(out, garbage=3, deflate=True)
doc.close()
print('pages', total)
