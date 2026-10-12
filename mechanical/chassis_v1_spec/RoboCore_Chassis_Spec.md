# RoboCore Zambia — Chassis Design Specification (Rev B.1)

---

## REV B.1 (2026-07-13) — refinement pass

Same plate architecture as Rev B; drivetrain and detailing reworked:

- **4-wheel skid-steer**: wheels at X ±75 both sides (wheelbase 150, track
  154, overall width 182). One TT gearmotor per wheel (4 total, real CAD
  instanced), bodies extending toward robot center along the plate inner
  faces; same-side bodies clear each other by 44 mm. Casters removed.
- **Two-piece traction wheels (Rev B.2, 2026-07-13)**: Ø70 over lugs × 26
  wide, **axle Z35**. Modeled once at the origin (axis +Y) and instanced 4×
  (right side Rz 180°). *Rim* (red plastic, injection-moldable): Ø63 flanges,
  Ø57 tire seat, 5 mm spoked web with 6 windows (6 spokes), Ø22 hub boss
  protruding from the face with Ø5.4 TT double-D bore, 4× Ø2.7 on Ø14 BC
  (encoder/hub-adapter provision), Ø11 inboard stem riding through the
  plate's Ø13 bore + Ø18×1.5 bearing flange (stem tip Y61 → 3.5 mm shaft
  engagement; stem r5.5 clears motor screw heads r5.75). *Tire* (TPU-
  printable, replaceable): 20 wide seated between the rim flanges, Ø57 bore,
  4.5 mm sidewall to the Ø66 carcass, 2 staggered rows of 12 traction lugs
  to Ø70. Wheel inner faces at Y ±65.
- **Axle raise consequences**: plate bores/flanges at Z35 (parametric), motor
  transforms gain +5 in Z — FL = Ry(−90°)+t(102.9, 29, 1.1); RL =
  Ry(+90°)+t(−102.9, 29, 68.9); FR = Rz(180°)·Ry(90°)+t(102.9, −29, 68.9);
  RR = Rz(180°)·Ry(−90°)+t(−102.9, −29, 1.1) — and the PCB deck rises to
  **Z51.5** (transform Rz(−90°)+t(96.5, 136.3, 51.5); rear rail Z48.5–51.5
  clears motor tops at 47.5 by 1.0). Motor screw holes in the plates are
  3.2×6 vertical slots (adjustability).
- **Servo mounting** (real SG90 CAD): the SG90 is too tall (31.5) to lie
  between the cheeks (25 interior), so it mounts **through the left cheek** —
  23.5×12.7 rectangular cutout centered at (X84, Z123), flange screwed to the
  cheek inner face (2× Ø2.2 at 27.9 pitch), output shaft exits +Y through the
  cheek. Horn (Ø22) + brass linkage arm sit outboard of the cheek, centered
  on the output at X74. Servo transform: Rx(−90°)+t(84, −6, 123) mm.
- **HC-SR04** (real CAD on printed bracket): bracket foot on the rear
  crossbar top with 2× M3 into insert pilots, back plate + cable slot; sensor
  board bolts to the back plate, transducers facing rearward (tips at
  X −131). Sensor transform: Rz(−90°)+t(−114.6, 0, 27.5) mm. The front
  crossbar has the same insert pattern for future accessories (camera, line
  sensors).
- **Standardized mounting**: M3 clearance grid at 20 mm pitch along both deck
  edges (Y ±48) and along both side-plate top rails (Z52.5); M3 insert pilots
  in crossbar tops; 2× M3 battery-holder provision holes in the deck; spare
  M3 holes near the tower tops.
- **Cross members** now Z15–35, bolted to the plates (ends) and up through
  the deck (2 screws each) — removable without touching anything else.
- **Cable management**: servo cable run down the left cheek and aft to the
  PCB front edge; sensor cable run along the deck beside the battery (Y −23.5)
  and up to the PCB rear edge; 3 printed cable clips; deck M3 grid doubles as
  zip-tie points.
- **Battery** moved to X −83.5…−30.5 (center −57) — closer to mid-wheelbase
  for CG; PCB unchanged at center Z47.
