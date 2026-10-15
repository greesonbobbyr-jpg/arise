"""Prepare the illustrated characters for the app.

usage:  python tools/prepare-characters.py [debug folder]
needs:  numpy, opencv-python-headless, pillow (with WebP)

Input art in art/src (made in ChatGPT, see art/README.md): {m,f}-{lean,athletic,powerful}.png, 1536x1024, transparent
background, FRONT view on the left half and BACK view on the right half. Output: art/chars/*.webp and characters.js.

For each sex, build and view this
  1. cuts the figure out (the art's own alpha), on a canvas shared by the three builds so they line up when swapping,
  2. finds body landmarks on the silhouette (neck, shoulders, armpits, elbows, wrists, waist, hips, crotch, knees,
     ankles, feet), on the drawing and on the traced muscle template in anatomy.js alike,
  3. moves every template muscle onto the drawing, point by point in body coordinates (see Body below),
  4. grows the muscles over the whole body below the neck (clothes included, so they never show) with a thin seam
     between neighbours; head, hair, hands and feet stay the drawing's,
  5. writes the cut-out (WebP for the app; PNG, JSON and a labelled overlay in the debug folder) and characters.js.
"""
import json, os, re, sys
import numpy as np
import cv2
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILDS = ['lean', 'athletic', 'powerful']
REGIONS = ['traps', 'chest', 'delts', 'biceps', 'triceps', 'forearms', 'obliques', 'abs', 'glutes', 'quads', 'calves', 'adductors', 'rhomboids', 'lats', 'erectors', 'hams']
NAMES = {'traps': 'Traps', 'chest': 'Chest', 'delts': 'Shoulders', 'biceps': 'Biceps', 'triceps': 'Triceps', 'forearms': 'Forearms', 'obliques': 'Obliques', 'abs': 'Abs', 'glutes': 'Glutes', 'quads': 'Quads', 'calves': 'Calves', 'adductors': 'Adductors', 'rhomboids': 'Rhomboids', 'lats': 'Lats', 'erectors': 'Lower back', 'hams': 'Hamstrings'}

# ---------------------------------------------------------------- hair and silhouette
def runs(row):
    """[(start, end)] of consecutive True pixels in a boolean row."""
    d = np.diff(np.concatenate([[0], row.astype(np.int8), [0]]))
    return list(zip(np.nonzero(d == 1)[0], np.nonzero(d == -1)[0] - 1))

def hsv_of(rgba):
    hsv = cv2.cvtColor(np.ascontiguousarray(rgba[:, :, :3]), cv2.COLOR_RGB2HSV)
    return [hsv[:, :, i].astype(int) for i in range(3)]

def hair_mask(rgba, sex, strands=True):
    """Hair: black for him (only on the head); blonde for her. Blonde is usually yellower than skin (skin hue stays under
    17 on OpenCV's 0..180 scale, blonde sits at 17..40), but in some art it is the same hue as the skin, so hair is also
    where fine strands make the drawing busy. Either way it is one big mass reaching the head; her ponytail reaches the
    shoulder blades, so the search goes lower."""
    a = rgba[:, :, 3] > 127
    ys = np.nonzero(a)[0]; top, H = ys.min(), ys.max() - ys.min()
    h, s, v = hsv_of(rgba)
    if sex == 'm':
        hair = v < 75; hair[int(top + 0.15 * H):] = False
        hair = cv2.morphologyEx((hair & a).astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
        return (cv2.morphologyEx(hair, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8)) > 0) & a
    def head_mass(m, close, open_=0):
        m = cv2.morphologyEx(m.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((close, close), np.uint8))
        if open_: m = cv2.morphologyEx(m, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (open_, open_)))
        n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
        keep = [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] > 0.0008 * H * H and st[i, cv2.CC_STAT_TOP] < top + 0.2 * H]
        return np.isin(lab, keep)
    yellow = (h >= 17) & (h <= 40) & (s > 40) & (v > 50) & a
    edges = cv2.Canny(cv2.GaussianBlur(cv2.cvtColor(np.ascontiguousarray(rgba[:, :, :3]), cv2.COLOR_RGB2GRAY), (3, 3), 0), 40, 110) > 0
    busy = (cv2.blur(edges.astype(np.float32), (11, 11)) > 0.16) & (h >= 9) & (h <= 40) & a   # strands; muscle lines are thin and drop out
    yellow[int(top + 0.36 * H):] = False; busy[int(top + 0.36 * H):] = False
    hair = head_mass(yellow, 7) | (head_mass(busy, 9, 9) if strands else False)
    return (cv2.morphologyEx(hair.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8)) > 0) & a

def hairless(rgba, sex):
    """The figure's silhouette without hair (a ponytail or loose strands would read as extra limbs): the largest piece.
    Only hair of the hair colour goes, so a ponytail lying across the back does not punch a hole in it."""
    m = (rgba[:, :, 3] > 127) & ~hair_mask(rgba, sex, strands=False)
    n, lab, st, _ = cv2.connectedComponentsWithStats(m.astype(np.uint8), 8)
    if n > 1: m = lab == (1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA])))
    return (m * 255).astype(np.uint8)

