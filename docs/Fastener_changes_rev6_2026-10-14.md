# Fastener and part changes, robot rev 6 (Task A, 2026-10-14) — for the component list

From the Mechanical-Design chat. Applies to Fusion "RoboCore V2 Robot" v31 (Task A build on v30).

## Removed (per robot)
| Qty | Part | Was used for |
|---|---|---|
| 4 | M2 heat-set insert (Ø3.2 hole) | controller board bosses |
| 6 | M3 heat-set insert (Ø4.0 hole) | dock towers (2), ballast clips (2), bus clip tab (1), bus clip accessory boss (1) |
| 1 | Soldering iron + insert tips | fitting the inserts (no longer needed to assemble a robot) |

## Added (per robot)
| Qty | Part | Where |
|---|---|---|
| 6 | M3 hex nut, DIN 934 (5.5 mm across flats, 2.4 thick), zinc | dock towers (2, captive in deck-top hex pockets under the sonar plate), ballast clip tabs (2), bus clip tab (1), bus clip accessory boss (1) |

## Changed (same quantity, different type)
| Qty | Was | Now | Where |
|---|---|---|---|
| 4 | M2 × 6 pan-head machine screw (into inserts) | M2 × 6 **thread-forming screw for plastic** (pan head; e.g. Delta PT / PT-type or plain M2 self-tapping) | controller board into Ø1.7 pilots |
| 2 | M3 × 8 pan self-tapping (already on the list for the idle jaw: 1) | **3** in total: idle jaw pivot (1) + line sensor into the nose bosses (2) — the nose change from 12 Oct | line sensor |

## Unchanged
M3 × 8 / × 10 socket screws (dock), 3 × M3 × 8 thumb screws (clips), M2 × 6 + washer (wheels), M8 nuts (ballast), servo-bag screws and horns.

## New test part
`print/RoboCore_V2_Fastener_coupon` (PETG, flat, ~10 min): pilot boss, deck-top nut pocket, clip-tab nut slot. Print and cycle 10 times before the first classroom batch; see mech/robot/README.md "Fasteners, rev 6".

## Decided 2026-10-14 (no list change)
- Caster vent Ø5.5 (done, Fusion v32). Ballast clips stay at x ±44.
- DG01D-E motor fit: windows in the battery rail walls (done, Fusion v32). Track and wheels unchanged.