- Modularity: PCB (4× M3), battery holder (straps + 2× M3 provision), each
  motor (2× M3 slotted), servo assembly (2 plate bolts + 4 flange screws),
  sensor bracket (2× M3), tower (4 base bolts + 4 standoff bolts), wheels
  (push-fit hub), cross members (2+2 each) — every subsystem removable
  independently.

---

# Rev B baseline (superseded where in conflict)

Differential-drive chassis with front manipulator-arm tower, designed around the
RoboCore PCB (68.00 × 60.01 mm, extracted from `RoboCore.kicad_pcb` on 2026-07-12).

**Companion file:** `design.py` — Fusion 360 API script that generates this model.
All numbers below are mirrored in the `PARAMS` block at the top of that script.

---

## REV B (2026-07-13) — architecture change

Rev A's T-slot extrusion frame was replaced to match the concept-note render
sheet's design language (multi-view mechanical render, Figure 6): CNC-plate
construction, visible hardware, wheels integrated into the side plates.
Sections 1–9 below describe Rev A and are **superseded** where they conflict;
`design.py` (Rev B) is authoritative. Key Rev B facts:

- **Structure:** 2× aluminum side plates 230 × 45 × 5 mm (Z12–57, inner faces
  Y ±57.5) with chamfered ends, triangular truss lightening cutouts, and Ø10
  end holes; 3 mm floor deck (Z12–15) with lightening slots and bolted angle
  brackets; front/rear cross members 10 × 20 at X ±(104.5…114.5); button-head
  bolt detail throughout.
- **Drive:** wheels Ø60 × 25 flush against the plates (1.5 mm gap), axles
  through Ø13 plate bores with Ø18 bearing flanges, axle height Z30, wheels
  staggered ±14 (D5 still applies). Overall 230 × 178 × ~155.
- **Motors:** the real `GearedMotor 3-6V` CAD (TT-style, body fore-aft along
  the plate inner face, side shaft through the plate) is placed at both axles;
  motor face pattern in the plates still assumes A2 (2× M3 @ 17) — re-verify
  against the TT motor's actual mount.
- **PCB:** the real KiCad assembly (`RoboCore v1` component) sits at board
  bottom Z47, center (5, 0), connector edge at X −25 rear / antenna X +35
  front. Front holes on Ø6 standoffs from the deck; rear holes on a 12 × 3
  plate-to-plate cross-rail (Z44–47) because standoff columns would pass
  through the rear motor body.
- **Battery:** the real 3× AAA holder CAD sits on the deck between the wheels,
  X −91.5…−38.5, Y ±18, Z15–28. ⚠ 3× AAA (4.5 V) contradicts both the 2S
  Li-ion decision (D4) and the 12 V motor spec — unresolved electrical
  question, chassis accommodates either (2S bay dims in Rev A §5.5 still fit).
- **Tower:** two 5 mm cheek plates X 70–100, inner faces Y ±12.5, top Z145,
  Ø14 lightening holes, Ø8 cross standoffs, servo block + horn + arm reference
  geometry on top (Z110–140).
- **Casters:** ball-caster stacks at (±105, 0) under the deck, ground
  clearance 12 mm.
- **Placement transforms** for the real components (applied in the Fusion doc
  via MCP, occurrence `transform2` + snapshot): PCB = Rz(−90°) + t(96.5,
  136.3, 47); battery = R:(x,y,z)→(z,x,y) + t(−90.7, 0, 15); left motor =
  Ry(+90°) + t(−13.9, 29, 63.9); right motor = Rz(180°)·Ry(−90°) + t(−41.9,
  −29, −3.9). Translations in mm.

---

## 0. Decisions & assumptions log

