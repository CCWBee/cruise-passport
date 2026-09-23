# Contact sheets for a sweep: each state's hours side by side (day, evening, night), labelled, so a
# reviewer reads one picture per state instead of three. Pillow only.
#
#   python tools/qa/contact.py tools/qa/sweeps/<stamp>
#
# Writes <stamp>/contact/<state>.png, and <stamp>/contact/narrow.png for the 320-wide shots.
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

run = Path(sys.argv[1])
manifest = json.loads((run / 'manifest.json').read_text(encoding='utf-8'))
out = run / 'contact'
out.mkdir(exist_ok=True)
ROOM = {13: 'day 13', 19: 'evening 19', 23: 'night 23'}


def sheet(items, name):
    shots = [(m, Image.open(m['file']).convert('RGB')) for m in items if m.get('file') and Path(m['file']).exists()]
    if not shots:
        return
    gap, head = 12, 28
    w = sum(im.width for _, im in shots) + gap * (len(shots) + 1)
    h = max(im.height for _, im in shots) + head + gap
    canvas = Image.new('RGB', (w, h), (110, 110, 110))
    draw = ImageDraw.Draw(canvas)
    x = gap
    for m, im in shots:
        note = f"{m['label']}  sw {m.get('sw')}/{m.get('w')}  glass {m.get('glass')}" + ('  FAULT' if m.get('fault') else '')
        draw.text((x, 8), note, fill=(255, 255, 255))
        canvas.paste(im, (x, head))
        x += im.width + gap
    canvas.save(out / f'{name}.png')


states = []
for m in manifest:
    if m['state'] not in states:
        states.append(m['state'])
for s in states:
    wide = [m for m in manifest if m['state'] == s and '-320-' not in m['label']]
    sheet(sorted(wide, key=lambda m: m['hour']), s)
narrow = [m for m in manifest if '-320-' in m['label']]
sheet(sorted(narrow, key=lambda m: (m['hour'], m['state'])), 'narrow')
failed = [m['label'] + ': ' + m['error'] for m in manifest if m.get('error')]
print(f'{len(states)} states, contact sheets in {out}')
if failed:
    print('failed:', *failed, sep='\n  ')
