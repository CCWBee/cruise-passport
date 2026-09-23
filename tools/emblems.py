"""Generate the medal emblems for src/features/badges/emblems-data.ts.

Every emblem is drawn in place on the coin's 100 box, centred on the field (50, 50, r 41), as one
filled path (evenodd, holes as inner rings). Glasses are Icon.tsx's paths, stroked and filled here.
Each medal's face says what it rewards at 44px (docs/DESIGN.md, Material, The medals): the count
medals carry their number, the drink medals the drink's own glass.

    python tools/emblems.py            write the paths into src/features/badges/emblems-data.ts
    python tools/emblems.py out.json   write them to a JSON file instead, and change nothing

Either way it prints each emblem's bounding box and its reach from the centre, which must stay
inside the field's r 41. Needs Python with shapely, svgpathtools and numpy. Redraw an emblem here and
regenerate; never edit the paths by hand.
"""
import math, re, sys, json
from pathlib import Path
import numpy as np
from shapely.geometry import Polygon, MultiPolygon, LineString, Point, box
from shapely.ops import unary_union
from shapely import affinity
from svgpathtools import parse_path

RES = 48  # curve samples per segment


def subpaths(d):
    """svg path d -> list of (points, closed)."""
    p = parse_path(d)
    out = []
    for sp in p.continuous_subpaths():
        pts = []
        for seg in sp:
            n = RES if type(seg).__name__ != 'Line' else 1
            for i in range(n):
                z = seg.point(i / n)
                pts.append((z.real, z.imag))
        z = sp[-1].end
        pts.append((z.real, z.imag))
        closed = sp.isclosed()
        out.append((pts, closed))
    return out


def icon(d, S, ox=0.0, oy=0.0, cx=12.0, cy=12.0):
    """icon-grid path -> coin coords: (x - cx) * S + 50 + ox"""
    res = []
    for pts, closed in subpaths(d):
        res.append(([((x - cx) * S + 50 + ox, (y - cy) * S + 50 + oy) for x, y in pts], closed))
    return res


def stroke(parts, w, cap='round', join='round'):
    geoms = []
    for pts, closed in parts:
        if closed:
            geoms.append(Polygon(pts).exterior.buffer(w / 2, cap_style=cap, join_style=join))
        else:
            geoms.append(LineString(pts).buffer(w / 2, cap_style=cap, join_style=join, mitre_limit=3))
    return unary_union(geoms)


def fill(parts):
    return unary_union([Polygon(pts).buffer(0) for pts, closed in parts if len(pts) > 2])


def line(pts, w, cap='round', join='round'):
    return LineString(pts).buffer(w / 2, cap_style=cap, join_style=join, mitre_limit=4)


def arc(cx, cy, rx, ry, t0, t1, n=64):
    """points on an ellipse, t in degrees, maths convention (y up), drawn in y-down space"""
    return [(cx + rx * math.cos(math.radians(t)), cy - ry * math.sin(math.radians(t)))
            for t in np.linspace(t0, t1, n)]


def ellipse(cx, cy, rx, ry):
    return affinity.scale(Point(cx, cy).buffer(1, resolution=64), rx, ry)