# ---------------------------------------------------------------- landmarks on the silhouette
def landmarks(mask, full=None):
    """Body landmarks on a standing, front- or back-facing silhouette (arms hanging slightly away from the body).
    `full` is the silhouette including hair, used only for the top of the head."""
    m = mask > 127
    ys, xs = np.nonzero(m)
    top, bot = ys.min(), ys.max(); H = bot - top
    if full is not None: top = int(np.nonzero(full > 127)[0].min())
    cx = float(np.median(xs[(ys > top + 0.22 * H) & (ys < top + 0.45 * H)]))
    width = np.array([ (r[-1][1] - r[0][0]) if (r := runs(m[y])) else 0 for y in range(m.shape[0]) ])
    L = {'top': (cx, top), 'bottom': (cx, bot)}
    # armpit: first row (from the shoulders down) where the torso and both arms are separate runs
    armpit = None
    for y in range(int(top + 0.15 * H), int(top + 0.45 * H)):
        r = runs(m[y])
        if len(r) >= 3:
            mid = [s for s in r if s[0] <= cx <= s[1]]
            # a real armpit has a torso-wide middle and an arm-thick run on each side (loose hair strands are thin)
            if mid and mid[0][1] - mid[0][0] >= 0.1 * H \
                    and any(s[1] < mid[0][0] and s[1] - s[0] >= 0.02 * H for s in r) \
                    and any(s[0] > mid[0][1] and s[1] - s[0] >= 0.02 * H for s in r):
                armpit = y; torso = mid[0]; break
    if armpit is None: raise RuntimeError('no armpit gap found')
    L['armpitL'], L['armpitR'] = (torso[0], armpit), (torso[1], armpit)
    # shoulders: widest row in the band just above the armpits
    band = range(int(armpit - 0.09 * H), armpit)
    sy = max(band, key=lambda y: width[y]); r = runs(m[sy])
    L['shoulderL'], L['shoulderR'] = (r[0][0], sy), (r[-1][1], sy)
    # neck base, where the neck meets the traps: the narrowest row between the face and the shoulders is somewhere on the
    # neck or the jaw (anime necks and chins are similar widths), so from there go down until the outline flares out
    band = [y for y in range(int(armpit - 0.16 * H), int(armpit - 0.04 * H)) if width[y] > 0]
    ny = min(band, key=lambda y: width[y]); wmin = width[ny]
    while ny < armpit and width[ny] < 1.45 * wmin: ny += 1
    r = runs(m[ny])
    L['neckL'], L['neckR'] = (r[0][0], ny), (r[-1][1], ny)
    # cut at the armpits: below them the arms are their own components
    below = m.copy(); below[:armpit + 2] = False
    n, lab, stats, cent = cv2.connectedComponentsWithStats(below.astype(np.uint8), 8)
    comps = sorted(range(1, n), key=lambda i: -stats[i, cv2.CC_STAT_AREA])[:3]
    body = min(comps, key=lambda i: abs(cent[i][0] - cx))
    arms = sorted([i for i in comps if i != body], key=lambda i: cent[i][0])
    arm_by_side = {}
    for ai in arms:
        arm_by_side['L' if cent[ai][0] < cx else 'R'] = lab == ai
    arm, span = {}, {}
    for side in 'LR':
        if side in arm_by_side:
            a = arm_by_side[side]
        else:
            # the hand touches the thigh, so the arm joined the body: follow the outermost run down from the armpit
            a = np.zeros_like(m)
            for y in range(armpit + 2, int(top + 0.62 * H)):
                r = runs(m[y])
                if len(r) < 3: break
                s = r[0] if side == 'L' else r[-1]; a[y, s[0]:s[1] + 1] = True
        ay = np.nonzero(a)[0]; arm[side], span[side] = a, (ay.min(), ay.max())
    # the pose is symmetric: an arm whose hand rests on the hip ends early in the silhouette, so both arms take their
    # heights from the longer one
    a0, a1 = max(span.values(), key=lambda s: s[1] - s[0])
    for side in 'LR':
        a = arm[side]
        def centre_at(f):
            y = int(a0 + f * (a1 - a0)); xs_ = np.nonzero(a[y])[0]
            if not len(xs_):            # past this arm's end (the hand rests on the hip): an arm's width in from the outside
                r = runs(m[y]); s = r[0] if side == 'L' else r[-1]
                w = float(np.median([np.count_nonzero(a[yy]) for yy in range(span[side][0], span[side][1] + 1)]))
                xs_ = np.array([s[0] + w / 2 if side == 'L' else s[1] - w / 2])
            return (float(xs_.mean()), y)
        L['elbow' + side] = centre_at(0.36)
        L['wrist' + side] = centre_at(0.78)
        # the fist: on from the wrist along the forearm (measuring it on the silhouette fails when a hand touches a thigh)
        L['hand' + side] = (L['wrist' + side][0] + 0.45 * (L['wrist' + side][0] - L['elbow' + side][0]),
                            L['wrist' + side][1] + 0.45 * (L['wrist' + side][1] - L['elbow' + side][1]))
    bm = lab == body
    # torso width per row: the piece on the centre line only (an arm can join the body where a hand touches a thigh)
    mid = lambda y: next((s for s in runs(bm[y]) if s[0] <= cx <= s[1]), None)
    bw = np.array([(s[1] - s[0]) if (s := mid(y)) else 0 for y in range(bm.shape[0])])
    # crotch: first row (from the hips down) with a gap at the centre line, between the legs (counting pieces per row
    # would stop early when a hand touches a thigh and the arm joins the body)
    crotch = None
    c0, c1 = int(cx - 0.015 * H), int(cx + 0.015 * H) + 1
    for y in range(int(top + 0.42 * H), int(top + 0.7 * H)):
        if not bm[y, c0:c1].all(): crotch = y; break
    if crotch is None: raise RuntimeError('no crotch found')
    L['crotch'] = (cx, crotch)
    wy = min(range(armpit + 5, int(armpit + 0.6 * (crotch - armpit))), key=lambda y: bw[y]); s = mid(wy)
    L['waistL'], L['waistR'] = (s[0], wy), (s[1], wy)
    hy = max(range(wy, crotch), key=lambda y: bw[y]); s = mid(hy)
    L['hipL'], L['hipR'] = (s[0], hy), (s[1], hy)
    # legs: per side, knee = narrowest point in the middle of the leg, ankle = narrowest point near the floor
    legs = bm.copy(); legs[:crotch + 1] = False
    n2, lab2, st2, ce2 = cv2.connectedComponentsWithStats(legs.astype(np.uint8), 8)
    lg = sorted(sorted(range(1, n2), key=lambda i: -st2[i, cv2.CC_STAT_AREA])[:2], key=lambda i: ce2[i][0])
    for side, li in zip('LR', lg):
        g = lab2 == li; gy, gx = np.nonzero(g); g0, g1 = gy.min(), gy.max(); Lh = g1 - g0
        wid = lambda y: (lambda xs_: xs_.max() - xs_.min() if len(xs_) else 1e9)(np.nonzero(g[y])[0])
        # ankle: the narrowest point just above the foot or shoe; knee: by proportion (muscular calves make widths unreliable)
        ay_ = min(range(int(g0 + 0.72 * Lh), int(g0 + 0.93 * Lh)), key=wid)
        ky = int(g0 + 0.44 * (ay_ - g0))
        for nm, y in (('knee', ky), ('ankle', ay_)):
            xs_ = np.nonzero(g[y])[0]; L[nm + side + 'o'] = (float(xs_.min() if side == 'L' else xs_.max()), y); L[nm + side + 'i'] = (float(xs_.max() if side == 'L' else xs_.min()), y)
        L['foot' + side] = (float(gx[gy == g1].mean()), g1)
    return L

