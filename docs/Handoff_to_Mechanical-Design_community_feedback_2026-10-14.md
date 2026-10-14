# Hand-off to the Mechanical-Design chat: community feedback (2026-10-14)

## Prompt to paste into the Mechanical-Design chat

> Read `RoboCore_V2/docs/Handoff_to_Mechanical-Design_community_feedback_2026-10-14.md` and the earlier note `Handoff_to_Mechanical-Design_fewer_screws_2026-10-12.md` in the same folder. Work through tasks A to C on the current rev 5 robot (Fusion v29). For task A, show me the options first and wait for my choice before modelling anything. Save a new Fusion version, keep my hand edits, and run checks.py after every change.

---

## Where this comes from
- On 14 October Fred asked the Every Flavor Robotics Discord for design feedback. The post is in the thread "Remember my 'PCB sanity check' board?", in #community-projects.
- Two makers replied:
  - EO
  - alexchunlin
- Fred answered them publicly. He said he would:
  - look at screws for plastic or snap fits instead of heat-set inserts;
  - make a test stand;
  - add a caster hole.
- Their connector point (keyed plugs) is board work. It's handled separately in `Task_PCB_wrong_plug_check_2026-10-14.md`.

## Ground rules
- **Fred decides.** Present options with pros and cons. Model only after he picks one. The 12 October "rev 6" attempt was rejected because changes were made without his say.
- **Start from Fusion v29** (rev 5). Save each change as a new version. Fred edits the model by hand, so keep those edits. The generator scripts (`mech/robot/fusion/`, `rc_params.py`) are rev 5 too.
- **Keep the design rules:**
  - every part prints without supports on a 180 mm bed;
  - the chassis prints deck-down;
  - use chamfers, not fillets;
  - no protruding ledges or lips on the sides;
  - keep metal at least 15 mm from the ESP32 antenna.
- **After each change**, run `checks.py`. It checks clashes, overhangs, antenna clearance and caster load (keep the casters carrying weight with the arm out). Update `mech/robot/README.md`, including the fastener table.
- **List any fastener or part change** at the end, so the component list (`docs/RoboCore_V2_component_list.xlsx`) can be updated. The list is kept in the inventory chat. Don't edit it here.

## Task A: no heat-set inserts in anything students assemble
**Feedback:**
- EO said heat-set inserts are too complex for a school. EO suggested screws made for plastic, or proper snap fits.
- alexchunlin suggested screw-in (threaded-outside) inserts. They're much easier to fit than heat-set ones.

**Rev 5 has 10 heat-set inserts per robot:**

| Insert | Qty | Where |
|---|---|---|
| M2 | 4 | Bosses under the controller board (`BOARD_BOSS_D`, `INSERT_M2_*`) |
| M3 | 2 | Dock tower tops: sonar bracket, with the arm base stacked on it (`DOCK_INSERTS`) |
| M3 | 2 | Ballast clips (thumb screw onto the deck) |
| M3 | 1 | Bus clip tab (thumb screw) |
| M3 | 1 | Bus clip accessory boss |

**Do this:**
1. For each location, compare three options:
   - **Screws for plastic.** Thread-forming or self-tapping screws into a printed pilot. Pilot sizes from the reverted attempt were never test-printed: Ø1.7 for M2, Ø2.5 × 8 deep for M3.
   - **Snap fit.** A latch or clip, with no fastener.
   - **Screw-in insert.** Threaded outside, machine thread inside.
2. Score each option on:
   - the student steps and tools needed;
   - the cost per robot;
   - how well it survives being taken apart 10 or more times;
   - the print risk (thin walls, layer direction);
   - the effect on the antenna clearance.
3. Recommend one option per location, then **wait for Fred**.
4. After Fred chooses:
   - model the change;
   - add a small test coupon for each joint type;
   - write the coupon test: assemble and remove 10 times, then check the hold.

**Don't repeat:** hex pockets for the M8 ballast nuts under the deck. Fred rejected that placement, and moving the weight forward lowers the caster load. The balance numbers are in the 12 October note.

## Task B: a test stand
**Feedback:** EO said a stand that holds the robot with its wheels off the desk is super helpful for testing. It stops the robot driving off the desk with cables attached when a program goes wrong.

**Requirements:**
- **Support:** the robot rests on the chassis, not on the wheels, casters or line-sensor sled.
- **Clearance:** the wheels have at least 5 mm of clear air.
- **Stability:** the robot stays stable with the arm reaching forward. It's front-heavy then.
- **Access:** the stand doesn't cover the USB-C port, the ON/OFF switch, the sensor headers or the battery slot.
- **Printing:** prints without supports on a 180 mm bed, using little filament.
- **Packaging:** ideally fits in the shipping box. Check the insert tray in `mech/robot/packaging/`, and say whether it needs a pocket. Don't change the packaging here without asking Fred.

**Deliverables:** the stand part, an STL or 3MF in `print/`, a render of the robot on the stand, and a README entry.

## Task C: caster ball removal hole
**Feedback:** EO liked the captive ball caster design. EO suggested a hole so a screwdriver can push the ball out from the other side to reuse it.

**Rev 5 already has this on paper:** `CASTER_VENT_D = 4.0` in `rc_params.py`, commented "push the ball out from the top with a pin".

**Do this:**
1. Check in Fusion v29 that the hole goes all the way through from the top of the deck to the ball.
2. Check that nothing covers it: the battery holder, a ballast clip, the bus groove or the board.
3. Check that a small flat screwdriver (about 3 mm) fits. If not, propose a larger hole. Check that the socket still holds the ball.
4. Add the "push the ball out here" step to the build guide notes.

## Reminder from the earlier note
The DG01D-E encoder motor model, swapped in on 11 October, overlaps the chassis:
- about 69 mm³ around the encoder;
- about 65 mm³ at the rail wall.

Also, `build_joints` still looks for 'TT DC Gear Motor', so it won't find the new motor.

## Report back
- What changed, with before and after renders.
- The `checks.py` results.
- The fastener and part changes for the component list.
- Anything Fred needs to decide.
