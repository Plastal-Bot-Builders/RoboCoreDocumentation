# RoboCore IDE — app icon

**Figma file:** [RoboCore IDE — App Icon](https://www.figma.com/design/iRjn3CoZ15WsLe4NBA4pGU) (Drafts, Plastal-Bot Builders team). It has one page per round:

| Page | Master | Style |
|---|---|---|
| **Round 3 · Geared Ring** (newest, **final**, confirmed by Fred 2026-10-19) | `CONCEPTS.gearring` | A smooth planet whose ring is the RoboCore gear seen edge-on (12 teeth, squashed to 42 %, tilted 20°). The ring passes in front of the planet with a 22 px cut gap and hides behind it. One ink: navy on yellow, or yellow on navy, with no gradients or shadows. Fred picked this from four sketches based on his planet-logo reference sheet. |
| **Round 2 · Forward Gear** | `CONCEPTS.slant` | The RoboCore gear, sharpened: 8 teeth leaning 7°, a `>` prompt cut through the hub, and a hard "/" facet of light. Yellow plate with sheen and depth. |

Round 1 (Core Brackets, Open Cog, Bot Prompt) and the rejected sketches (Ratchet, Spike Gear, Orbit Gear) appear as history cards on the pages. `orbit-gear-preview.png` and `planet-gear-directions.png` here are the previews shown to Fred while choosing round 3.

## What's on the page

| Frame | Contents |
|---|---|
| **App icon — <round>** (docs) | Header (before → after), Concepts (the round's variants, the references, other rounds), Master and construction (keylines + layer/colour spec), Appearances (Default, Dark, Tinted, Clear, Mono glyph), Sizes and the small glyph, Platforms (macOS, iOS/iPadOS, Android, Windows, Linux, Web/PWA, each with rules and a mock-up), Export map |
| **App icon — components** | `App icon/Glyph` (master, 1024 canvas, drawn for the 824 plate), `App icon/Glyph · Small` (16–32 px), component set **App icon** (Appearance Default/Dark/Tinted/Clear × Shape macOS/Square/Rounded, plus Default × Maskable), **App icon · Small** (Default/Dark × macOS/Rounded) |
| **App icon — exports (real size)** | 37 frames named after their path in the robocore-ide repo, with PNG/SVG export settings. Select them and press Export. |

Every icon on the page is an instance. If you edit the shape in the two Glyph components, all variants, mock-ups and exports update with it. The appearance colours are instance overrides.

## Shapes

- **macOS**: 1024 canvas with an 824 × 824 squircle plate (radius 185.4, corner smoothing 60 %, 100 px margin) and a drop shadow inside the canvas.
- **Square**: full bleed and opaque. Used for iOS, the Android background and Play Store icons, the maskable PWA icon and apple-touch-icon; the system rounds it.
- **Rounded**: a full-canvas squircle (radius 229, smoothing 60 %). Used for Windows, Linux, the favicon and the PWA "any" icon.
- **Maskable**: full bleed, with the glyph shrunk to fit the 80 % safe circle. Used for the PWA maskable icon.

On Square and Rounded the glyph's farthest point stays within 450 px of the centre, and on Maskable within 410 px; `AI_VERSIONS[*].extent` in the builder gives each master's radius. This matters for the Geared Ring, whose teeth reach further out than the gear's.

## Files here

- `geom.js`: path geometry: gear (with tooth lean), ratchet, burst, chevrons, ellipse arcs, polygon clipping (half-plane, curve and circle boundaries) and a Figma-style squircle. It outputs only absolute `M/L/C/Z` commands, so the same strings work in SVG and in Figma vectors.
- `concepts.js`: all concepts. Each has `.defaults` (the master proportions) and `.small` (the 16–32 px glyph). The builder's `AI_VERSIONS` in `icon-plugin/src/12_app_icon.js` maps each round to its master, its looks and its page.
- `preview.js`: renders concept sheets to PNG with headless Chrome: `node preview.js <out-dir>`.
- `before_png.js`: the current icon (robocore-ide `web/icons/Icon-512.png`), embedded for the "Before" card.

## Rebuilding the Figma page

The generator is a separate dev plugin, `../icon-plugin`, so it never touches the IDE design builder (`../figma-plugin`) or its file.

1. `sh ../icon-plugin/build.sh` (dry run: `cd ../icon-plugin && node test/run.js`).
2. Optional: start the review server with `python3 ../icon-plugin/test/review_server.py <out-dir>`. It listens on 127.0.0.1:8765 and receives PNG previews and `report.json`.
3. In Figma desktop, open the App Icon file. Use Actions (bottom toolbar), search "RoboCore App Icon", and pick **Build all rounds**, **Round 2 · Forward Gear only** or **Round 3 · Geared Ring only**. The plugin is already imported from `icon-plugin/manifest.json`.

Each command rebuilds its round's page from scratch, so manual edits there are lost; version history keeps the old version. The builder refuses to run in a file that has other content.

`icon-plugin/src/01_core.js` and `02_tokens.js` are snapshots of the IDE builder's helpers. The page uses the same text styles and colour variables as the IDE design file.

## In the app

Geared Ring is in robocore-ide on branch `app-icon-geared-ring`, which is not pushed: commit 4a83fb9 has the icons on every platform, and 1784eb1 the in-app logo. `tools/gen_app_icons.py` there runs `tools/app_icon/layout.js`, which holds copies of `geom.js` and `concepts.js`. If the master here changes, re-copy them.
