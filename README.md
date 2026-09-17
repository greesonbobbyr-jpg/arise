# Arise

Personal strength-training PWA. Logs workouts Hevy-style, then tells you in plain English how much stronger you got and what to do when a lift stalls. Single user, no backend, all data on device.

## Files

| File | Purpose |
|---|---|
| `index.html` | The whole app: UI, styles, logic |
| `core.js` | Exercise library, strength standards, all analysis math (pure functions) |
| `anatomy.js` | Front and back muscle figure (traced paths from MuscleMap, MIT, see THIRD_PARTY.md) |
| `sw.js` | Service worker: precaches the shell so the app opens offline |
| `manifest.json` | PWA manifest (installable, standalone, dark) |
| `icons/` | 192, 512 and 512-maskable icons |
| `tests.js` | Math test suite (`node tests.js`) |

## Deploy to GitHub Pages

1. Create a repo and push these files to its root (or a `docs/` folder).
2. Settings → Pages → Source: the branch and folder you pushed to.
3. Open the Pages URL in Chrome on Android, then Menu → Add to Home screen (or use the Install button on the Profile tab).

Everything is relative-pathed, so it works from a subfolder like `username.github.io/arise/`.

The service worker is network-first: every open fetches the live files (bypassing the HTTP cache) and only falls back to the cached copy when offline or when the network takes more than 3.5 s. A deploy shows up on the very next open. Bump `APP_VERSION` in `index.html` (shown at the bottom of Profile) and `VERSION` in `sw.js` when you release, so you can tell versions apart.

## What's in v1.1

- **History**: recent workouts on the home screen, full history grouped by month, tap to expand sets, delete with confirmation.
- **Charts**: dated e1RM chart per lift with a dashed baseline; tap a lift card for its last eight sessions.
- **Rank means strength**: the Hunter letter (E to S) comes from your best strength tiers, not XP. The home card tells you exactly which lift and what e1RM gets the next rank. Level stays XP-driven.
- **Daily quest**: one concrete target a day (keep the streak, beat a shadow, break a stall, or just show up). Completing it in a workout adds 30 XP.
- **Shadow row**: each exercise shows your all-time best set. A row turns green as you type numbers that beat it.
- **Rank up**: a full-screen moment when your rank letter rises or a lift crosses a tier line.
- **Rank card**: Profile → Make card renders a shareable image with rank, level, streak and top lifts.
- **Streak shield**: one missed week per calendar month is forgiven, derived from your log, nothing to manage.
- **Screen wake lock** during workouts (toggle in Profile) and an optional rest-over notification. The notification is best-effort when the screen is off because Android may stop the service worker timer; the wake lock is the reliable fix.

## Try it with demo data

Open `index.html?demo` on a fresh install to seed eight weeks of sample workouts. Use Profile → Erase all data to clear it.

## Tests

```
node tests.js
```

Covers Epley (170×5 → 198, 170×8 → 215, +8.6%), bodyweight loads, the 14-day baseline window, stall detection and every prescription branch, percentile interpolation and caps, the readout generator, and the streak/level math.
