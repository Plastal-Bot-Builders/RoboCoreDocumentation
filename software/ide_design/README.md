# RoboCore IDE — UI/UX design (Figma)

**Figma file:** [RoboCore IDE — UI/UX Design](https://www.figma.com/design/P7i2WBM8G96B2fTPHpp8yi) (Drafts, Plastal-Bot Builders team)

Design-phase deliverable only. No application code exists yet; the `figma-plugin/` folder is a design tool that generates the Figma file.

## Look: the RoboCore V2 box

The design uses the colours of the retail box (`RoboCore_V2/mech/robot/packaging`): **navy ink `#1B2A41`**, **RoboCore yellow `#F2B01E`** and **cream paper `#F7F1E3`**, plus the ochre of the box's contour lines for code values.

- Everything is navy or a navy tint on paper. Yellow marks the brand (top bar, hero) and what is active.
- There are no other hues. States are shown by fill, outline and icon: a filled dot means connected, a ring means not connected, and errors are inverted navy.
- Type is the box's Barlow Condensed for headings and Barlow for the interface; code uses JetBrains Mono.
- The box's navy line drawings (robot, board) and topography contours are reused in the file.
- Blocks use three roles instead of eight colours, drawn with a navy outline: **control** in yellow, **action** in navy, **value** in white with an outline.

## What's in the file

| Page | Contents |
|---|---|
| **01 — Foundations** | Box-style cover, colour (5 base colours + navy tints + contrast), type, the three block roles, button states, rules |
| **02 — Components** | Logo (single navy ink), icons, Button (3 variants × 4 states), Icon Button, Verify/Upload/Stop, Nav Item, Mode Switch, File/Panel Tab, Badge, Connection Status, Board Selector, Board Info, Board Menu, Input, Search, Select, Menu Item, Toggle, Checkbox, Radio, Tooltip, Toast, Avatar, Block Category, **27 blocks** (each lists the C++ it generates), Sidebar, Top Bar, Status Bar, Project/Example cards, Template Tile, 2 dialogs |
| **03 — Main IDE** (1440 × 1000) | Blocks · Code · Board selector · console collapsed (Blocks / Code) · Project settings · Uploading · Upload failed · No board connected |
| **04 — Additional Screens** | Home · Home + New project · Projects · Projects empty · Examples · Libraries · Board Setup · Serial Monitor · Settings |
| **05 — Prototype** | 14 linked frames, 117 click interactions, 6 flows: open a project, Blocks ↔ Code, board selector, serial monitor collapse, Examples, project settings |

**Variables:** `Primitives` (hidden), `Color` (mode *Paper*), `Dimensions`. There are 98 in total, and the v1 dark palette was removed. Text in the file passes contrast on paper: primary 13.6:1, secondary 5.8:1, meta 4.7:1, ochre 5.8:1. Yellow is never used for text.

## Rebuilding

The Figma MCP on the Starter plan has a monthly call limit, so a local development plugin generates the file:

1. In Figma desktop, open the file and go to **Plugins → Development → Import plugin from manifest…**, then choose `figma-plugin/manifest.json`. This is a one-time step.
2. Go to **Plugins → Development → RoboCore IDE Design Builder**:
   - **Build into empty file** for a new file.
   - **Rebuild — replace the 5 generated pages** to regenerate. This replaces manual edits on those pages; Figma's version history keeps the old version.

The source is in `figma-plugin/src/*.js`:
- `./build.sh` builds `code.js`.
- `node test/run.js` dry-runs it against a Plugin-API mock.

The first, dark-theme version is kept in `figma-plugin/archive/v1-dark/`.

## Limitations

- **One theme only.** The Starter plan allows one mode per collection; a "Navy" theme is marked Planned in Settings.
- **Desktop size only.** Responsive sizes are not drawn.
- **Prototype pop-ups are full frames.** The board menu and dialogs are full-frame prototype states, not Figma overlays.
- **The V2 specs need re-checking** once the PCB is fabricated. That covers the "Prototype · rev 2.0" label too.