| # | Item | Decision | Source |
|---|------|----------|--------|
| D1 | Output format | Spec + Fusion script (Option C) | User, 2026-07-12 |
| D2 | PCB standoffs | **Rev-2 M3 symmetric grid 61.0 × 53.0 mm** (holes inset 3.5 mm from board edges). The as-built rev-1 board (M2, irregular, max deviation 0.57 mm from this grid) will **not** bolt to this chassis — the PCB must be re-spun with the hole table in §4.1. | User, 2026-07-12 |
| D3 | PCB orientation | Connector edge (USB-C J1, battery J2, motors J4/J3) faces **rear**; ESP32-C3 antenna edge faces **front** | User, 2026-07-12 |
| D4 | Battery | 7.4 V 2S 18650 pack (70 × 35 × 20 mm), charged **off-robot** on an external 2S charger. Onboard MCP73871 (1S-only) is not used for pack charging. | User, 2026-07-12 |
| D5 | **Drive wheels staggered ±14 mm**, not exactly at the midpoint | Two 68 mm motors mounted inboard cannot be coaxial in an 80 mm frame interior (they would overlap by 56 mm). Belt drive would keep the wheels coaxial but adds pulleys, belts, axles and bearings — wrong trade for a K 1,332-cost education kit. Staggering the wheels ±14 mm keeps simple direct drive; effect on differential kinematics is negligible (28 mm stagger vs 152 mm track). See §6. | Engineering decision — **flag to user** |
| A1 | Drive wheel | **Ø100 × 24 mm** (e.g. 100 mm scooter wheel + printed hub, or RC wheel). Not in source spec. Geometry constraint: axle height = wheel radius must clear rail tops plus motor body radius → Ø ≥ 2×(35 + 12.5 + 2.5) = 100. Parameter `wheel_dia`. | Derived — **confirm wheel purchase** |
| A2 | Motor face pattern | 2× M3 @ 17.0 mm spacing + Ø13 pilot-boss clearance, shaft ≥ 12 mm long (typical 25GA/25D gearmotor). Parameter `motor_face_hole_spacing`. | Assumed — **verify motor datasheet** |
| A3 | Caster | Ball caster, stack height 11.0 mm under a 4 mm mount plate (total 15), shimmed −0.5 mm for rocker relief. Parameter `caster_height`. | Assumed — **verify purchased caster** |
| A4 | "15 mm ground clearance" | Interpreted as: chassis underside (frame bottom) sits 15 mm above ground. | Interpretation of user spec |

---

## 1. Coordinate system

- Origin: ground level, robot center (mid-wheelbase, on centerline).
- **+X = forward, +Y = left, +Z = up.** All dimensions mm.

Master Z-levels:

| Z | Surface |
|---|---------|
| 0 | Ground |
| 15 | Frame/rail underside = ground clearance |
| 18 | PCB tray floor top |
| 23 | PCB underside (5 mm standoffs) |
| 24.6 | PCB top surface (1.6 mm board) |
| 35 | Frame/rail top |
| 37.5 | Motor body underside (2.5 mm above rails) |
| 39 | Battery bay floor top |
| 41 | Arm tower plate top |
| 50 | Drive axle height (= wheel radius) |

## 2. Overall envelope

| Item | Value | Check |
|---|---|---|
| Length | 230 (frame rails, full length) | = spec |
| Width | 176 over wheel outer faces | ≤ 180 spec |
| Height | 121 to arm-tower top (plate 41 + tower 80); wheels reach Z100; 160 envelope reserved for arm mechanism | ≤ spec |
| Est. mass | ~1.1–1.2 kg (frame 0.33, motors 0.20, wheels 0.15, battery 0.10, PCB 0.05, printed 0.25, fasteners/casters 0.10) | ≈ spec |

## 3. Frame — 20×20 T-slot aluminum

Flat base ring at Z15–35, outer footprint 230 × 120:

| Member | Qty | Cut length | Position (centerline) |
|---|---|---|---|
| Side rail | 2 | 230 | Y = ±50 (outer faces Y ±60), X −115…+115 |
| Cross member | 2 | 80 | X = ±105 (between rail inner faces Y ±40) |

- Joined by 4× printed corner brackets (§5.1), M5×10 + slide-in T-nuts.
- Interior clear width: **80 mm**.
- Rationale for 120 frame width: wheels (24 wide + 4 mm gap) inside the 180 mm
  overall width → wheel outer faces at Y ±88.

## 4. PCB bay (printed tray, §5.2)

PCB placement: board spans **X −25…+35, Y −34…+34**, top surface Z 24.6.
Connector edge at X −25 (rear-facing); antenna overhangs X +35 (front-facing).

