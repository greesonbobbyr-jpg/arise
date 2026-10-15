# Character art

The hunters on the Progress tab, the setup screen and the ARISE moments are illustrations, not drawings in code.

| Folder | What |
|---|---|
| `src/` | The six source sheets, made by the app's author in ChatGPT with the prompts below: `{m,f}-{lean,athletic,powerful}.png`, 1536 × 1024, transparent background, front view on the left half and back view on the right half |
| `chars/` | What the app loads: one WebP per sex, build and view (12 files), cut from `src/` by `tools/prepare-characters.py` |

`characters.js` (in the repo root) is generated with them: the canvas size, the image, the line under the feet for the summoning circle, the outline of the body below the neck, every muscle shape as an SVG path in the image's pixels tagged with its body-map region, and the plain panels that fill the rest.

## Rebuilding

```
python tools/prepare-characters.py [debug folder]
```

Needs Python 3 with `numpy`, `opencv-python-headless` and `pillow`. With a debug folder it also writes, per figure, the cut-out PNG, its regions as JSON with the landmarks, and a `-debug.png` with every region tinted and labelled. Bare patches show in red. It stops with an error if one of the 16 body-map regions would never light up (missing from both the front and the back view), or if more than 2% of a body is left bare between the muscles.

How the muscle map gets onto the art: the muscle shapes are the traced MuscleMap figures in `anatomy.js` (the ones the app drew before it had illustrated characters). His figure is the detailed one (glutes in parts, three hamstring heads, the muscles of the shoulder blades), so both characters take their muscles from it; hers keeps only its own chest. The same landmarks are found on the template and on each drawing (neck base, shoulders, armpits, elbows, wrists, hands, waist, hips, crotch, knees, ankles, feet), and every point of every muscle is moved by body part: on an arm or leg by how far along and across it is, on the torso by its height between those landmarks and how far across that row. So each muscle lands on the same place of the drawn body, in every build. Each muscle then grows a little into bare body around it (the drawn bodies are wider and curvier than the template), and what is still bare becomes plain panels that never light up, so the whole body from the neck to the wrists and ankles is covered and no gym clothes show. A thin dark seam runs wherever two pieces meet. Where a hand rests on a thigh, the hand is traced from the wrist so it stays the drawing's and the thigh is measured without it.

In the app, `charSVG()` in `index.html` draws the art dimmed into a cool shadow, the body's dark outline over it, every muscle dark with a cyan outline, and each trained muscle as a solid green shape (brighter with more sets) with a fibre texture, a soft highlight and a glow; and the violet aura from the art's own outline when every muscle was trained that week. The build follows Hunter rank (`buildFor` in `core.js`): lean at E and D, athletic at C and B, powerful at A and S.

## Making new art

A new sheet must keep the same layout, pose and framing, or the landmarks will not be found. One chat per character; paste the prompt, then reply "next" twice. If an image drifts (a different face, a cropped foot, a glow added), reply "redo image N, same face as image 1". Save image 1 as `athletic`, 2 as `lean`, 3 as `powerful`.

Male:

```
I need 3 images of the same original character, made one at a time. Make image 1 now. When I reply "next", make the next one. Keep the face, hair, outfit, pose, framing and art style identical in all 3; only the body build changes.

STYLE: Korean manhwa / webtoon action style, clean sharp line art, cel shading, cool moody palette.

LAYOUT (every image): a character turnaround sheet showing the same character twice, side by side at the same scale: FRONT view on the left, BACK view on the right. Full body, head to toes, nothing cropped. Landscape 3:2. Transparent background (if not possible, plain flat white). Even lighting. No glow, no aura, no effects, no text, no logos, no weapons.

CHARACTER: original male hunter, early 20s. Short messy jet-black hair with sharp bangs, sharp narrow dark eyes, calm intense expression, defined jaw and chin, visible neck and collarbones. Shirtless, black fitted training shorts to mid-thigh, black minimal training shoes. Readable muscle definition: chest, shoulders, biceps, triceps, forearms, six-pack abs, obliques, quads, calves; on the back: traps, lats, lower back, glutes, hamstrings, calves.

POSE: standing straight and symmetrical, facing directly forward (front) and directly away (back), arms hanging relaxed slightly away from the body, hands loosely closed, feet shoulder-width apart.

BUILDS, in this order:
1. Athletic and clearly muscular (lean, not a bodybuilder).
2. Leaner and less muscular: a beginner who just started training.
3. Significantly more muscular and defined: broader shoulders, bigger arms and chest, deeper abs. A peak athlete, still athletic rather than bulky.
```

Female:

```
I need 3 images of the same original character, made one at a time. Make image 1 now. When I reply "next", make the next one. Keep the face, hair, outfit, pose, framing and art style identical in all 3; only the body build changes.

STYLE: Korean manhwa / webtoon action style, clean sharp line art, cel shading, cool moody palette.

LAYOUT (every image): a character turnaround sheet showing the same character twice, side by side at the same scale: FRONT view on the left, BACK view on the right. Full body, head to toes, nothing cropped. Landscape 3:2. Transparent background (if not possible, plain flat white). Even lighting. No glow, no aura, no effects, no text, no logos, no weapons.

CHARACTER: original female hunter, early 20s. Long blonde hair in a high ponytail, sharp eyes, confident calm expression, defined jaw, visible neck and collarbones. Black sports bra, black fitted training shorts, black minimal training shoes. Athletic, toned, feminine proportions with readable muscle definition: shoulders, arms, defined abs, obliques, strong glutes, quads, hamstrings, calves; on the back: traps, lats, lower back.

POSE: standing straight and symmetrical, facing directly forward (front) and directly away (back), arms hanging relaxed slightly away from the body, hands loosely closed, feet shoulder-width apart.

BUILDS, in this order:
1. Athletic and toned.
2. Leaner and less muscular: a beginner who just started training.
3. Significantly more muscular and defined, still clearly feminine.
```

The hair test in the script expects black hair for him and blonde for her; other colours need it adjusted. Clothing can be any colour, since the muscle map covers the body.
