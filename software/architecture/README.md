# RoboCore platform — system design & architecture (Figma)

**Figma file:** [RoboCore Platform — System Architecture](https://www.figma.com/design/N5czZShIJEReXPGxUwvJpk) (Drafts)

This folder contains the system design and architecture documentation for the whole RoboCore platform: the robot kit, its controller board and firmware, the RoboCore IDE, the compile server, and the people and partners around them. The diagrams are drawn as UML (use case, component, class, sequence, state machine, activity, deployment, composite structure) and C4 (context, containers). They use the same look as the IDE design: navy, yellow and cream, with Barlow type.

Everything is taken from the real sources as they were on 18 October 2026:

| Source | What it gave |
|---|---|
| `robocore-ide` (github.com/Plastal-Bot-Builders/robocore-ide) | Flutter app layers and classes, the compile server API and Docker image, the USB bridge, the RoboCore Arduino library, CI workflows, the V2 pin map |
| `RoboCore_V2/docs` (RoboCore_V2_spec.md, costing, errata) | Board block diagram, power tree, parts, battery runtime |
| `RoboCore_V2/mech/robot` (Fusion rev 5) | Robot parts and how many of each |
| `RoboCore_IDE_Design` (Figma IDE design) | Cog (the planned AI learning partner) and its rules |
| Grant drafts (MIT Solve, timbuktoo) | Users, buyers, delivery model, what is built vs planned |

## What's in the file

| Page | Diagrams |
|---|---|
| 00 — Read me | Cover, page index, notation key, status (works today / waits for the board / planned), sources |
| 01 — Context & use cases | 1.1 C4 system context · 1.2 UML use cases of the IDE |
| 02 — Containers & deployment | 2.1 C4 containers (browser, cloud, board, GitHub) · 2.2 UML deployment (nodes and artifacts, incl. the flash layout) |
| 03 — IDE app | 3.1 UML components (layers of `lib/`) · 3.2 class diagram: projects, blocks, boards · 3.3 class diagram: building, uploading, preview board |
| 04 — Key flows | 4.1 sequence: upload to a real V2 · 4.2 sequence: run on the preview board · 4.3 sequence: connect, unplug, reconnect |
| 05 — State machines | 5.1 USB link · 5.2 build and upload status · 5.3 Blocks vs C++ (who drives the code) |
| 06 — Firmware & hardware | 6.1 firmware stack + library-to-pins table · 6.2 power tree · 6.3 ESP32-S3 signal map · 6.4 robot parts · 6.5 single pin map and generated code |
| 07 — Build, release & kits | 7.1 CI/CD activity · 7.2 board design pipeline · 7.3 kit lifecycle (parts to classroom) |
| 08 — Cog & roadmap | 8.1 proposed Cog components · 8.2 proposed "explain an error" sequence · 8.3 roadmap table |
| 09 — Decisions & glossary | 9.1 architecture decision records · 9.2 glossary |
| 10 — Assets | Icon and logo components used by the diagrams |

**Notation:**
- **Outlines:** solid = built by us; dashed = third party; dotted on yellow = planned or design only; navy = hardware.
- **Icon colours:** the small icon tile on each element shows which part of the platform it belongs to (the IDE's block-category inks).

## Rebuilding

A local Figma development plugin generates the file, the same way the IDE design file is built:

1. In Figma desktop, open the file and choose **Plugins → Development → Import plugin from manifest…**, then pick `figma-plugin/manifest.json`. This is a one-time step.
2. Run **Plugins → Development → RoboCore Architecture Builder**:
   - **Build into empty file** for a new file.
   - **Rebuild — replace the generated pages** to regenerate. This replaces manual edits on those pages; version history keeps the old version.

Source code: `figma-plugin/src/*.js`.
- `04_kit.js` is the diagram toolkit: elements, boundaries, routed connectors and the UML shapes.
- `10_cover.js` to `19_decisions.js` hold one page each.
- `00_*`–`03_*` are copied from the IDE design builder: tokens, type, icons and box art.

Commands:
- `./build.sh` builds `code.js`.
- `node test/run.js` dry-runs it against a Plugin API mock. It also fails if the code contains the text `import(`, which Figma's sandbox refuses to run.
- `python3 test/review_server.py <folder>` collects PNG previews of every diagram during a real run.

To change a diagram, edit its spec in the page file and rebuild. Connectors are routed from the elements' real positions, so moving an element in the spec moves its arrows too. Lines drawn in Figma don't follow when you drag boxes by hand.

## Things to keep in mind

- **Built vs planned:** Cog, lessons and teacher training, USB on the native apps, Uno upload from the browser, and kit assembly in Zambia at scale are shown as planned. Everything that touches the real board is tested without hardware until the first V2 boards arrive.
- **Framing:** RoboCore is described as *designed in Zambia*. The boards, motors and most parts come from China, and making them in Zambia is a goal.
- **Keep it current:** when the IDE, the library or the board changes, update the matching page spec and rebuild.
