# Third-party notices

## MuscleMap (traced muscle path data in `anatomy.js`)

https://github.com/Jsplice/MuscleMap

Male and female figures, front and back, from the `@musclemap/assets` 1.1.0 package. The female figure's proportions
are adjusted with a smooth reshape of the traced paths (`tools/build-anatomy.js`); the styling (aura, eyes, summoning
circle) is drawn by Arise on top of the paths.

MIT License

Copyright (c) 2026 Jsplice / MuscleMap contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Strength Level (strength standards in `standards.js`)

https://strengthlevel.com/strength-standards

The Beginner / Novice / Intermediate / Advanced / Elite thresholds are calibrated to Strength Level's published
1RM standards by bodyweight (retrieved 2026-10-13). Their standards are computed from lifts logged by their users,
so the levels are percentiles among people who lift and log their lifts, not the general population. Arise stores
five bodyweight anchors per sex for 22 lifts and interpolates between them (`tools/build-standards.js`). The data
belongs to Strength Level. It is used here with credit in a personal, non-commercial app; their reuse terms could
not be located, so obtain permission or replace the data before any commercial use.

## CDC National Health Interview Survey, 2020 (share of adults who strength train)

https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9098242/

Percentage of adults meeting the federal muscle-strengthening guideline, by sex and age band. Used only for the
"estimated against all men/women" line, which is labelled as an estimate in the app. Public domain (US government work).

## Fonts

Geist and Geist Mono by Vercel, SIL Open Font License 1.1, served from Google Fonts.
