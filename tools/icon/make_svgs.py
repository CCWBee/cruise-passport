"""The Cocktail Passport's app icon: a cocktail glass drawn whole (both sides of the bowl, a stem,
a foot) as the night bar's lit line (--lamp #FFE2B8) with the coral in the bowl, on the night
room's navy with its coral and amber pools. Three variants on a 512 grid:

  small     public/icon.svg and the 32: a rounded navy tile, heavy line, no halo or pools (they are
            noise at 16 and 32)
  full      180, 192, 512: full bleed (iOS and Android round it themselves), pools and a halo
  maskable  512 maskable: full bleed, the glass scaled into the 40% radius safe circle
"""
import sys
from pathlib import Path

LAMP = '#FFE2B8'
CORAL = '#FF6B84'
NAVY0, NAVY1 = '#0B1222', '#130F1F'


def glass(cx, rim_y, half_w, apex_y, foot_y, foot_half, stroke, liquid_at=0.36, halo=False):
    """Rim from (cx-half_w, rim_y) to (cx+half_w, rim_y), both sides meeting at (cx, apex_y), the
    stem down to foot_y and the foot across it. The liquid fills the bowl below liquid_at of its
    depth, inset so the line stays clear of it."""
    lx, rx = cx - half_w, cx + half_w
    bowl = f'M{lx} {rim_y}H{rx}L{cx} {apex_y}Z'
    stem = f'M{cx} {apex_y}V{foot_y}'
    foot = f'M{cx - foot_half} {foot_y}H{cx + foot_half}'
    # the liquid: the bowl's triangle cut at liquid_at of its depth
    depth = apex_y - rim_y
    ly = rim_y + depth * liquid_at
    lhw = half_w * (apex_y - ly) / depth
    liquid = f'M{cx - lhw:.1f} {ly:.1f}H{cx + lhw:.1f}L{cx} {apex_y}Z'
    out = []
    out.append(f'<path d="{liquid}" fill="{CORAL}"/>')
    lines = f'<path d="{bowl}"/><path d="{stem}"/><path d="{foot}"/>'
    if halo:
        # the lamp's light round the line: a blurred copy, which reads as glow where a flat halo read
        # as a grey outline
        out.append(f'<g fill="none" stroke="{LAMP}" stroke-opacity=".55" stroke-width="{stroke * 1.6:.0f}" '
                   f'stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)">{lines}</g>')
    out.append(f'<g fill="none" stroke="{LAMP}" stroke-width="{stroke}" stroke-linecap="round" '
               f'stroke-linejoin="round">{lines}</g>')
    return '\n  '.join(out)


def room(rounded=False):
    rx = ' rx="104"' if rounded else ''
    return f'''<defs>
    <linearGradient id="room" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{NAVY0}"/>
      <stop offset="1" stop-color="{NAVY1}"/>
    </linearGradient>
    <radialGradient id="coral" cx="0" cy=".62" r=".62">
      <stop offset="0" stop-color="#FF4D6D" stop-opacity=".42"/>
      <stop offset="1" stop-color="#FF4D6D" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="amber" cx="1" cy=".3" r=".55">
      <stop offset="0" stop-color="#FF9F43" stop-opacity=".30"/>
      <stop offset="1" stop-color="#FF9F43" stop-opacity="0"/>
    </radialGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="14"/>
    </filter>
  </defs>
  <rect width="512" height="512"{rx} fill="url(#room)"/>
  <rect width="512" height="512"{rx} fill="url(#coral)"/>
  <rect width="512" height="512"{rx} fill="url(#amber)"/>'''


def svg(body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">\n  {body}\n</svg>\n'


def small():
    # a plain navy tile: pools are mud at 16px. The line is 52 on 512, 1.6px at 16
    tile = f'<rect width="512" height="512" rx="112" fill="{NAVY0}"/>'
    return svg(tile + '\n  ' + glass(256, 100, 168, 300, 412, 92, 52, liquid_at=0.30))


def full():
    return svg(room() + '\n  ' + glass(256, 122, 152, 292, 396, 84, 28, halo=True))


def maskable():
    # the safe zone is the circle of radius 204.8 about the centre; this glass reaches about 170
    s = 0.74
    g = glass(256, 122, 152, 292, 396, 84, 28 / s, halo=True)
    return svg(room() + f'\n  <g transform="translate(256 259) scale({s}) translate(-256 -259)">\n  {g}\n  </g>')


if __name__ == '__main__':
    out = Path(sys.argv[1])
    out.mkdir(parents=True, exist_ok=True)
    for name, fn in (('small', small), ('full', full), ('maskable', maskable)):
        (out / f'{name}.svg').write_text(fn(), encoding='utf-8', newline='\n')
    print('written', out)
