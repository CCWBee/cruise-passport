import sys
from pathlib import Path
from PIL import Image, ImageDraw

d = Path(sys.argv[1])
out = Path(sys.argv[2])
W = 1400
sheet = Image.new('RGBA', (W, 1180), (40, 40, 44, 255))
dr = ImageDraw.Draw(sheet)

x = 20
# the favicon at true size on a light and a dark tab strip, then blown up with nearest
for bg in ((240, 240, 240), (32, 33, 36)):
    strip = Image.new('RGBA', (200, 60), bg + (255,))
    for i, n in enumerate(('icon-16.png', 'icon-32.png')):
        im = Image.open(d / n).convert('RGBA')
        strip.alpha_composite(im, (14 + i * 60, 30 - im.height // 2))
    sheet.alpha_composite(strip, (x, 20)); x += 220
for n, k in (('icon-16.png', 12), ('icon-32.png', 7)):
    im = Image.open(d / n).convert('RGBA').resize((16 * 12 if n == 'icon-16.png' else 32 * 7,) * 2, Image.NEAREST)
    sheet.alpha_composite(im, (x, 20)); x += im.width + 20

y = 280
x = 20
# 180 as iOS shows it: rounded, and at the home screen's 60pt at 3x
for n in ('icon-180.png', 'icon-192.png'):
    im = Image.open(d / n).convert('RGBA')
    m = Image.new('L', im.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, im.width - 1, im.height - 1), radius=int(im.width * 0.225), fill=255)
    im.putalpha(m)
    sheet.alpha_composite(im, (x, y)); x += im.width + 20
# 512 full, then the maskable with its safe circle and as a circle crop
for n in ('icon-512.png',):
    im = Image.open(d / n).convert('RGBA').resize((360, 360), Image.LANCZOS)
    sheet.alpha_composite(im, (x, y)); x += 380
mk = Image.open(d / 'icon-maskable-512.png').convert('RGBA')
ov = mk.copy()
ImageDraw.Draw(ov).ellipse((256 - 204.8, 256 - 204.8, 256 + 204.8, 256 + 204.8), outline=(0, 255, 0, 255), width=2)
sheet.alpha_composite(ov.resize((360, 360), Image.LANCZOS), (x, y))
circ = mk.copy()
m = Image.new('L', mk.size, 0)
ImageDraw.Draw(m).ellipse((256 - 204.8, 256 - 204.8, 256 + 204.8, 256 + 204.8), fill=255)
circ.putalpha(m)
sheet.alpha_composite(circ.resize((220, 220), Image.LANCZOS), (20, 700))
# small at 512 for the drawing itself
sheet.alpha_composite(Image.open(d / 'small-512.png').convert('RGBA').resize((360, 360), Image.LANCZOS), (260, 700))
sheet.convert('RGB').save(out)
print(out)