### 4.1 Standoff grid — REV-2 HOLE TABLE (authoritative)

M3 holes, Ø3.2 drill, inset 3.5 mm from each board edge → 61.0 (across) × 53.0
(along) grid. In board coordinates (from board bottom-left, Y-up, connector
edge = bottom):

| Hole | X | Y |
|---|---|---|
| H1 | 3.5 | 56.5 |
| H2 | 64.5 | 56.5 |
| H3 | 3.5 | 3.5 |
| H4 | 64.5 | 3.5 |

> **Action item (PCB rev 2):** move H1–H4 to these coordinates and upsize to M3
> (Ø3.2). Current rev-1 deviations: H1 0.15, H2 0.27, H3 0.54, H4 0.57 mm.

Standoff bosses: Ø8 × 5 mm tall, Ø2.8 pilot for M3 self-tapping (or Ø4.0 + M3
heat-set insert — parameter `standoff_pilot_dia`). PCB fastened by 4× M3×8 from
the top → **top-access removal, frame untouched**.

### 4.2 Tray body

- Floor 3 mm (Z15–18), outer 70 (X) × 78 (Y); walls 2.4 mm × 17 mm tall on
  **left, right, front** (3 sides). **Rear open** for USB-C, charger, and motor
  connectors — all exit rearward with the board's own connectors (D3).
- Hung from the side rails: side walls carry 2× Ø5.3 holes per side at Z25 into
  the rails' inner-face T-slot (M5 + T-nut). The tray drops out downward after
  removing 4 screws; the PCB alone removes from the top without touching these.
- **Antenna keep-out** (no metal, no parts): X +35…+52, Y ±12, Z 23…40. Nearest
  metal: tower-plate T-nuts at X 65 in the rails (Y ±50, outside the zone). ✔

## 5. Printed parts (PLA/PETG, wall ≥ 2.4, overhangs ≤ 45°, all ≪ 240 mm)

| # | Part | Qty | Bounding box | Print orientation |
|---|---|---|---|---|
| 5.1 | Corner bracket | 4 | 40×40×20 | flat |
| 5.2 | PCB tray | 1 | 70×78×20 | floor down |
| 5.3 | Motor mount saddle | 2 (mirror) | 36×27×31 | face-plate down |
| 5.4 | Caster mount | 2 | 20×40×4 (+spacers) | flat |
| 5.5 | Battery bay | 1 | 66×120×29 | bridge down |
| 5.6 | Arm tower plate | 1 | 60×120×6 | flat |

### 5.3 Motor mounts (drive layout — read §6 first)

- Saddle bracket per side: base 36 (X) × 20 (Y) × 4 on the rail top (Z35–39)
  with 2× **slotted holes 5.3 × 15.3** (M5 + T-nut) → **±5 mm fore-aft
  adjustment**; slot centers at ±10 from the wheel axis.
- Outer drop plate 3 mm thick on the rail's outer plane (Y ±60…±63), rising
  Z35→66: Ø13 clearance bore at the axle (Z50) + 2× Ø3.2 flange holes at
  ±8.5 mm (A2). Motor face bolts to the inside of this plate; body extends
  inboard **over** the rails and interior (body Ø25, Z 37.5…62.5, clears rail
  tops by 2.5 and PCB components by ≥ 12.9).
- Wheel mounts directly on the motor shaft outside the plate: inner face Y ±64
  (1 mm air gap), hub grabs the 12 mm shaft at Y 64–75.

### 5.4 Caster mounts

- 20 (X) × 40 (Y) × 4 plate bolted **up** into each cross-member's bottom
  T-slot (2× M5 at Y ±12, ground-side countersunk); caster axis at (X ±105, Y 0).
- Caster stack under plate: 15 − 4 = 11 mm nominal; assemble 0.5 mm short
  (shim) so the robot rests on drive wheels + one caster — prevents 4-point
  rocking (2-caster teeter relief).

### 5.5 Battery bay

- Bridge plate 4 mm (Z35–39) spanning the full 120 frame width, X −105.4…−39.6
  (extends 8 mm past the bay walls fore/aft so the strap slots pass through
  material), bolted to both rail tops (4× M5 + T-nut at X −90/−55, Y ±50).