# ---------------------------------------------------------------- body frame
def frames(L):
    """The torso frame: centre line x, armpit half-width, neck base y, crotch y."""
    cx = (L['armpitL'][0] + L['armpitR'][0]) / 2; hw = (L['armpitR'][0] - L['armpitL'][0]) / 2
    ny = (L['neckL'][1] + L['neckR'][1]) / 2; cy = L['crotch'][1]
    return cx, hw, ny, cy

def limb_maps(L, a, H):
    """Per-pixel limb parameters: which limb, how far along it (t) and across it (s, + outward)."""
    hh, ww = a.shape
    cx, hw, ny, cy = frames(L)
    part = np.zeros(a.shape, np.int8)          # 1 upper arm, 2 forearm, 3 thigh, 4 shin
    T = np.zeros(a.shape, np.float32); S = np.zeros(a.shape, np.float32)
    for side, out in (('L', -1), ('R', 1)):
        ap, el, wr = L['armpit' + side], L['elbow' + side], L['wrist' + side]
        for y in range(int(ap[1] - 0.01 * H), min(hh, int(L['hand' + side][1] + 0.02 * H))):
            r = runs(a[y])
            if len(r) < 2: continue
            s = r[0] if side == 'L' else r[-1]
            if (out < 0 and s[1] >= cx - hw * 0.8) or (out > 0 and s[0] <= cx + hw * 0.8): continue   # still joined to the torso
            c = (s[0] + s[1]) / 2; h = max(4.0, (s[1] - s[0]) / 2); xs = np.arange(s[0], s[1] + 1)
            if y <= el[1]: part[y, xs] = 1; T[y, xs] = (y - ap[1]) / max(1.0, el[1] - ap[1])
            else: part[y, xs] = 2; T[y, xs] = (y - el[1]) / max(1.0, wr[1] - el[1])
            S[y, xs] = (xs - c) * out / h
        kc = (np.array(L['knee' + side + 'o']) + np.array(L['knee' + side + 'i'])) / 2
        ac = (np.array(L['ankle' + side + 'o']) + np.array(L['ankle' + side + 'i'])) / 2
        hipc = np.array([kc[0] + (L['hip' + side][0] - kc[0]) * 0.35, cy])
        for y in range(int(cy) + 1, min(hh, int(ac[1] + 0.02 * H))):
            exp = hipc + (kc - hipc) * ((y - cy) / max(1.0, kc[1] - cy)) if y <= kc[1] else kc + (ac - kc) * ((y - kc[1]) / max(1.0, ac[1] - kc[1]))
            r = [s for s in runs(a[y]) if ((s[0] + s[1]) / 2 - cx) * out > 0]
            if not r: continue
            s = min(r, key=lambda s: abs((s[0] + s[1]) / 2 - exp[0]))
            c = (s[0] + s[1]) / 2; h = max(4.0, (s[1] - s[0]) / 2); xs = np.arange(s[0], s[1] + 1)
            if y <= kc[1]: part[y, xs] = 3; T[y, xs] = (y - cy) / max(1.0, kc[1] - cy)
            else: part[y, xs] = 4; T[y, xs] = (y - kc[1]) / max(1.0, ac[1] - kc[1])
            S[y, xs] = (xs - c) * out / h
    return part, T, S

