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
  4. cuts the muscles away from hair, head, hands and feet, and from clothing unless the muscle shows through it (glutes
     under shorts, a sports top over the chest and upper back),
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

# ---------------------------------------------------------------- hair, clothing, silhouette
def runs(row):
    """[(start, end)] of consecutive True pixels in a boolean row."""
    d = np.diff(np.concatenate([[0], row.astype(np.int8), [0]]))
    return list(zip(np.nonzero(d == 1)[0], np.nonzero(d == -1)[0] - 1))

def hsv_of(rgba):
    hsv = cv2.cvtColor(np.ascontiguousarray(rgba[:, :, :3]), cv2.COLOR_RGB2HSV)
    return [hsv[:, :, i].astype(int) for i in range(3)]

def hair_mask(rgba, sex):
    """Hair: black for him (only on the head), blonde for her (yellower than skin: skin hue stays under 17 on OpenCV's
    0..180 scale, blonde sits at 17..40). Her ponytail reaches the shoulder blades, so the search goes lower."""
    a = rgba[:, :, 3] > 127
    ys = np.nonzero(a)[0]; top, H = ys.min(), ys.max() - ys.min()
    h, s, v = hsv_of(rgba)
    if sex == 'm':
        hair = v < 75; hair[int(top + 0.15 * H):] = False
        hair = cv2.morphologyEx((hair & a).astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
        return (cv2.morphologyEx(hair, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8)) > 0) & a
    # blonde strands are thin with darker lines between them: join them into one mass of hair, then keep only the big
    # pieces that reach the head (yellowish specks on skin are small and lower down)
    hair = (h >= 17) & (h <= 40) & (s > 40) & (v > 50) & a; hair[int(top + 0.36 * H):] = False
    hair = cv2.morphologyEx(hair.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(hair, 8)
    keep = [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] > 0.0008 * H * H and st[i, cv2.CC_STAT_TOP] < top + 0.2 * H]
    hair = np.isin(lab, keep).astype(np.uint8)
    return (cv2.morphologyEx(hair, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8)) > 0) & a

def garment_mask(rgba):
    """Black clothing and shoes: near-black (saturation means nothing that dark) or dark grey. Thin dark line art is
    dropped by the opening; big pieces stay."""
    a = rgba[:, :, 3] > 127
    h, s, v = hsv_of(rgba)
    g = (((v < 60) | ((s < 50) & (v < 130))) & a).astype(np.uint8)
    g = cv2.morphologyEx(g, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    g = cv2.morphologyEx(g, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8)) > 0
    return g & a

def whole_shorts(garment, a, hair, L, part):
    """Shorts as one piece: a drawstring, zip or highlight on them is not skin. Below the waistband and above each hem,
    any non-cloth patch that does not connect to skin outside the shorts becomes cloth."""
    hh, ww = a.shape
    Y, X = np.mgrid[0:hh, 0:ww]
    cx, hw, ny, cy = frames(L)
    area = np.zeros(a.shape, bool)
    wb = next((y for y in range(int(ny + 0.5 * (cy - ny)), int(cy))
               if (lambda xs: len(xs) and garment[y, xs].mean() > 0.6)(np.nonzero(a[y] & (part[y] == 0) & (np.abs(np.arange(ww) - cx) < 1.2 * hw))[0])), None)
    if wb is None: return garment
    area[wb:int(cy) + 1] = (a & (part == 0) & (np.abs(X - cx) < 1.4 * hw))[wb:int(cy) + 1]
    for sg in (-1, 1):                                       # each leg: down from the crotch while the row is mostly cloth
        for y in range(int(cy) + 1, hh):
            xs = np.nonzero((part[y] == 3) & ((np.arange(ww) - cx) * sg > 0))[0]
            if not len(xs) or garment[y, xs].mean() < 0.5: break
            area[y, xs] = True
    bare = a & ~garment & ~hair
    n, lab = cv2.connectedComponents(bare.astype(np.uint8), connectivity=8)
    edge = cv2.dilate((~a).astype(np.uint8), np.ones((5, 5), np.uint8)) > 0   # bare skin at the outline (hips beside high-cut shorts)
    outside = np.unique(lab[bare & (~area | edge)])
    patches = bare & area & ~np.isin(lab, outside)
    return garment | patches