# ── numerals: monoline, flat terminals, a medal's struck figure ────────────────────────────────
def digit(ch, x, top, H, w):
    """one figure with its left edge at x; returns (geometry, advance width)"""
    bot = top + H
    if ch == '0':
        W = 0.64 * H
        cx, cy = x + W / 2, top + H / 2
        g = ellipse(cx, cy, W / 2, H / 2).difference(ellipse(cx, cy, W / 2 - w * 1.08, H / 2 - w * 0.9))
        return g, W
    if ch == '1':
        W = 0.5 * H
        sx = x + W * 0.56  # the stem's centre
        stem = box(sx - w / 2, top, sx + w / 2, bot)
        flag = Polygon([(sx - w / 2 + 0.2, top), (sx + w / 2, top), (sx - w / 2 - 0.30 * H, top + 0.30 * H),
                        (sx - w / 2 - 0.30 * H, top + 0.30 * H - w * 1.05)])
        foot = box(x, bot - w * 0.8, x + W, bot)
        return unary_union([stem, flag, foot]), W
    if ch == '2':
        W = 0.64 * H
        r = W / 2 - w / 2
        cx, cy = x + W / 2, top + w / 2 + r
        pts = arc(cx, cy, r, r * 1.02, 168, -38, 64)
        pts.append((x + w / 2, bot - w / 2))
        pts.append((x + W, bot - w / 2))
        return line(pts, w, cap='flat', join='mitre'), W
    if ch == '5':
        W = 0.66 * H
        rx = W / 2 - w / 2
        ry = 0.27 * H
        bcx, bcy = x + W / 2 + 0.01 * H, bot - w / 2 - ry
        t_join = 152
        jx, jy = bcx + rx * math.cos(math.radians(t_join)), bcy - ry * math.sin(math.radians(t_join))
        top_bar = [(x + W - 0.03 * H, top + w / 2), (x + w / 2 + 0.03 * H, top + w / 2)]
        # the bar and the upright meet square; the bowl leaves the upright on a round join, since a
        # mitre at that angle spikes down into the bowl's terminal and closes the figure
        upright = line(top_bar + [(jx, jy + 0.6)], w, cap='flat', join='mitre')
        bowl = line([(jx, jy + 0.6)] + arc(bcx, bcy, rx, ry, t_join, -140, 72), w, cap='flat', join='round')
        return upright.union(bowl), W
    raise ValueError(ch)


def numeral(text, H, w, gap):
    geoms, x = [], 0.0
    for i, ch in enumerate(text):
        g, W = digit(ch, x, 0, H, w)
        geoms.append(g)
        x += W + (gap if i < len(text) - 1 else 0)
    g = unary_union(geoms)
    minx, miny, maxx, maxy = g.bounds
    return affinity.translate(g, 50 - (minx + maxx) / 2, 50 - (miny + maxy) / 2)


# ── the glasses, from src/ui/Icon.tsx ─────────────────────────────────────────────────────────────
IW = 2.05  # the icon's 1.8 stroke, a touch heavier so the relief holds at 44px


def glass(bowl, rest, S, ox=0, oy=0, extra=None):
    b = icon(bowl, S, ox, oy)
    g = unary_union([fill(b), stroke(b, IW * S)])
    for d in rest:
        g = g.union(stroke(icon(d, S, ox, oy), IW * S))
    return g


def centre(g, dy=0.0):
    minx, miny, maxx, maxy = g.bounds
    return affinity.translate(g, 50 - (minx + maxx) / 2, 50 - (miny + maxy) / 2 + dy)