# ---------------------------------------------------------------- muscles: the traced template fitted onto the art
# The muscle shapes are MuscleMap's traced figures (anatomy.js, MIT; see THIRD_PARTY.md), the ones the app drew before it
# had illustrated characters. Each point of a template muscle is placed on the art by body part: on an arm or a leg by how
# far along it is (armpit/crotch to elbow/knee, elbow to wrist, knee to ankle) and how far across; on the torso by height
# between the same landmarks (neck base, shoulders, armpits, waist, hips, crotch) and how far across that row it is. So
# every muscle lands on the same place of the drawn body, and its edges follow the art's outline.
def load_anatomy():
    s = open(os.path.join(ROOT, 'anatomy.js'), encoding='utf8').read()
    A = json.loads(s[s.index('{'):s.rindex('}') + 1])
    # MuscleMap's female front labels the thigh muscles the wrong way round (adductors on the outside): of the thigh
    # muscles tagged adductors or glutes (abductors), the two nearest the centre line are the adductors
    for sx in A:
        F = A[sx]['front']
        vx, _, vw, _ = [float(v) for v in F['viewBox'].split()]
        thigh = [m for m in F['muscles'] if m['key'] in ('adductors', 'glutes')]
        if len(thigh) == 4:
            off = lambda m: np.mean([abs(float(x) - (vx + vw / 2)) for d in m['d'] for x in NUM.findall(d)[0::2]])
            for i, m in enumerate(sorted(thigh, key=off)):
                m['key'], m['name'] = ('adductors', 'Adductors') if i < 2 else ('glutes', 'Glute med / abductors')
    return A

