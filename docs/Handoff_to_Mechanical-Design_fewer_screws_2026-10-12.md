# Hand-off to the Mechanical-Design chat: fewer screw-type parts (2026-10-12)

From the inventory chat. **Ideas only. Nothing here is decided.** The robot design is back on rev 5. The parts list follows rev 5 too, except for the removals Fred chose.

## What happened
- Fred asked the inventory chat to justify the inserts, self-tapping screws and washers on the list, and to cut screw-type parts.
- The inventory chat changed the Fusion design itself ("rev 6") and saved it as v28. Fred did not approve: the nut pockets were placed badly, and mechanical work belongs to this chat.
- Everything was reverted. The generator scripts, README, EXPANSION_BUS.md and print files are back on rev 5. Fusion is back on rev 5 as v29, a promoted copy of v27; see the last section.

## Where each fastener goes in rev 5 (per robot, arm fitted, one bus clip)
| Part | Qty | Where |
|---|---|---|
| M2 heat-set insert | 4 | Bosses under the controller's 4 corner holes |
| M2 × 6 machine screw | 4 | Controller into those inserts |
| M3 heat-set insert | 6 | Dock tower tops (2), ballast clips (2), bus clip tab (1), bus clip accessory boss (1) |
| M3 × 10 socket screw | 2 | Arm base + sonar bracket into the dock towers (M3 × 8 without the arm) |
| M2 × 6 self-tapping + M2 washer | 2 + 2 | Wheels onto the motor shafts |
| M2 × 8 pan | 1 | Shoulder horn centre screw (the servo's own screw is too short) |
| M2 × 5 pan | 2 | Shoulder horn arm to the right boom plate |
| M2 × 4 pan | 3 | Gripper horn: centre + 2 into the driven jaw |
| M3 × 8 self-tapping | 1 | Idle jaw pivot |
| M3 × 8 thumb screw | 3 | Bus clip + 2 ballast clips |
| M8 hex nut | 6 | 3 in each ballast clip |

That is 9 screw kinds plus inserts and washers. Servo tab screws come in the servo bags.

## Ideas tried in the reverted attempt, with what was learned
1. **No inserts.** Self-tapping screws into printed pilots: Ø1.7 for M2, Ø2.5 × 8 deep for M3. This removes 10 inserts and the insert soldering tips. Screw grip in PETG was never test-printed.
2. **Arm on servo-bag screws only.** The horns sit in shaped pockets in the boom and jaw, held by each servo's own horn screw. The idle jaw turns on a printed snap pin. This removes the M2 × 8, 2 × M2 × 5, 3 × M2 × 4 and the M3 × 8.
3. **Ballast without clips.** Hex pockets under the deck took press-fit M8 nuts. **Fred rejected this placement.** Moving the weight forward hurts balance:
   - Rev 5 clips, 6 nuts: casters carry 10 % (glass balls) / 12 % (steel), arm level.
   - 8 nuts in 4 pockets over the battery's rear end: 7 % (glass).
   - 12 nuts in 6 pockets: 9 % / 11 %.
4. **Board on 2 screws + 2 locating pins.** The pins can't be printed, because the chassis prints deck-down and nothing can stand above the deck. Two screws at opposite corners were used instead.
5. **No wheel washers.** The screw head sat straight on the wheel hub. Not checked on a real print.

The rev 6 model had no clashes in the carry, floor and up poses. The antenna had 19.7 mm clear of metal. No part needed supports.

## Other findings for this chat
- **The DG01D-E motor model (swapped in 2026-10-11) overlaps the chassis.** Found by the interference check, in areas rev 6 did not change:
  - about 69 mm³ around the encoder, x 32.6 to 60.4, y −64 to −9, z 19.6 to 36.4;
  - about 65 mm³ at the rail wall, x 31.6 to 32.6, y −58 to −53.3, z 21.1 to 34.9;
  - 2.75 mm³ between the motor body and the wheel.
- **The generator still names the old motor.** `build_joints` looks for 'TT DC Gear Motor', so the joints step won't find the DG01D-E. In `checks.py`, the motor mass and the allowed screw-into-motor pair also use the old name.
- **Parts list: both servos are now MG90S** (Fred's choice). The CAD gripper still shows the SG90 model. The MG90S is the same size, so the model can be swapped when convenient.

## Fusion versions of "RoboCore V2 Robot"
- v27: the rev 5 design, saved at 12:27 on 12 Oct, before the change.
- v28: the reverted rev 6 attempt (nut pockets, no inserts).
- **v29: v27 promoted on 12 Oct, so the newest version is rev 5 again.** It has the ballast clips, 6 M8 nuts and the heat-set inserts, and no nut pockets.