def build():
    E = {}
    # count medals: the number struck on the coin
    E['first'] = numeral('1', 44, 8.6, 0)
    E['ten'] = numeral('10', 38, 7.6, 3.6)
    E['twentyfive'] = numeral('25', 38, 7.6, 3.6)
    E['fifty'] = numeral('50', 38, 7.6, 3.6)
    E['hundred'] = numeral('100', 30, 6.4, 2.8)
    E['onefifty'] = numeral('150', 30, 6.4, 2.8)
    E['twohundred'] = numeral('200', 30, 6.4, 2.8)

    S = 3.0
    # Martini Club: the cocktail glass, with an olive on its pick cut into the bowl
    g = glass('M4.5 5.5h15L12 13.5z', ['M12 13.5v6M8.5 19.5h7'], S)
    g = g.difference(Point(47, 38.5).buffer(4.3)).difference(line([(51, 34), (58, 26)], 1.8))
    g = g.union(line([(55.5, 28.8), (60.5, 23)], 2.4))
    E['martini'] = centre(g)

    # Margarita Queen: the margarita glass and its lime on the rim, held apart by a cut
    bowl = 'M3.5 7h15c0 3-2.8 4.3-5.2 4.6 0 2.9-1 4.2-2.3 4.2s-2.3-1.3-2.3-4.2C6.3 11.3 3.5 10 3.5 7z'
    g = glass(bowl, ['M11 15.8v3.7M7.8 19.5h6.4'], S)
    lime = icon('M15.5 7a3 3 0 0 1 6 0z', S)
    lp = unary_union([fill(lime), stroke(lime, IW * S)])
    # the lime's rind, cut just inside its edge, so the wedge reads as a slice of citrus
    lcx, lcy = (18.5 - 12) * S + 50, (7 - 12) * S + 50
    rind = LineString(arc(lcx, lcy, 7.4, 7.4, 180, 0, 48)).buffer(0.7, cap_style='flat')
    g = g.difference(lp.buffer(1.7)).union(lp.difference(rind))
    E['margarita'] = centre(g)

    # Wine Connoisseur: the wine glass
    wb = icon('M8 4.5c-1.8 3.5-2 7 .4 8.7 1.8 1.2 5.4 1.2 7.2 0 2.4-1.7 2.2-5.2.4-8.7z', S)
    g = stroke(wb, IW * S).union(fill(wb).intersection(box(0, (9.6 - 12) * S + 50, 100, 100)))
    g = g.union(stroke(icon('M12 14.1v5.4M8.5 19.5h7', S), IW * S))
    E['wine'] = centre(g)

    # Whiskey Lover: the rocks glass, whisky in its lower part and a cube of ice riding in it
    rd = 'M5.5 8.5h13l-.9 10.3a1.5 1.5 0 0 1-1.5 1.4H7.9a1.5 1.5 0 0 1-1.5-1.4z'
    rocks = icon(rd, S)
    wall = stroke(rocks, IW * S)
    inner = fill(rocks)
    level = (13.2 - 12) * S + 50
    g = wall.union(inner.intersection(box(0, level, 100, 100)))
    # a heavy base, as a tumbler has
    g = g.union(inner.intersection(box(0, (17.6 - 12) * S + 50, 100, 100)))
    cube = affinity.rotate(box(-5.6, -5.6, 5.6, 5.6), -14, origin=(0, 0))
    cube = affinity.translate(cube, 52, level + 0.4).buffer(1.1, join_style='round')
    g = g.difference(cube.buffer(1.5)).union(cube)
    E['whiskey'] = centre(g)

    # Coffee Expert: the cup on its saucer, steaming
    cup = icon('M5.5 9.5H16V14a4.5 4.5 0 0 1-4.5 4.5H10A4.5 4.5 0 0 1 5.5 14z', S)
    g = unary_union([fill(cup), stroke(cup, IW * S)])
    g = g.union(stroke(icon('M16 11h1.2a2.2 2.2 0 0 1 0 4.4H16M4 20.5h14.5', S), IW * S))
    g = g.union(stroke(icon('M9 4.8c-.8 1 .8 1.8 0 2.8M12.5 4.8c-.8 1 .8 1.8 0 2.8', S), IW * S))
    E['coffee'] = centre(g)

    # Cocktail Master: the app's shaker, its parts parted by cuts
    parts = ['M10.2 2.8h3.6v2.4h-3.6z', 'M10.2 5.2C8.2 5.9 7.3 7.7 7.2 9.8h9.6c-.1-2.1-1-3.9-3-4.6z',
             'M6.4 9.8h11.2v2H6.4z', 'M7.1 11.8l1 8.3a1.3 1.3 0 0 0 1.3 1.1h5.2a1.3 1.3 0 0 0 1.3-1.1l1-8.3z']
    S2 = 2.75
    g = unary_union([unary_union([fill(icon(d, S2)), stroke(icon(d, S2), IW * S2 * 0.8)]) for d in parts])
    for y in (5.2, 9.8, 11.8):
        yy = (y - 12) * S2 + 50
        g = g.difference(line([(20, yy), (80, yy)], 1.5, cap='flat'))
    E['master'] = centre(g)

    # Brain Freeze: a snowflake, six arms, each with one pair of branches
    arms = []
    R, w = 27, 5.2
    for k in range(6):
        a = math.radians(90 + 60 * k)
        ux, uy = math.cos(a), -math.sin(a)
        arms.append(line([(50, 50), (50 + R * ux, 50 + R * uy)], w))
        for side in (-1, 1):
            b = a + side * math.radians(48)
            bx, by = 50 + 0.52 * R * ux, 50 + 0.52 * R * uy
            L = 0.36 * R
            arms.append(line([(bx, by), (bx + L * math.cos(b), by - L * math.sin(b))], w * 0.85))
    g = unary_union(arms).union(Point(50, 50).buffer(6.5))
    E['frozen'] = g

    # Gin Explorer: a juniper sprig, needles in pairs and the berries at its head
    stem = [(50 + 2 * math.sin(t / 10), 82 - t) for t in np.linspace(0, 52, 40)]
    stem = [(50 + 3 * math.sin((82 - y) / 18) - 1.5, y) for y in np.linspace(82, 36, 40)]
    g = line(stem, 3.4)
    for i, y in enumerate((74, 65, 56, 47)):
        sx = 50 + 3 * math.sin((82 - y) / 18) - 1.5
        L = 15 - i * 1.6
        for side in (-1, 1):
            tip = (sx + side * L * 0.92, y - L * 0.55)
            leaf = Polygon([(sx, y + 1.2), (sx + side * L * 0.45, y - L * 0.22 - 2.1), tip,
                            (sx + side * L * 0.55, y - L * 0.25 + 1.4)])
            g = g.union(leaf.buffer(0.9))
    stem_top = line([(50 + 3 * math.sin(46 / 18) - 1.5, 36), (50 + 3 * math.sin(46 / 18) - 1.5 + 0.5, 22)], 3.4)
    g = g.union(stem_top)
    for i, y in enumerate((39, 31)):
        sx = 50 + 3 * math.sin((82 - 36) / 18) - 1.5
        L = 9.5 - i * 2
        for side in (-1, 1):
            tip = (sx + side * L * 0.92, y - L * 0.55)
            leaf = Polygon([(sx, y + 1.2), (sx + side * L * 0.45, y - L * 0.22 - 2.1), tip,
                            (sx + side * L * 0.55, y - L * 0.25 + 1.4)])
            g = g.union(leaf.buffer(0.9))
    for bx, by, r in ((66, 55, 5.6), (34, 64, 5.6), (65.5, 70, 5.2)):
        g = g.union(Point(bx, by).buffer(r))
    E['gin'] = centre(g)

    # Rum Captain: the ship's wheel
    parts = [Point(50, 50).buffer(22.5).difference(Point(50, 50).buffer(17)), Point(50, 50).buffer(6.4)]
    for k in range(8):
        a = math.radians(22.5 + 45 * k)
        parts.append(line([(50 + 5 * math.cos(a), 50 + 5 * math.sin(a)), (50 + 29 * math.cos(a), 50 + 29 * math.sin(a))], 3.6))
        parts.append(Point(50 + 30.5 * math.cos(a), 50 + 30.5 * math.sin(a)).buffer(3.9))
    g = unary_union(parts).difference(Point(50, 50).buffer(2.2))
    E['rum'] = g

    # Every Bar: the map pin, on the spot it marks
    pin = icon('M19 10.1c0 5-7 10-7 10s-7-5-7-10a7 7 0 1 1 14 0z', 3.3)
    g = unary_union([fill(pin), stroke(pin, 1.2)])
    hole_c = ((12 - 12) * 3.3 + 50, (10 - 12) * 3.3 + 50)
    g = g.difference(Point(*hole_c).buffer(7.6))
    spot = ellipse(50, (20.1 - 12) * 3.3 + 50 + 1.5, 15, 3.6).difference(ellipse(50, (20.1 - 12) * 3.3 + 50 + 1.5, 10.5, 1.4))
    g = g.difference(ellipse(50, (20.1 - 12) * 3.3 + 50 + 1.5, 17, 5.2)).union(spot)
    E['everybar'] = centre(g)

    # Champion: a laurel round the liner
    ship = ('M6 33 H144 L133 47 Q131 49 126 49 H24 Q19 49 17 47 Z',
            'M31 33 V24 H119 V33 Z M45 24 V17 H105 V24 Z M74 17 V12 H102 V17 Z',
            'M53 17 L56 5 H67 L70 17 Z')
    sg = unary_union([fill(subpaths_as(d)) for d in ship])
    sg = affinity.scale(sg, 0.27, 0.27, origin=(0, 0))
    minx, miny, maxx, maxy = sg.bounds
    sg = affinity.translate(sg, 50 - (minx + maxx) / 2, 51 - (miny + maxy) / 2)
    parts = [sg]
    Rw = 31
    for side in (-1, 1):
        branch = [(50 + side * Rw * math.sin(math.radians(t)), 50 + Rw * math.cos(math.radians(t))) for t in np.linspace(18, 150, 48)]
        parts.append(line(branch, 2.4))
        for t in np.linspace(34, 142, 7):
            tr = math.radians(t)
            px, py = 50 + side * Rw * math.sin(tr), 50 + Rw * math.cos(tr)
            # tangent pointing along the branch's growth (from the base at the bottom upwards)
            tx, ty = side * math.cos(tr), -math.sin(tr)
            nx, ny = side * math.sin(tr), math.cos(tr)  # outward normal
            for o in (1, -1):
                L = 7.5
                dx, dy = 0.75 * tx + o * 0.62 * nx, 0.75 * ty + o * 0.62 * ny
                n = math.hypot(dx, dy)
                dx, dy = dx / n, dy / n
                tipx, tipy = px + L * dx, py + L * dy
                mx, my = px + 0.5 * L * dx, py + 0.5 * L * dy
                wx, wy = -dy * 2.3, dx * 2.3
                leaf = Polygon([(px, py), (mx + wx, my + wy), (tipx, tipy), (mx - wx, my - wy)]).buffer(0.4)
                parts.append(leaf)
    E['champion'] = unary_union(parts)
    return E