NUM = re.compile(r'-?\d+(?:\.\d+)?')
def path_polys(d, step=6):
    """Flatten an absolute M/L/C/Z SVG path into polygons (arrays of [x, y])."""
    polys, cur, pos = [], [], None
    for cmd, args in re.findall(r'([MLCZmlcz])([^MLCZmlcz]*)', d):
        n = [float(x) for x in NUM.findall(args)]
        if cmd == 'M':
            if cur: polys.append(cur)
            cur = [n[0:2]]; pos = n[0:2]
            for i in range(2, len(n), 2): cur.append(n[i:i + 2]); pos = n[i:i + 2]
        elif cmd == 'L':
            for i in range(0, len(n), 2): cur.append(n[i:i + 2]); pos = n[i:i + 2]
        elif cmd == 'C':
            for i in range(0, len(n), 6):
                p0, p1, p2, p3 = np.array(pos), np.array(n[i:i + 2]), np.array(n[i + 2:i + 4]), np.array(n[i + 4:i + 6])
                for t in np.linspace(0, 1, step + 1)[1:]:
                    cur.append(((1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t * t * p2 + t ** 3 * p3).tolist())
                pos = n[i + 4:i + 6]
        elif cmd in 'Zz':
            if cur: polys.append(cur); cur = []
    if cur: polys.append(cur)
    return [np.array(p, dtype=np.float64) for p in polys if len(p) >= 3]

class Body:
    """A figure's body frame from its silhouette: landmarks and per-row pieces, to go from a pixel to body coordinates
    (part, side, along, across) and back."""
    def __init__(self, mask):
        self.m = mask > 0
        ys = np.nonzero(self.m)[0]; self.H = ys.max() - ys.min()
        self.L = landmarks((self.m * 255).astype(np.uint8))
        self.part, _, _ = limb_maps(self.L, self.m, self.H)
        self.cx, self.hw, self.ny, self.cy = frames(self.L)
        L = self.L
        self.anch = [self.ny, L['shoulderL'][1], L['armpitL'][1], L['waistL'][1], L['hipL'][1], self.cy]
        # each forearm's usual width, where it hangs free: where a hand rests on a thigh the arm's row runs on into the leg
        self.arm_w = {}
        for side in 'LR':
            ws = []
            for y in range(int(L['elbow' + side][1]), int(L['wrist' + side][1])):
                r = runs(self.m[y]); s = r[0] if side == 'L' else r[-1]
                if len(r) >= 2 and not (s[0] <= self.cx <= s[1]): ws.append(s[1] - s[0])
            self.arm_w[side] = float(np.median(ws)) if ws else 0.06 * self.H
        # the hands: from the wrist down, follow the arm's piece row by row; where the hand rests on a thigh the piece
        # runs on into the leg, so it keeps the hand's columns from the row above
        self.hand, self.hand_rows = np.zeros(self.m.shape, bool), {}
        for side in 'LR':
            wy, hy = L['wrist' + side][1], L['hand' + side][1]
            y0, y1 = int(wy - 0.01 * self.H), int(hy + 0.3 * (hy - wy))
            prev = None
            for y in range(max(0, y0), min(self.m.shape[0], y1)):
                r = runs(self.m[y])
                if prev is None: cand = [r[0] if side == 'L' else r[-1]] if r else []
                else: cand = [c for c in r if c[0] <= prev[1] + 1 and c[1] >= prev[0] - 1]   # pieces overlapping the hand above
                if not cand: break                                                            # past the fingertips
                s = (min(c[0] for c in cand), max(c[1] for c in cand))
                if prev is not None and s[1] - s[0] > 1.6 * (prev[1] - prev[0]) + 4:           # ran on into a thigh: keep
                    s = (max(s[0], prev[0]), min(s[1], prev[1]))                               # the hand's last width
                for c in cand: self.hand[y, max(c[0], s[0]):min(c[1], s[1]) + 1] = True
                prev = s
            self.hand_rows[side] = (y0, y)
        # legs are measured without the hands
        self.legs = self.m & ~self.hand
        # the torso's own edges below the armpits: where a hand rests against the hips the row's middle piece runs on
        # into the arm, so an edge that jumps outward from one row to the next keeps its last position
        self.edges, l, r = {}, None, None
        for y in range(int(L['armpitL'][1]) + 1, int(self.cy) + 1):
            s = next((s for s in runs(self.m[y]) if s[0] <= self.cx <= s[1]), None)
            if s is None: continue
            if l is None: l, r = s[0], s[1]
            else:
                l = s[0] if s[0] >= l - 0.012 * self.H else l
                r = s[1] if s[1] <= r + 0.012 * self.H else r
            self.edges[y] = (l, r)
        # each thigh's outer edge: measured on the leg, and across the rows where a hand rests on it, drawn straight from the
        # edge above the hand to the edge below it
        for side in 'LR':
            out = -1 if side == 'L' else 1
            kx = (L['knee' + side + 'o'][0] + L['knee' + side + 'i'][0]) / 2
            ky = int((L['knee' + side + 'o'][1] + L['knee' + side + 'i'][1]) / 2)
            h0, h1 = self.hand_rows[side]
            rows, edge = [], []
            for y in range(int(self.cy), ky + 1):
                r = [s for s in runs(self.legs[y]) if ((s[0] + s[1]) / 2 - self.cx) * out > 0]
                if not r: continue
                s = min(r, key=lambda s: 0 if s[0] <= kx <= s[1] else min(abs(s[0] - kx), abs(s[1] - kx)))
                o = s[0] - 1 if side == 'L' else s[1] + 1                                   # just outside the leg's outer edge
                touched = 0 <= o < self.m.shape[1] and self.hand[max(0, y - 2):y + 3, max(0, o - 2):o + 3].any()   # a hand there
                if not touched: rows.append(y); edge.append(s[0] if side == 'L' else s[1])
            for y in range(int(self.cy), ky + 1):
                if rows: self.edges[side, y] = float(np.interp(y, rows, edge))
        inside = self.m.astype(np.uint8)
        _, self.near = cv2.distanceTransformWithLabels(1 - inside, cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
        yy, xx = np.nonzero(inside); self.lut = np.zeros((self.near.max() + 1, 2), np.int32); self.lut[self.near[yy, xx]] = np.stack([yy, xx], 1)

    def snap(self, x, y):
        """The silhouette pixel at (x, y), or the nearest one (template paths sit on or just outside the outline)."""
        yi, xi = int(np.clip(round(y), 0, self.m.shape[0] - 1)), int(np.clip(round(x), 0, self.m.shape[1] - 1))
        return (yi, xi) if self.m[yi, xi] else tuple(self.lut[self.near[yi, xi]])

    def piece(self, y, x_hint, part, side):
        """The row's piece a point belongs to: the torso (above the armpits the shoulders and arms count with it), or a
        limb on the point's own side (an arm is the outermost piece)."""
        m = self.legs if part in (3, 4) else self.m
        yy = int(np.clip(round(y), 0, m.shape[0] - 1)); r = runs(m[yy])
        while not r and yy < m.shape[0] - 1: yy += 1; r = runs(m[yy])   # under hair: the first row of body below
        if part == 0:
            if y <= self.L['armpitL'][1]: return (r[0][0], r[-1][1])
            s = min(r, key=lambda s: 0 if s[0] <= self.cx <= s[1] else min(abs(s[0] - self.cx), abs(s[1] - self.cx)))
            e = self.edges.get(yy)
            return (max(s[0], e[0]), min(s[1], e[1])) if e else s
        out = -1 if side == 'L' else 1
        own = [s for s in r if ((s[0] + s[1]) / 2 - self.cx) * out > 0 and (part in (3, 4) or not (s[0] <= self.cx <= s[1]))] or r   # touching thighs can cross the centre line
        if part in (1, 2):
            s, w = (own[0] if side == 'L' else own[-1]), self.arm_w[side]
            if s[1] - s[0] > 1.5 * w:                        # a hand resting on a thigh: an arm's width from the outer edge
                s = (s[0], s[0] + w) if side == 'L' else (s[1] - w, s[1])
            return s
        s = min(own, key=lambda s: 0 if s[0] <= x_hint <= s[1] else min(abs(s[0] - x_hint), abs(s[1] - x_hint)))
        e = self.edges.get((side, yy)) if part == 3 else None
        if e is not None: s = (max(s[0], e), s[1]) if side == 'L' else (s[0], min(s[1], e))
        return s

    def limb_rows(self, part, side):
        L = self.L
        if part == 1: return L['armpit' + side][1], L['elbow' + side][1]
        if part == 2: return L['elbow' + side][1], L['wrist' + side][1]
        kc = (L['knee' + side + 'o'][1] + L['knee' + side + 'i'][1]) / 2
        if part == 3: return self.cy, kc
        return kc, (L['ankle' + side + 'o'][1] + L['ankle' + side + 'i'][1]) / 2

    def to_body(self, x, y):
        yi, xi = self.snap(x, y)
        part, side = int(self.part[yi, xi]), ('L' if x < self.cx else 'R')
        if part == 0 and y >= self.cy + 2:                   # below the crotch it is a leg, even past the leg map (ankles)
            L = self.L; part = 4 if y > (L['knee' + side + 'o'][1] + L['knee' + side + 'i'][1]) / 2 else 3
        if part:
            y0, y1 = self.limb_rows(part, side); r = self.piece(y, x, part, side)
            c, h = (r[0] + r[1]) / 2, max(4.0, (r[1] - r[0]) / 2)
            return part, side, (y - y0) / max(1.0, y1 - y0), float(np.clip((x - c) * (-1 if side == 'L' else 1) / h, -1.4, 1.4))
        n = len(self.anch)
        if y < self.anch[0]: v = (y - self.anch[0]) / (self.anch[1] - self.anch[0])
        else: v = float(np.interp(y, self.anch, np.arange(n)))
        r = self.piece(min(y, self.cy - 2), x, 0, side)     # the pelvis row just above the legs split
        c, h = (r[0] + r[1]) / 2, max(4.0, (r[1] - r[0]) / 2)
        return 0, side, max(v, -1.0), (x - c) / h

    def from_body(self, part, side, t, u):
        if part:
            t = float(np.clip(t, 0.01 if part == 1 else -0.05, 1.0 if part == 4 else 1.05))   # arms start below the armpit, calves stop at the ankle
            y0, y1 = self.limb_rows(part, side); y = y0 + t * (y1 - y0)
            L = self.L
            hint = L['elbow' + side][0] if part in (1, 2) else (L['knee' + side + 'o'][0] + L['knee' + side + 'i'][0]) / 2
            r = self.piece(y, hint, part, side); c, h = (r[0] + r[1]) / 2, max(4.0, (r[1] - r[0]) / 2)
            return c + u * h * (-1 if side == 'L' else 1), y
        n = len(self.anch)
        y = self.anch[0] + t * (self.anch[1] - self.anch[0]) if t < 0 else float(np.interp(t, np.arange(n), self.anch))
        y = min(y, self.cy - 2)
        r = self.piece(y, self.cx, 0, side); c, h = (r[0] + r[1]) / 2, max(4.0, (r[1] - r[0]) / 2)
        return c + u * h, y

def template_body(T, height=1000.0):
    """The template figure rasterised about as tall as the art, with its body frame and the scale used."""
    vx, vy, vw, vh = [float(v) for v in T['viewBox'].split()]
    k = height / vh
    m = np.zeros((int(vh * k) + 1, int(vw * k) + 1), np.uint8)
    for d in T['outline']:
        for p in path_polys(d): cv2.fillPoly(m, [((p - [vx, vy]) * k).round().astype(np.int32)], 255)
    return Body(m), (vx, vy, k)

GROW = 0.025   # how far a muscle may grow into bare body, as a share of the body's height

def flat(c, H):
    """A flat horizontal sliver: what is left of a muscle squeezed against a hand or the hairline."""
    x, y, w, h = cv2.boundingRect(c)
    return h < 0.012 * H and w > 2 * h

def to_path(c):
    return 'M' + ' L'.join('%d %d' % (x, y) for x, y in cv2.approxPolyDP(c, 1.0, True)[:, 0, :]) + ' Z'

def regions_for(crop, sources, view, sex):
    """The hunter's body below the neck as the System's muscle map: the template's muscles moved onto the drawing, grown
    a little to fill the body, and plain panels over what is left, so no dark patches show; a thin dark seam wherever two
    pieces meet. Head, hair, hands and feet stay the drawing's.
    Returns the muscles [{key, name, d}], the plain panels, the body's outline, the landmarks, and the share of the body
    left bare. sources: [(template figure, its body frame, the muscle keys to take from it)]."""
    a = crop[:, :, 3] > 127
    FA = Body(hairless(crop, sex)); L, H = FA.L, FA.H
    Y, X = np.mgrid[0:a.shape[0], 0:a.shape[1]]
    hair = cv2.dilate(hair_mask(crop, sex).astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
    body = a & ~hair & ~FA.hand & (Y > FA.ny - (0.008 if view == 'front' else 0.04) * H)   # from behind the traps run up the neck
    body &= np.where(X < FA.cx, Y < L['ankleLo'][1] + 0.01 * H, Y < L['ankleRo'][1] + 0.01 * H)   # each leg to its own ankle
    n, cc, st, _ = cv2.connectedComponentsWithStats(body.astype(np.uint8), 8)   # every sizeable piece: hair can cut off an arm
    body = np.isin(cc, [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] > 0.002 * H * H])
    # 1. the template's muscles, one label per muscle shape
    lab, keys = np.zeros(a.shape, np.int32), [None]
    for T, (FT, (vx, vy, k)), take in sources:
        for mu in T['muscles']:
            if mu['key'] not in take: continue
            for p in (p for d in mu['d'] for p in path_polys(d)):
                q = np.array([FA.from_body(*FT.to_body(x, y)) for x, y in (p - [vx, vy]) * k])
                mk = np.zeros(a.shape, np.uint8); cv2.fillPoly(mk, [q.round().astype(np.int32)], 1)
                mk = mk.astype(bool) & body & (lab == 0)
                if mk.sum() < 0.00008 * H * H: continue
                keys.append(mu['key']); lab[mk] = len(keys) - 1
    # 2. each muscle grows a little, up to GROW of the body's height, into the bare body around it (the drawing is wider
    # and curvier than the template); what is still bare after that (pelvis, knees, elbows) becomes plain panels that
    # never light up, so no black shows
    src = lab > 0
    dist, idx = cv2.distanceTransformWithLabels((~src).astype(np.uint8), cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
    ys, xs = np.nonzero(src); lut = np.zeros(idx.max() + 1, np.int32); lut[idx[ys, xs]] = lab[ys, xs]
    lab = np.where(body & (dist <= GROW * H), lut[idx], 0)
    n, cc, st, _ = cv2.connectedComponentsWithStats((body & (lab == 0)).astype(np.uint8), 4)
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] < 0.0006 * H * H: continue                   # specks: left to the nearest muscle below
        keys.append(None); lab[cc == i] = len(keys) - 1
    def fill(lab):                                                             # bare body joins the nearest muscle or panel
        rest = body & (lab == 0)
        if rest.any():
            _, idx = cv2.distanceTransformWithLabels((lab == 0).astype(np.uint8), cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
            ys, xs = np.nonzero(lab > 0); lut = np.zeros(idx.max() + 1, np.int32); lut[idx[ys, xs]] = lab[ys, xs]
            lab[rest] = lut[idx][rest]
        return lab
    lab = fill(lab)
    for it in range(4):                                                        # crumbs and flat slivers join a neighbour
        crumbs = np.zeros(a.shape, bool)
        for i in range(1, len(keys)):
            n, cc, st, _ = cv2.connectedComponentsWithStats((lab == i).astype(np.uint8), 8)
            for j in range(1, n):
                w, h, area = st[j, cv2.CC_STAT_WIDTH], st[j, cv2.CC_STAT_HEIGHT], st[j, cv2.CC_STAT_AREA]
                if area < 0.00015 * H * H or (h < 0.012 * H and w > 2 * h): crumbs |= cc == j
        if not crumbs.any(): break
        lab[crumbs] = 0
        if it < 3: lab = fill(lab)
        else: body &= ~crumbs                                                  # no neighbour (bits of fingers): the drawing's
    # 3. a dark seam where two muscles meet, about 1% of the body's height wide
    seam = np.zeros(a.shape, bool)
    for dy, dx in ((0, 1), (1, 0)):
        p, q = lab[:lab.shape[0] - dy, :lab.shape[1] - dx], lab[dy:, dx:]
        diff = (p != q) & (p > 0) & (q > 0)
        seam[:lab.shape[0] - dy, :lab.shape[1] - dx] |= diff; seam[dy:, dx:] |= diff
    seam = cv2.dilate(seam.astype(np.uint8), np.ones((2, 2), np.uint8)) > 0     # 3 px
    out, panels, covered = [], [], np.zeros(a.shape, np.uint8)
    for i in range(1, len(keys)):
        mk = cv2.medianBlur(((lab == i) & ~seam).astype(np.uint8) * 255, 3)
        cs, _ = cv2.findContours(mk, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        for c in cs:
            if cv2.contourArea(c) < 0.00008 * H * H or flat(c, H): continue
            if keys[i]: out.append({'key': keys[i], 'name': NAMES[keys[i]], 'd': to_path(c)})
            else: panels.append(to_path(c))
            cv2.drawContours(covered, [c], -1, 1, -1)
    covered = covered > 0
    cs, _ = cv2.findContours(cv2.medianBlur(body.astype(np.uint8) * 255, 5), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    outline = [to_path(c) for c in cs if cv2.contourArea(c) >= 0.002 * H * H]
    # bare patches: body the muscles do not cover, ignoring the seams (an opening wider than a seam removes them)
    bare = cv2.morphologyEx((body & ~covered).astype(np.uint8), cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    return out, panels, outline, L, bare > 0, body

# ---------------------------------------------------------------- main
def main(out=None):
    """Reads art/src, writes art/chars/*.webp and characters.js. With `out`, also a debug PNG and JSON per figure."""
    art, chars = os.path.join(ROOT, 'art', 'src'), os.path.join(ROOT, 'art', 'chars')
    os.makedirs(chars, exist_ok=True)
    if out: os.makedirs(out, exist_ok=True)
    report, app, patches = {}, {}, {}
    A = load_anatomy()
    tbs = {(sx, view): template_body(A[sx][view]) for sx in 'mf' for view in ('front', 'back')}
    # debug colours (BGR), picked so neighbouring muscles differ
    pal = dict(zip(REGIONS, [(60, 60, 230), (60, 220, 170), (230, 200, 60), (200, 60, 220), (40, 140, 250), (80, 210, 80),
                             (250, 150, 110), (180, 100, 255), (40, 90, 160), (60, 230, 160), (220, 160, 170), (160, 40, 160),
                             (40, 200, 240), (150, 200, 60), (200, 80, 120), (130, 90, 230)]))
    for sx in 'mf':
        imgs = {b: np.array(Image.open(os.path.join(art, '%s-%s.png' % (sx, b))).convert('RGBA')) for b in BUILDS}
        for vi, view in enumerate(('front', 'back')):
            # his traced figure is the detailed one (glutes in parts, three hamstring heads, the shoulder blades), so both
            # characters take their muscles from it; hers keeps only its own chest
            own = {'chest'} if sx == 'f' and view == 'front' else set()
            sources = [(A['m'][view], tbs['m', view], set(REGIONS) - own)] + ([(A['f'][view], tbs['f', view], own)] if own else [])
            halves = {b: im[:, :768] if vi == 0 else im[:, 768:] for b, im in imgs.items()}
            # one canvas for the three builds: union bounding box plus a margin, so swapping builds does not jump
            ys, xs = np.nonzero(np.any(np.stack([h[:, :, 3] > 8 for h in halves.values()]), 0))
            pad = 14
            y0, y1 = max(0, ys.min() - pad), min(1024, ys.max() + pad + 1)
            x0, x1 = max(0, xs.min() - pad), min(768, xs.max() + pad + 1)
            for b in BUILDS:
                crop = np.ascontiguousarray(halves[b][y0:y1, x0:x1])
                name = '%s-%s-%s' % (sx, b, view)
                regions, panels, outline, L, bare, body = regions_for(crop, sources, view, sx)
                report[name] = sorted(set(r['key'] for r in regions)); patches[name] = bare.sum() / max(1, body.sum())
                Image.fromarray(crop).save(os.path.join(chars, name + '.webp'), 'WEBP', quality=88, method=6)
                app.setdefault(sx, {}).setdefault(b, {})[view] = {
                    'w': int(x1 - x0), 'h': int(y1 - y0), 'img': 'art/chars/' + name + '.webp',
                    'feet': int(max(L['footL'][1], L['footR'][1])), 'body': outline, 'panels': panels, 'regions': [[r['key'], r['d']] for r in regions]}
                if not out: continue
                Image.fromarray(crop).save(os.path.join(out, name + '.png'))
                json.dump({'w': int(x1 - x0), 'h': int(y1 - y0), 'regions': regions,
                           'landmarks': {k: [round(float(v[0]), 1), round(float(v[1]), 1)] for k, v in L.items()}},
                          open(os.path.join(out, name + '.json'), 'w'))
                # debug overlay: regions tinted and labelled, the neck base marked in red
                dbg = cv2.cvtColor(crop[:, :, :3].copy(), cv2.COLOR_RGB2BGR)
                al = crop[:, :, 3:4] / 255.0
                dbg = (dbg * al + np.full_like(dbg, (28, 21, 18)) * (1 - al)).astype(np.uint8)
                over = dbg.copy()
                polys = [(r['key'], np.array([[int(v) for v in t.split()] for t in r['d'][1:-2].split(' L')], np.int32)) for r in regions]
                for k, pts in polys: cv2.fillPoly(over, [pts], pal[k])
                for d in panels: cv2.fillPoly(over, [np.array([[int(v) for v in t.split()] for t in d[1:-2].split(' L')], np.int32)], (90, 90, 90))   # panels grey
                over[bare] = (0, 0, 255)                                                          # bare patches red
                dbg = cv2.addWeighted(over, 0.45, dbg, 0.55, 0)
                for k, pts in polys:
                    cv2.polylines(dbg, [pts], True, pal[k], 1, cv2.LINE_AA)
                for k, pts in polys:
                    mo = cv2.moments(pts)
                    if mo['m00'] < 300: continue
                    tx, ty = int(mo['m10'] / mo['m00']) - 12, int(mo['m01'] / mo['m00']) + 4
                    cv2.putText(dbg, k[:4], (tx, ty), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (0, 0, 0), 3, cv2.LINE_AA)
                    cv2.putText(dbg, k[:4], (tx, ty), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (255, 255, 255), 1, cv2.LINE_AA)
                cv2.line(dbg, (0, int(frames(L)[2])), (25, int(frames(L)[2])), (0, 0, 255), 2)
                cv2.imwrite(os.path.join(out, name + '-debug.png'), dbg)
    # every muscle must be visible in the front or the back view, or training it would light nothing
    for sx in 'mf':
        for b in BUILDS:
            f, k = report['%s-%s-front' % (sx, b)], report['%s-%s-back' % (sx, b)]
            missing = [r for r in REGIONS if r not in f and r not in k]
            bare = max(patches['%s-%s-%s' % (sx, b, v)] for v in ('front', 'back'))
            print('%s-%-9s front %-2d back %-2d %-8s bare patches %.1f%% of the body' % (sx, b, len(f), len(k), 'MISSING ' + ', '.join(missing) if missing else 'all 16', bare * 100))
            if missing: raise SystemExit('some muscles would never light up')
            if bare > 0.02: raise SystemExit('dark patches between the muscles')
    with open(os.path.join(ROOT, 'characters.js'), 'w', encoding='utf8', newline='\n') as f:
        f.write('// Arise characters, built by tools/prepare-characters.py from the art in art/src. Do not edit by hand.\n'
                '// Per sex, build and view: canvas size, image, the line under the feet (for the summoning circle), the outline of\n'
                '// the body below the neck, and its muscle shapes as [body-map key, SVG path in the image\'s pixels] (MuscleMap\'s\n'
                '// traced muscles, fitted to the art and grown to cover the body).\n'
                'window.ARISE_CHARS = ' + json.dumps(app, separators=(',', ':')) + ';\n')
    kb = lambda p: os.path.getsize(p) / 1024
    print('characters.js %.0f KB, images %.0f KB' % (kb(os.path.join(ROOT, 'characters.js')), sum(kb(os.path.join(chars, n)) for n in os.listdir(chars))))

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else None)