def hairless(rgba, sex):
    """The figure's silhouette without hair (a ponytail or loose strands would read as extra limbs): the largest piece."""
    m = (rgba[:, :, 3] > 127) & ~hair_mask(rgba, sex)
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
            if mid and mid[0][1] - mid[0][0] >= 0.15 * H \
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
        ay, ax = np.nonzero(a); a0, a1 = ay.min(), ay.max()
        def centre_at(f):
            y = int(a0 + f * (a1 - a0)); xs_ = np.nonzero(a[y])[0]; return (float(xs_.mean()), y)
        L['elbow' + side] = centre_at(0.36)
        L['wrist' + side] = centre_at(0.78)
        L['hand' + side] = centre_at(0.97)
    bm = lab == body
    bw = np.array([(r[-1][1] - r[0][0]) if (r := runs(bm[y])) else 0 for y in range(bm.shape[0])])
    # crotch: first row (from the hips down) where the body splits into two legs
    crotch = None
    for y in range(int(top + 0.42 * H), int(top + 0.7 * H)):
        if len(runs(bm[y])) >= 2: crotch = y; break
    if crotch is None: raise RuntimeError('no crotch found')
    L['crotch'] = (cx, crotch)
    wy = min(range(armpit + 5, int(armpit + 0.6 * (crotch - armpit))), key=lambda y: bw[y]); r = runs(bm[wy])
    L['waistL'], L['waistR'] = (r[0][0], wy), (r[-1][1], wy)
    hy = max(range(wy, crotch), key=lambda y: bw[y]); r = runs(bm[hy])
    L['hipL'], L['hipR'] = (r[0][0], hy), (r[-1][1], hy)
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
TOP = 0.6     # in the torso frame (neck base 0, crotch 1): clothing above this is a top, below it shorts
# muscles that may show over clothing, and on which garment; the rest are cut at the clothing's edge
THROUGH = {('m', 'front'): {}, ('f', 'front'): {'chest': 'top'},
           ('m', 'back'): {'glutes': 'shorts'}, ('f', 'back'): {'glutes': 'shorts', 'traps': 'top', 'rhomboids': 'top', 'lats': 'top'}}

def load_anatomy():
    s = open(os.path.join(ROOT, 'anatomy.js'), encoding='utf8').read()
    return json.loads(s[s.index('{'):s.rindex('}') + 1])

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
        r = runs(self.m[int(np.clip(round(y), 0, self.m.shape[0] - 1))])
        if part == 0:
            if y <= self.L['armpitL'][1]: return (r[0][0], r[-1][1])
            return min(r, key=lambda s: 0 if s[0] <= self.cx <= s[1] else min(abs(s[0] - self.cx), abs(s[1] - self.cx)))
        out = -1 if side == 'L' else 1
        own = [s for s in r if ((s[0] + s[1]) / 2 - self.cx) * out > 0 and not (s[0] <= self.cx <= s[1])] or r
        if part in (1, 2): return own[0] if side == 'L' else own[-1]
        return min(own, key=lambda s: 0 if s[0] <= x_hint <= s[1] else min(abs(s[0] - x_hint), abs(s[1] - x_hint)))

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