def subpaths_as(d):
    return subpaths(d)


def to_d(g):
    g = g.simplify(0.1, preserve_topology=True)
    polys = [g] if isinstance(g, Polygon) else [p for p in getattr(g, 'geoms', []) if isinstance(p, Polygon)]
    out = []
    for p in polys:
        for ring in [p.exterior, *p.interiors]:
            cs = list(ring.coords)[:-1]
            s = 'M' + 'L'.join(f'{x:.1f} {y:.1f}' for x, y in cs) + 'Z'
            out.append(s)
    d = ''.join(out)
    return d.replace('.0 ', ' ').replace('.0L', 'L').replace('.0Z', 'Z')


ORDER = ['first', 'ten', 'twentyfive', 'fifty', 'hundred', 'onefifty', 'twohundred', 'everybar',
         'martini', 'margarita', 'frozen', 'coffee', 'whiskey', 'gin', 'rum', 'wine', 'master', 'champion']


def main():
    E = build()
    lines = []
    for k in ORDER:
        g = E[k]
        minx, miny, maxx, maxy = g.bounds
        dist = max(math.hypot(x - 50, y - 50) for p in ([g] if isinstance(g, Polygon) else g.geoms) for x, y in p.exterior.coords)
        print(f'{k:11s} bbox {minx:5.1f} {miny:5.1f} {maxx:5.1f} {maxy:5.1f}  w {maxx-minx:4.1f} h {maxy-miny:4.1f}  reach {dist:4.1f}', file=sys.stderr)
        lines.append((k, to_d(g)))
    if len(sys.argv) > 1:
        json.dump(dict(lines), open(sys.argv[1], 'w'))
        return
    # write each emblem into its own entry of the data file, which must already hold every id once
    target = Path(__file__).resolve().parent.parent / 'src' / 'features' / 'badges' / 'emblems-data.ts'
    s = target.read_text(encoding='utf-8')
    for k, d in lines:
        s, n = re.subn(r"(\n  " + k + r": ')[^']*(')",
                       lambda m: m.group(1) + '<path fill-rule="evenodd" d="' + d + '"/>' + m.group(2), s)
        assert n == 1, k
    target.write_text(s, encoding='utf-8', newline='\n')
    print('written', target, file=sys.stderr)


if __name__ == '__main__':
    main()
