# Review of the DFMA brief (received 2026-10-14) against the rev 6 robot (Fusion v32)

The brief asks for five groups of changes. This note checks each against the current model and the hand-off
ground rules (Fred decides; chamfers not fillets; every part prints without supports; the chassis prints deck-down;
no heat-set inserts in anything students assemble, Task A). Nothing has been modelled yet.

## 1. Ultrasonic housing: "double-bubble" character face, R3–5 fillets, recessed eyes
**What exists:** the sonar pod (`build_sonar_bracket`): a flat faceplate with 2 mm chamfers on the vertical front
corners, round bezels (`EYE_BEZEL`) around the two cans, a 47° brow, a crystal window, snap strips that hold the
HC-SR04 from behind. It prints plate-down with no supports.
**Conflicts:** fillets are against the design rules. A lofted double-bubble with the face vertical puts the bubbles'
undersides past 45°, so it would need supports or a flattened underside.
**Options:**
- 1a (fits the rules): bigger chamfers on the pod corners (2 → 5 mm), the eyes recessed about 1.5 mm behind a 45°
  chamfered bezel, a chamfer on the faceplate's top edges. 1–2 h, same print orientation, same fit of the board.
- 1b (breaks the fillet rule): new lofted cowling, R3–5 fillets, flattened bubble undersides so it still prints.
  About a day with renders and two or three iterations. Risk: the snap strips, brow and crystal window all move.
**Recommendation:** 1a, unless the character face is wanted for its own sake.

## 2. Snap-fit sonar module instead of the two top screws
**What exists:** the bracket plate sits on the dock towers and is held by 2 × M3 × 10 into captive M3 nuts in the
deck (Task A). The arm base stacks on the same plate under the same two screws.
**Conflicts:** Task A looked at snap fits and chose the nuts. The chassis prints deck-down, so no latch can stand
above the deck; any hook would have to hang from the bracket and pass through slots in the deck.
**What a snap fit would and would not give:** it removes two screws on the base robot only. With the arm fitted the
arm base still needs the screws (there is no room for nuts under a 3 mm plate on the deck), so nothing is saved.
A cantilever in PETG at the front of the robot also takes every bump.
**Options:**
- 2a: keep the two screws (as decided in Task A).
- 2b: two hooks hanging from the bracket through slots beside the towers, 0.25 mm clearance, 35°/10° ramp as the
  brief says; the arm base keeps its screws. Half a day plus a test print.
**Recommendation:** 2a.

## 3. Merge the arm base into the deck; hide the screws with inserts underneath
**What exists:** the arm base is a separate module (the "cab"), 2 × M3 × 10 socket heads on top.
**Conflicts:** the chassis prints deck-down, so a pedestal standing on the deck cannot be part of the chassis.
The arm is optional; merging it removes that. Heat-set inserts are out (Task A).
**Options:**
- 3a: leave as is.
- 3b (cosmetic, fits the rules): a 45° chamfer on the arm base plate's front edge so the step from the bracket
  plate reads as a slope, and 1.5 mm counterbores for the two socket heads. About 30 min.
**Recommendation:** 3b if the step bothers you, otherwise 3a.

## 4. Chassis edges: R2–3 fillets on the vertical corners, 1 mm deck chamfer, teardrop ceilings
**What exists:** every chassis corner is a 45° chamfer (`C_REAR` 10, `C_WHEEL`/`C_LEG`/`C_STEP` 5, `C_NOTCH` 4).
The bus groove runs along those chamfers and has a detent in the middle of each one, and the clips' bump uses them.
The deck perimeter (and every deck opening) already has a 0.5 mm bed chamfer. The rev 6 nose is an open pocket:
`checks.py` on v32 reports no unsupported overhangs anywhere.
**Options:**
- 4a: leave the corners as chamfers (rule), keep the 0.5 mm bed chamfer.
- 4b: bed chamfer 0.5 → 1.0 mm. One number, but it needs a chassis rebuild (about 1.5 h), so bundle it.
**Recommendation:** 4a; take 4b only with another chassis change.

## 5. Battery holder to motor clearance and motor wiring
**Measured in v32:** the closest point between the battery holder and either DG01D-E is **0.90 mm**, at the
encoder end (|x| 30.8 on the holder's case, |x| 31.6 on the motor's encoder-end tab, y −58, z 21.5), through the
rail-wall window cut in Task C. The magnet disc is at |x| 42–56, well clear. The holder has 0.5 mm of play
between the rail walls, so the worst case is about 0.4 mm. The brief asks for 1.5 mm.
**Caveat:** the motor is a community model of the DG01D-E, not SparkFun's own; the encoder-end shape and the
socket direction are already an open item to check on a real motor (README, open item 1).
**Wiring:** the right motor's plug goes up through the deck slot over the encoder; the left motor's cable leaves
under the robot and up the rear-left cable port. Neither runs through the battery bay. The "unused internal wire
relief channel" in the brief does not exist in this model.
**Options:**
- 5a: move both motors outboard 0.7 mm (`MOTOR_IN` 40.5 → 41.2): clearance 1.6 mm. The wheels follow, so the
  wheel-section skin has to move out 0.7 mm too to keep 1.3 mm beside the tyre: the robot gets 1.4 mm wider
  (163.4 mm). Chassis rebuild, 2–3 h, hub rings and fenders follow the parameters.
- 5b: keep 0.9 mm and check it on the real motor before the first print.
**Recommendation:** 5b now, 5a if the real motor confirms the model.

## Summary of what the brief gets wrong about this model
- There is no "lower front chassis plate", "vertical support pillar" or "internal wire relief channel".
- The cavity under the line sensor is already gone (rev 6 nose, 12 Oct).
- Heat-set inserts were removed on 14 Oct (Task A); the brief would put them back.

## Decision (Fred, 2026-10-14)
1a, 3b and 5b. Modelled the same day: Fusion v33 (sonar pod with a 4 mm faceplate, 56 mm front block, 4 mm corner
chamfers, countersunk bezels, chamfered plate edge; arm base with a 2 mm front-edge chamfer and Ø6 × 2 mm counterbores).
5b is README open item 14. Details in `mech/robot/README.md`, "Pod face and arm base edges".