- Pack lies **across the robot** (long axis along Y): bay interior
  **45 (X) × 80 (Y)**, i.e. pack 35×70 + 5 mm clearance all round (D4); walls
  2.4 × 25 tall; floor Z39, pack top Z59. Open top.
- **2× strap slots** 12 × 3 mm through the bridge fore and aft of the bay walls
  at Y ±20 → two 10 mm velcro straps run fore-aft over the pack; tool-free
  removal.
- Clearances: rear cross member passes under the bridge ✔; right motor body
  ends at X −26.5, bridge starts at −39.6 ✔; wire channel from PCB connector
  edge (X −25, tops ~Z31.6) under the bridge (Z35) ✔.
- CG: pack mass rear-center at Z≈49, the spec-required position.

### 5.6 Arm tower plate

- 60 (X) × 120 (Y) × 6, X +55…+115, spanning both rail tops and the front
  cross member (Z35–41), 4× M5 + T-nut into rails (X 65/105, Y ±50).
- Tower interface: **4× M3 on 40 × 40 grid**, heat-set inserts, centered at
  (X +85, Y 0). Tower (~80 mm, by others) top lands at Z≈121.
- USB-C conflict from original spec: none — USB-C faces rear (D3).

## 6. Drive layout — why the wheels are staggered (D5)

Hard geometry: frame interior is 80 mm; each 25GA motor is ~68 mm long. Two
coaxial inboard motors need ≥ 140 mm — impossible. Options considered:

1. **Staggered direct drive (chosen):** left wheel at X +14, right at X −14.
   Motor bodies (Ø25) then clear each other by 3 mm. Zero extra parts. The
   robot's rotation center is still the midpoint; the 28 mm stagger vs 152 mm
   track adds negligible scrub during point turns.
2. Belt drive (coaxial wheels at X 0): motors staggered above deck, GT2 belts
   to dedicated axles in bearing blocks. Meets the "wheels at midpoint" wording
   but adds 2 belts, 4 pulleys, 2 shafts, 4 bearings per robot — rejected on
   cost/assembly for an education kit. Chassis accepts a retrofit (rail-mounted
   blocks) if ever needed.

Wheel positions: left (X +14, Y +64…+88), right (X −14, Y −64…−88), axle Z50.

## 7. Accessibility checklist (from requirements)

| Requirement | How met |
|---|---|
| PCB removable without frame disassembly | 4× M3 from top, open-top tray |
| Battery removable without tools | Velcro straps, open-top bay |
| USB-C + charging reachable from outside | Rear of frame is open between rails; connector edge at X −25 reachable through the rear opening (battery bridge starts 22 mm further forward at X −47.6) |
| PCB bay enclosed 3 sides, open top | Tray walls left/right/front |
| Antenna 15 mm keep-out | §4.2, verified against all metal parts |
| Motor mounts ±5 mm adjustable, M3 flange pattern | §5.3 slots + A2 pattern |
| Casters centerline, 15 mm clearance | §5.4, A3/A4 |

## 8. Fastener BOM (chassis only)

| Item | Qty |
|---|---|
| M5×10 button head + 20-series T-nut | 8 corners + 4 tray + 4 battery + 4 tower + 4 motor slots + 4 caster = 28 |
| M3×8 (PCB to standoffs) | 4 |
| M3×8 + M3×5×4 heat-set insert (tower) | 4 |
| M3×10 (motor flanges) | 4 |
| 10 mm velcro strap ≥ 250 mm | 2 |

## 9. Open items

1. **PCB rev 2 must adopt the §4.1 M3 hole table** — chassis will not accept rev 1.
2. **User to confirm the ±14 mm wheel stagger (D5)** — or request the belt-drive variant.
3. Confirm wheel Ø100×24 (A1), motor face pattern & shaft length (A2), caster height (A3).
4. Battery charging is off-robot (D4); if rev 2 adds 2S charging, the rear opening already exposes the connector edge — no chassis change needed.
5. Arm tower mechanism (~80 mm, servo) out of scope; interface per §5.6.