def regions_for(crop, T, tb, view, sex):
    """The template's muscles on this drawing, cut to where they can glow: not over hair, head, hands or feet, and not
    over clothing unless the muscle shows through it."""
    FT, (vx, vy, k) = tb
    a = crop[:, :, 3] > 127
    FA = Body(hairless(crop, sex))
    L, H = FA.L, FA.H
    Y, X = np.mgrid[0:a.shape[0], 0:a.shape[1]]
    hair = cv2.dilate(hair_mask(crop, sex).astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
    garment = whole_shorts(garment_mask(crop), a, hair, L, FA.part)
    body = a & ~hair & (Y > FA.ny - (0.01 if view == 'front' else 0.05) * H)    # from behind the traps run up the neck
    for s in 'LR':
        hx, hy = L['hand' + s]; body &= ((X - hx) ** 2 + (Y - hy) ** 2) > (0.055 * H) ** 2
    body &= Y < max(L['ankleLo'][1], L['ankleRo'][1]) + 0.01 * H
    V = (Y - FA.ny) / (FA.cy - FA.ny)
    out = []
    for mu in T['muscles']:
        key = mu['key']; where = THROUGH[sex, view].get(key)
        cloth_ok = (garment & ((V < TOP) if where == 'top' else (V > TOP))) if where else np.zeros_like(body)
        ok = body & (~garment | cloth_ok)
        for d in mu['d']:
            for p in path_polys(d):
                q = np.array([FA.from_body(*FT.to_body(x, y)) for x, y in (p - [vx, vy]) * k])
                mk = np.zeros(a.shape, np.uint8); cv2.fillPoly(mk, [q.round().astype(np.int32)], 1)
                mk = cv2.medianBlur((mk.astype(bool) & ok).astype(np.uint8) * 255, 5)
                cs, _ = cv2.findContours(mk, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
                out += [{'key': key, 'name': NAMES[key], 'd': 'M' + ' L'.join('%d %d' % (x, y) for x, y in cv2.approxPolyDP(c, 1.0, True)[:, 0, :]) + ' Z'}
                        for c in cs if cv2.contourArea(c) >= 0.00008 * H * H]
    return out, L

# ---------------------------------------------------------------- main
def main(out=None):
    """Reads art/src, writes art/chars/*.webp and characters.js. With `out`, also a debug PNG and JSON per figure."""
    art, chars = os.path.join(ROOT, 'art', 'src'), os.path.join(ROOT, 'art', 'chars')
    os.makedirs(chars, exist_ok=True)
    if out: os.makedirs(out, exist_ok=True)
    report, app = {}, {}
    A = load_anatomy()
    # debug colours (BGR), picked so neighbouring muscles differ
    pal = dict(zip(REGIONS, [(60, 60, 230), (60, 220, 170), (230, 200, 60), (200, 60, 220), (40, 140, 250), (80, 210, 80),
                             (250, 150, 110), (180, 100, 255), (40, 90, 160), (60, 230, 160), (220, 160, 170), (160, 40, 160),
                             (40, 200, 240), (150, 200, 60), (200, 80, 120), (130, 90, 230)]))
    for sx in 'mf':
        imgs = {b: np.array(Image.open(os.path.join(art, '%s-%s.png' % (sx, b))).convert('RGBA')) for b in BUILDS}
        for vi, view in enumerate(('front', 'back')):
            T = A[sx][view]; tb = template_body(T)
            halves = {b: im[:, :768] if vi == 0 else im[:, 768:] for b, im in imgs.items()}
            # one canvas for the three builds: union bounding box plus a margin, so swapping builds does not jump
            ys, xs = np.nonzero(np.any(np.stack([h[:, :, 3] > 8 for h in halves.values()]), 0))
            pad = 14
            y0, y1 = max(0, ys.min() - pad), min(1024, ys.max() + pad + 1)
            x0, x1 = max(0, xs.min() - pad), min(768, xs.max() + pad + 1)
            for b in BUILDS:
                crop = np.ascontiguousarray(halves[b][y0:y1, x0:x1])
                name = '%s-%s-%s' % (sx, b, view)
                regions, L = regions_for(crop, T, tb, view, sx)
                report[name] = sorted(set(r['key'] for r in regions))
                Image.fromarray(crop).save(os.path.join(chars, name + '.webp'), 'WEBP', quality=88, method=6)
                app.setdefault(sx, {}).setdefault(b, {})[view] = {
                    'w': int(x1 - x0), 'h': int(y1 - y0), 'img': 'art/chars/' + name + '.webp',
                    'feet': int(max(L['footL'][1], L['footR'][1])), 'regions': [[r['key'], r['d']] for r in regions]}
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
            print('%s-%-9s front %-2d back %-2d %s' % (sx, b, len(f), len(k), 'MISSING ' + ', '.join(missing) if missing else 'all 16'))
            if missing: raise SystemExit('some muscles would never light up')
    with open(os.path.join(ROOT, 'characters.js'), 'w', encoding='utf8', newline='\n') as f:
        f.write('// Arise characters, built by tools/prepare-characters.py from the art in art/src. Do not edit by hand.\n'
                '// Per sex, build and view: canvas size, image, the line under the feet (for the summoning circle), the muscle\n'
                '// shapes as [body-map key, SVG path in the image\'s pixels] (MuscleMap\'s traced muscles, fitted to the art).\n'
                'window.ARISE_CHARS = ' + json.dumps(app, separators=(',', ':')) + ';\n')
    kb = lambda p: os.path.getsize(p) / 1024
    print('characters.js %.0f KB, images %.0f KB' % (kb(os.path.join(ROOT, 'characters.js')), sum(kb(os.path.join(chars, n)) for n in os.listdir(chars))))

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else None)
