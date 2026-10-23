# RoboCore IDE — UI/UX design (Figma)

**Figma file:** [RoboCore IDE — UI/UX Design](https://www.figma.com/design/P7i2WBM8G96B2fTPHpp8yi) (Drafts, Plastal-Bot Builders team)

Design-phase deliverable only. No application code exists yet; the `figma-plugin/` folder is a design tool that generates the Figma file.

## Look: the RoboCore V2 box

The design uses the colours of the retail box (`RoboCore_V2/mech/robot/packaging`): **navy ink `#1B2A41`**, **RoboCore yellow `#F2B01E`** and **cream paper `#F7F1E3`**, plus the ochre of the box's contour lines for code values.

- Everything is navy or a navy tint on paper. Yellow marks the brand (top bar, hero) and what is active.
- The interface has no other hues. States are shown by fill, outline and icon: a filled dot means connected, a ring means not connected, and errors are inverted navy.
- Type is the box's Barlow Condensed for headings and Barlow for the interface; code uses JetBrains Mono.
- The box's navy line drawings (robot, board) and topography contours are reused in the file.
- **Logo:** the app mark is the **Geared Ring** from the final app icon (Figma [RoboCore IDE — App Icon](https://www.figma.com/design/iRjn3CoZ15WsLe4NBA4pGU), round 3, confirmed 2026-10-19): a planet whose ring is the RoboCore gear, in one ink. The top bar shows it in front of the official RoboCore wordmark and "IDE" (`Logo/Product Lockup`). The Welcome card and the About dialog show one logo only: the app icon itself (`Logo/App Icon`, navy on yellow). Cog keeps the plain gear (`Logo/Gear`). The shapes come from `app-icon/concepts.js`; if the icon changes, run `node figma-plugin/tools/app_mark.js` and rebuild.
- **Blocks are the one exception.** Learners find blocks by colour, so each category has its own print-like ink. Every block keeps the box's navy line-art outline, and shape still shows how a block fits.

**Hardware-first blocks (2026-10-20).** The block set follows the idea behind LEGO SPIKE Prime's word blocks (not their art). Blocks name what the robot does: "move forward for 10 cm", "turn right for 90°", "when obstacle is closer than 20 cm". Each action has a "for …", a "start …" and a "stop" form. Each sensor has a value, a yes/no question and a "when …" hat. RoboCore V2 has everything built in, so there are no port dropdowns (only servos 1–4).

There are 74 blocks in 10 categories. [`docs/block-catalogue.md`](docs/block-catalogue.md) lists each block with the C++ it generates and the RoboCore library helper it needs; 31 of them need a new helper.

| Category | Colour | Label | For |
|---|---|---|---|
| Events | box yellow `#F2B01E` | navy | on start, forever, when … hats |
| Movement | cobalt `#2F6BBF` | cream | move, turn, steer, speed (both wheels) |
| Motors | brick `#B84A26` | cream | one wheel motor; servos 1–4 |
| Light & Sound | violet `#7A4FB5` | cream | RGB LED, buzzer |
| Sensors | teal `#0F7680` | cream | distance, line, tilt, button, battery, timer |
| Control | ochre `#8A5A00` | cream | wait, repeat, if, wait until |
| Operators | green `#2F7A4C` | cream | maths, compare, and / or / not, text |
| Variables | berry `#B23E7A` | cream | set, change, read |
| My Blocks | slate `#5B6577` | cream | your own blocks (functions) |
| Pins & Serial | box navy `#1B2A41` (dark mode `#3E5A86`) | cream | expansion pins, serial |

  Cream labels pass 4.5:1 on every colour, and navy on yellow is 7.6:1. The colours appear only on blocks, on the toolbox category chips and on project thumbnails.

## Dark mode ("Navy")

The box inverted: navy surfaces (`#121E31` app, box navy `#1B2A41` panels), cream ink `#F7F1E3`, the same RoboCore yellow. Line art switches to cream, and contour lines to a dim ochre. Contrast on navy: cream 12.8:1, secondary 8.4:1, meta 5.6:1, yellow 7.6:1.

- Page **06 — Dark Mode** holds dark copies of all 21 screens and a palette header.
- Block colours stay the same, except Communication, which lifts to `#3E5A86` so it stands off the navy canvas.
- Text and icons that sit on yellow, cream or white (Control blocks, field pills, Brand badge, Cog mark) use `color/text/on-bright` and `color/icon/on-bright`, which stay navy in both themes.
- If the plan allows a second variable mode, the builder adds a **Navy** mode to `Color` and the dark frames switch to it.
- On the current plan (one mode per collection), the builder creates a parallel **Color · Navy** collection and re-binds every paint in the dark copies to it.

## Cog — AI coding assistant and learning partner

Cog (working name, after the gear in the logo) helps learners while they code, and is designed as a **learning partner, not an answer machine**:

- **Ask Cog** (top bar, ⌘I) opens a panel beside the editor. Chips show exactly what Cog can see: the file and line, the Output, and the board.
- **Errors:** compile and upload errors get an **Explain** action, both in the Output and as an inline lens on the line. Cog then works through four steps:
  1. It explains the problem without giving the answer away.
  2. It offers **one hint at a time**.
  3. It shows the fix as a diff only when asked, and nothing changes until **Apply** (undo with ⌘Z).
  4. It ends with a one-question **quick check**.
- **Learning:** in Blocks mode Cog does three things:
  - it explains the selected block and shows the C++ it becomes;
  - it gives a "Try it" challenge;
  - it tracks the concepts learned.
- **Settings → Cog:**
  - help style: Hints first (default), Explain the answer, or Write code for me (off for students; teachers can lock it);
  - explanation level;
  - whether Cog may read the project;
  - an offline note: Cog needs the internet, but coding, Verify, Upload and the Serial Monitor don't.

Making Cog real will need a language-model backend, privacy choices for student code, and a plan for classrooms with limited internet. None of that is part of this design.

## Blockly and Monaco

The IDE is built on **Google Blockly** (blocks) and **Monaco** (code), so the design draws what those libraries draw, themed with the RoboCore tokens:

- **Blockly (13.x, Zelos renderer)**
  - **Toolbox:** a category toolbox with colour chips. The flyout opens *over* the workspace and closes after a drag.
  - **Workspace controls:** zoom controls at the bottom right (reset, then zoom in, then zoom out) with the trashcan under them. Thin scrollbars, a dotted grid, and a yellow selection outline.
  - **Context menus:**
    - Block: Duplicate, Copy, Add Comment, Collapse Block, Disable Block, Delete Block, Help.
    - Workspace: Undo, Redo, Paste, Clean up Blocks, Collapse Blocks, Expand Blocks, Delete N Blocks.
  - **Fields and blocks:** dropdown and number field editors, comments, collapsed and disabled blocks, and the "Create variable…" button.
- **Monaco**
  - **Editor:** glyph margin, line numbers, folding, indent guides, and an overview ruler with the scrollbar slider. Minimap is off.
  - **Widgets:** autocomplete (suggest widget with docs), parameter hints, hover cards, the error hover with Quick Fix… and Explain with Cog, the lightbulb and code actions, and the find widget.
  - **Banner above the editor:** says whether the C++ still follows the blocks (Generated), was typed by hand (Edited, with *Rebuild from blocks*), or is a C++-only project.
- **Handoff tables** on page 07 map every colour to Blockly theme keys (`blockStyles`, `categoryStyles`, `componentStyles`, `fontStyle`) and Monaco theme keys (`editor.*`, `editorSuggestWidget.*` and so on), plus the workspace and editor options to set.

## Fully wired prototype

Page **05 — Prototype** has a frame for every state the IDE can be in, and every control is wired as the behaviour spec says. The plan is Starter, so:

- **Screens are frames.** Verify, each Upload step and the preview board's blink move on by themselves ("after delay").
- **Menus, popovers, dialogs, the browser's port chooser and toasts are overlays.** They are full-screen transparent frames, so they line up with any screen.
- **Interactive components handle the rest**, so it works on every screen: hover, tooltips, toggles, radio groups, every dropdown, console tabs, Clear and Send, the Blockly toolbox, Cog's steps, the preview board's USER button, and library installs.
- **11 flows** are set up:
  1. First start
  2. Home, projects and examples
  3. Blocks editor (Blockly)
  4. Code editor (Monaco)
  5. Fix a compile error with Cog
  6. Upload fails
  7. No board connected
  8. Preview board (no hardware)
  9. Learn with Cog
  10. Board setup and connect
  11. Settings

**Limits:**
- Without prototype variables (paid plans only), a choice made on one screen is not carried to the next.
- Right-click is a plain click.
- The Navy theme is shown statically on page 06.

## Behaviour spec and test checklist

Page **07 — Behaviour Spec** lists every control in **139 test cases** across 16 areas (ID, control, what you do, what must happen, where to try it in the prototype, and a Pass box). It also holds the Blockly and Monaco handoff, implementation notes, and what the prototype cannot do.

The same data is in [`docs/behaviour-spec.md`](docs/behaviour-spec.md). It comes from `figma-plugin/src/10d_spec_data.js` via `node figma-plugin/tools/spec_md.js`, so edit the data file, not the Markdown.

## What's in the file

| Page | Contents |
|---|---|
| **01 — Foundations** | Box-style cover, colour (5 base colours, navy tints, contrast), type, the ten block category colours, button states, rules |
| **02 — Components** | Everything below, with interactions on the components themselves.<br>**Brand and controls:** logo (Geared Ring mark, large mark, app icon, wordmark, product lockup, Cog gear), icons, Button, Icon Button (with tooltips), Verify / Upload / Stop, Nav Item, Mode Switch, tabs, Badge, Connection Status, Board Selector / Info / Menu, inputs, **interactive dropdowns** (baud, port, board, line ending, font size, language, level, CPU, partition), Menu Item, Toggle, Checkbox, Radio, **choice groups** (mode, Cog help style, theme), Library Action, Server Test, Tooltip, Toast, Avatar.<br>**Cards and dialogs:** project / example / template cards (hover), dialogs.<br>**Blocks:** Block Category and 74 blocks in 10 categories.<br>**Blockly:** palette (toolbox + flyout, 9 states), zoom, trashcan.<br>**Monaco:** code banner, find widget.<br>**Panels:** Console Panel (17 scenarios × 3 tabs), Cog Panel (9 steps), Preview Board.<br>**Cog parts and app chrome:** the Cog pieces, Sidebar, Top Bar, Status Bar. |
| **03 — Main IDE** (1440 × 1000) | 19 key states, including the robot blocks (an obstacle avoider with the Movement flyout open), the Blockly block menu, a field dropdown, the trash flyout, Monaco autocomplete, the error hover and quick fix, and the preview board running |
| **04 — Additional Screens** | Home, New project, Projects, Projects empty, Examples, Libraries, Board Setup (connected and not), Serial Monitor, Settings (profile, Cog, theme, editor, compile server, general), Welcome |
| **05 — Prototype** | 80 state frames and 65 overlays, about 2,600 interactions, 11 flows (above). Long pages (Settings) scroll inside the main area |
| **06 — Dark Mode** | Navy palette header plus dark copies of every IDE and additional screen |
| **07 — Behaviour Spec** | 139 test cases, Blockly and Monaco handoff, implementation notes, prototype limits |

**Variables:** `Primitives` (hidden), `Color` (mode *Paper*), `Dimensions`, and the parallel `Color · Navy` collection for dark mode, 143 in total. Text passes contrast on paper: primary 13.6:1, secondary 5.8:1, meta 4.7:1, ochre 5.8:1. Yellow is never used for text.

## Rebuilding

The Figma MCP on the Starter plan has a monthly call limit, so a local development plugin generates the file:

1. In Figma desktop, open the file and go to **Plugins → Development → Import plugin from manifest…**, then choose `figma-plugin/manifest.json`. This is a one-time step.
2. Go to **Plugins → Development → RoboCore IDE Design Builder**:
   - **Build into empty file** for a new file.
   - **Rebuild — replace the 5 generated pages** to regenerate. Despite the menu name, it replaces all seven generated pages (01–07). This replaces manual edits on those pages; Figma's version history keeps the old version.

The source is in `figma-plugin/src/*.js`:
- `./build.sh` builds `code.js`.
- `node test/run.js` dry-runs it against a Plugin-API mock (`MOCK_MODES=1` tests the variable-modes path).
- `node tools/spec_md.js` writes `docs/behaviour-spec.md` from the spec data.
- `python3 test/review_server.py <folder>` collects PNG previews of every screen during a real run.

The first, dark-theme version is kept in `figma-plugin/archive/v1-dark/`.

## Limitations

- **Dark mode copies.** On the Starter plan the dark frames are re-coloured copies (bound to `Color · Navy`), not one set of frames switching modes. Editing a component's structure updates both; colour edits need a rebuild.
- **Desktop size only.** Responsive sizes are not drawn.
- **Prototype memory.** The Starter plan has no prototype variables, so choices don't carry between screens (see page 07, “What the Figma prototype cannot do”).
- **The V2 specs need re-checking** once the PCB is fabricated. That covers the "Prototype · rev 2.0" label too.
