"""RoboCore V2 robot: every dimension in one place (mm).  Revision 4, 2026-10-06.

Robot frame: X right, Y forward (towards the ESP32 antenna), Z up.
Origin = floor point under the middle of the wheel axle. The board centre
(and its IMU) sits directly above the origin.

Rev 3: one unified, open chassis (no pods / ring / bezel) with a perimeter
rail + 8 mm hole row as the expansion bus, motors and wheels that drop in as
one unit and snap in place, 56 mm wheels, a lower ultrasonic between two dock
towers, a snap-in line-sensor sled, and a 2-servo arm module on the front dock.
Rev 4 (Fred, after the XRP photo): octagon plan (45-degree chamfered corners) and the ultrasonic on a
bracket in front of the nose, XRP-style. The bracket bolts to the dock and the arm base stacks on it.
Rev 1, 2 and 3 are in rev1/, rev2/ and rev3/.
"""

# --- wheels and axle -------------------------------------------------------
TYRE_OD = 56.0          # TPU tyre outside diameter (rev 2: 64)
AXLE_Z = TYRE_OD / 2    # 28: axle height above the floor
TYRE_SEAT_D = 46.0      # rim diameter under the tyre (5 mm tyre wall)
TYRE_W = 10.0
FLANGE_D = 50.0
FLANGE_T = 1.2
RIM_IN_R = 21.0
HUB_D = 12.0
HUB_LEN = 10.4          # wheel origin -> hub outer face (shaft tip at local z 8.4, 1.7 mm screw floor)
BORE_D = 5.5            # TT double-D shaft (5.36 measured) + clearance
BORE_FLAT = 3.8
BORE_DEPTH = 5.5        # from the flat inner face: bore bottom meets the shaft tip (|X| 64.9) when the M2 screw is tight
WHEEL_SCREW_D = 2.4     # M2 screw into the shaft's centre hole
RIM_Z0 = 2.5            # flat inner face of the wheel: prints with no supports
WEB_Z0, WEB_T = 2.5, 3.0
LIGHT_N, LIGHT_R, LIGHT_D = 9, 18.6, 3.6   # lightening holes between the gear tips and the rim
GEAR_TEETH = 9          # RoboCore logo gear, raised on the wheel's outer face
GEAR_R_IN, GEAR_R_ROOT, GEAR_R_TIP, GEAR_H = 8.0, 12.5, 16.0, 1.2

# --- motors (XRP-style TT gearmotor with encoder, STEP from mech/CAD) -------
MOTOR_IN = 37.5         # |X| of the motor's inner face
M_SHAFT_Y = 7.5
M_IN_Z = 8.65
M_OUT_Z = -10.15
M_HALF_H = 11.25
MOTOR_TX = MOTOR_IN + M_IN_Z              # 46.15
MOTOR_OUT = MOTOR_TX - M_OUT_Z            # 56.3: shaft-side face of the gearbox
HUB_FACE_X = 64.9 - (RIM_Z0 + BORE_DEPTH)  # 56.9: wheel origin |X|; inner face 59.4 (1.3 mm to the shaft wall), outer face 73.8
MOTOR_Y = (-52.5, 11.0)                   # gearbox + motor can (tab to +16, encoder to -62.3)
MOTOR_TOP = AXLE_Z + M_HALF_H             # 39.25
MOTOR_BOTTOM = AXLE_Z - M_HALF_H          # 16.75
M_PIN_Y = -3.5 - M_SHAFT_Y                # -11.0: locating pin on the shaft face (d 3.8, 1.7 proud)
M_PIN_D = 3.8
M_BOSS_D = 7.0                            # shaft boss ring (0.35 proud)
ENC_PLUG = (-60.1, -54.6, AXLE_Z - 8.0, AXLE_Z + 8.0)

# --- body ----------------------------------------------------------------------
FLOOR_Z0 = 10.5         # underside of the body and the battery door (one flat plane)
FLOOR_T = 3.0
FZ = FLOOR_Z0 + FLOOR_T  # 13.5
BODY_TOP = 52.0         # body line = top of the perimeter rail
BODY_HALF = 78.0        # outer face of the side walls (the rail lip adds RAIL_OUT): 162 mm over the rails
BODY_Y0, BODY_Y1 = -78.0, 62.0
CHAMFER = 24.0          # octagon: 45-degree corner chamfers (24 mm legs); limited by the wheel wells
VERTEX_R = 8.0          # fillet on the eight octagon corners (offsets down to -6 keep a 2 mm radius)
SKIN_T = 3.0            # perimeter wall
RAIL_OUT = 3.0          # rail lip: sticks out 3 mm, 45-degree underside from z 47 to 50, flat to 52
RAIL_Z = (47.0, 50.0)
DETENT_PITCH = 8.0      # V-notches on the lip so clips click into place every 8 mm
DETENT = (1.4, 0.7)     # width, depth
HOLE_PITCH = 8.0        # LEGO Technic pitch hole row
HOLE_D = 4.9
HOLE_Z = 42.0
HOLE_BAND = (38.0, 46.5)
HOLE_BAND_T = 6.0       # the wall is thickened to 6 mm behind the hole row where there is room
WIN_Z = (14.5, 36.5)    # diamond windows: 45-degree sides print without supports
WIN_W = 22.0
SIDE_WIN_Y = [-13.0, 13.0]   # over the wheel (4 mm web at Y 0)
REAR_WIN_X = [-39.5, 39.5]
FRONT_WIN_X = [-39.5, 39.5]   # beside the sonar bracket

# --- motor cradle -------------------------------------------------------------------
WALL_T = 3.0            # inner wall |X| 34.5 .. 37.5
WALL_Y = (-51.0, 31.0)
INNER_TOP = 42.0        # 4 mm under the board: cables run along the wall top in saddles
WALL_WINDOW = (-52.0, -30.6, 20.5, 35.5)   # relief for the round motor can on the inner side
CRADLE_RAILS = [(39.0, 41.5), (51.0, 53.5)]
CRADLE_RAIL_Y = (-52.0, 9.0)
CRADLE_END_Y = (18.0, 20.0)                # front end wall of the cradle
SHAFT_WALL = (MOTOR_OUT + 0.2, MOTOR_OUT + 1.8)  # 56.5 .. 58.1: 0.2 mm motor clearance, 1.3 mm to the wheel
SHAFT_WALL_Y = (-30.5, 30.5)   # full well length; well end walls Y +-(30.5..33.5), |X| 57.6..75 (clear of the can bump at 57.15)
SHAFT_WALL_TOP = 44.0
SHAFT_SLOT = 5.8        # U-slot for the 5.36 shaft
BOSS_GROOVE = (7.6, 0.4)
PIN_SLOT = 4.4
LATCH_Y = [-16.0, 6.0]  # snap latches on the inner wall (the rear one clears the pillar wedge)
LATCH_W = 10.0
LATCH_SLIT = 1.0
LATCH_Z0 = 22.0         # tongue root
LATCH_T = 2.0           # tongue thickness (wall thinned from 3)
LATCH_HOOK = 2.0        # hook reaches 2 mm over the motor
SADDLES_Y = [-28.0, -5.0, 20.0]   # cable saddles in the inner-wall tops (-28 sits by J403/J404)
SADDLE = (4.0, 3.0)
WELL = (58.1, 75.0, -30.5, 30.5)  # wheel well (open top and bottom): x0 x1 y0 y1

# --- board ----------------------------------------------------------------
BOARD_Z = 46.0
BOARD_T = 1.6
BOARD_HOLES = [(-30.50, 26.65), (30.60, 26.25), (-30.95, -26.80), (30.85, -26.95)]
PILLAR_D = 7.0
ANTENNA = (-9.05, 9.05, 23.3, 29.8, 47.6, 48.6)
J403 = (-25.90, -25.65)
J404 = (16.70, -25.15)
J102 = (-13.90, -26.25)
SW101_LEVER = (34.0, 36.2, -17.45)

# --- battery: flat 1S3P 18650 pack (1S2P with the spacer) -------------------
PACK3 = (57.0, 70.0, 20.0)
PACK2 = (38.0, 70.0, 20.0)
PACK_Y = (-62.5, 7.5)    # rev 3: 10 mm further back (caster moved into the door) -> caster load ~30 %
DOOR_TOP = 13.0
BAY_HALF = 29.5
BAY_Y = (-63.5, 9.0)
DOOR_GAP = 0.3
DOOR_TAB = (10.3, 9.0, 26.5)    # tab runs forward under the floor to the thumb screw; 1.5 mm wall to the sled pocket
DOOR_SCREW_Y = 23.0     # M3 x 6 knurled thumb screw (kept: holds a 154 g pack)
DOOR_TONGUES = [(11.0, 21.0)]
DOOR_TONGUE = (3.5, 12.0, 13.0)  # flush with the door top: the door prints top face down
PACK_RIB_X = 29.0
PACK_RIB_Y = [-50.0, -30.0, -5.0]   # clear of the latch slits and the encoder plugs (y < -54.6)
PACK_RIB_TOP = 30.0
FRONT_STOP = (9.0, 11.0, 22.0, 28.0)   # y0, y1, half width, top; stands on the floor in front of the bay
BALLAST_HALF = 47.0     # rear rack behind the pack: stops the pack, roofs the door hinge slots and holds
BALLAST_TOP = 30.5      # 6 x M8 nuts (about 31 g) standing on a corner, for the arm module
BALLAST_X = [-40.0, -26.0, -12.0, 12.0, 26.0, 40.0]
BALLAST_SLOT = (13.4, 6.7)        # x, y (M8 nut: 13 AF, 6.5 thick)
BALLAST_Y = (-74.6, -67.9)
BALLAST_Z0 = 15.0
LEAD_CHANNEL = 4.5      # half width of the battery-lead channel through the rack
HOLD_LUGS = [(-30.4, -23.4), (-4.0, 0.0)]
LUG_TOP = 35.6
SPACER_IN = 19.3
SPACER_TOP = 30.0

# --- caster ----------------------------------------------------------------------
BALL_D = 12.7           # 1/2" steel ball (slingshot / bearing ball): passes under the pack
CASTER_Y = -40.0        # caster cup is part of the battery door
CASTER_SCREW_X = 12.0
CASTER_LIP_Z = 3.0
CASTER_CUP_D = 18.0

# --- nose: line-sensor sled -------------------------------------------------------
LINE_C = (0.0, 41.0)
LINE_UNDER_Z = 10.5     # underside of the line-sensor board; print the sled at 9.5 / 10.5 / 11.5
LINE_BOARD = (60.0, 24.0, 1.6)
NOSE_HALF = 37.5        # front block (deck over the sled pocket); merges with the inner walls
NOSE_Y = (19.0, 59.0)
NOSE_TOP = 18.0
NOSE_POCKET = (33.0, 28.0, 56.5, 15.0)   # half width, y0, y1, ceiling z (closed on 4 sides: 28.5 mm bridge)
SLED_GROOVE = 1.4                        # PCB edge engagement each side
SLED_SKID_DZ = 7.5       # skid bottom = board underside - 7.5 (always below the TCRT5000 faces)
SLED_BUMP_Y = (30.0, 36.0)   # snap bumps on the rail rear ends, into grooves in the pocket walls
LINE_LEDS = [-16.0, 0.0, 16.0]
LINE_LED_DY = -1.4
LINE_LED_WIN = (6.0, 4.5)
LINE_PLUG = (10.0, -7.2, 7.0, 9.0)   # window over the JST SH: x, dy, w, h

# --- ultrasonic bay + front dock ---------------------------------------------------
US_CZ = 30.0            # transducer centre on the front bracket (rev 3: 35 inside the body); board top edge at 41
US_TILT = 5.0           # degrees, transducers aim up so the floor stays out of the 70-degree beam
US_UNDER_Y = 69.0       # PCB underside (transducer side) at the board centre: its JST sits 1 mm in front of the wall,
                        # the plug goes back through a slot in the front wall
US_CAN_X = 13.0         # TX at +X: on the viewer's left seen from the front
US_PCB = (46.0, 22.0, 1.6)
EYE_D = 18.0
EYE_BEVEL = 1.5
TOWER_X = (21.8, 30.8)  # dock towers flank the ultrasonic board (groove to 23.6, insert wall 1.4)
TOWER_Y = (40.0, 59.0)
US_GROOVE_DEPTH = 1.8   # PCB edge (|X| 23) sits 1.2 mm in the groove
DOCK_INSERTS = [(-27.0, 53.0), (27.0, 53.0)]   # M3 inserts on the tower tops (arm base)

# --- arm module (2 x SG90 / MG90S: shoulder + gripper) ----------------------------
SG90_BODY = (22.4, 12.2, 24.2)          # servo frame: long axis x, width y, case height z (shaft up)
SG90_SHAFT_X = -5.4                     # output shaft offset along the long axis
SG90_TAB = (11.8, 15.8, 17.0, 19.44, 13.75, 2.7)   # tab x0 x1, z0 z1, hole x, hole d
SG90_TOP = 28.5                          # gear tower top; spline to 31.5
SHOULDER = (64.0, 77.0)                  # (Y, Z) of the shoulder axis (along X); over the front edge so the lowered arm clears the rail
                                         # (z +3 in rev 4: the arm base stacks on the sonar bracket plate)
SHOULDER_SERVO_X = -17.0                 # robot X of the servo's bottom face (shaft points +X)
ARM_LEN = 70.0                           # shoulder axis to wrist axis
ARM_PLATE_X = [(15.6, 18.6), (-21.0, -18.0)]  # right plate screwed to the horn (horn arm in a 1.6 recess); left on a D-shaped printed pin
ARM_RAISED = 30.0                        # carry pose for renders (deg from horizontal-forward)
ARM_OPEN = 12.0                          # each jaw, degrees
JAW_PITCH_R = 9.0                        # gear sectors: module 1.5, 12 teeth on a full circle
JAW_MODULE = 1.5
JAW_LEN = 34.0

# --- expansion bus clip (template) -------------------------------------------------
CLIP_W = 16.0           # one clip covers two detents
CLIP_T = 2.2
CLIP_GAP = 0.25         # print clearance on the rail profile (tune with the test coupon)

# --- rear ------------------------------------------------------------------------
LOGO_PB = (50.0, 27.0)  # Plastal-Bot logo width, centre Z on the rear wall
LOGO_RC = (34.0, 50.0)  # RoboCore logo on top of the sonar bracket plate: width, centre Y
TIE_SLOTS = [(-56.0, -64.0), (56.0, -64.0), (-20.0, 24.0), (20.0, 24.0)]
DEBOSS = 0.6

# --- logo artwork ------------------------------------------------------------------
ART_DIR = '/Users/fred/Projects/Gypul_The_Balancing_Robot/PCB-Design/RoboCoreDesign/RoboCore_V2/lib/art'

# --- rev 3 decisions worked out 2026-10-06 (builder still to write) -----------------
INSERT_M3_D, INSERT_M3_DEPTH = 4.0, 5.5
INSERT_M2_D, INSERT_M2_DEPTH = 3.2, 5.0
WELL_END_X0 = 57.6
# Motor retention: drop-in from above; 2 inner-wall latches hook over the inner top edge.
# The gearbox fits snugly between the inner wall (37.5) and the shaft wall (56.5) over its full
# height, so it cannot rotate about Y: the inner hooks alone hold it down (outer side needs no hook).
# Hook profile (XZ): (37.5,39.4) (39.5,39.4) (39.5,40.0) (37.5,42.0): 45-degree lead-in, 2 mm flat underside.
# Front pillars get a web to the inner wall (0.4 mm gap otherwise).
HOLES_SIDE_Y = [-46.0, -38.0]   # none over the wells (pins would hit the wheel); the diagonals carry 3 each
HOLES_REAR_X = [8.0 * k for k in range(-6, 7)]
HOLES_FRONT_X = [8.0 * k for k in range(-6, 7)]
HOLES_DIAG = [-8.0, 0.0, 8.0]   # along each diagonal, from its middle
DETENT_SIDE_Y = [-46.0 + 8.0 * k for k in range(11)]
DETENT_END_X = [8.0 * k for k in range(-6, 7)]
# Line sled: pushed up into the nose pocket from below; the rails' rear ends carry 0.4 mm bumps that click
# into grooves in the pocket side walls (squeeze the rail ends to release). The PCB slides into the rail
# grooves from the open rear end; the pocket rear wall traps it once fitted. Skid bar runs forward under the nose.
SLED_RAIL = (28.6, 32.7)   # |X| of the sled side rails (pocket wall at 33)
# Arm: claw in line with the arm (frame A: x = robot X, y along the arm, origin on the shoulder axis).
# Deck z -7..-4 flush with the plate bottoms (prints deck-down); SG90 #2 on the deck, shaft -z;
# jaws z -11.5..-7.5 pivot at (-9, 78.6) on the horn and (9, 78.6) on an M3; plates end at y 64.
# The lowered angle is computed so the jaw tips stop 2 mm above the floor. Sonar is clear when raised/carrying.
ARM_DECK_Y = (56.0, 90.0)
JAW_PIVOT_Y = 78.6
ARM_BASE_Y = (38.0, 65.0)   # base plate on the tower tops and the front rail top; a tongue X -17..0 runs on to 75.6 for the front servo post

# --- clip / coupon ---------------------------------------------------------------------
CLIP_Y = -38.0          # display clip on the right rail (clips go anywhere except over the wheels, |Y| < 25)
CLIP_HOOK = 1.0         # hook depth under the 45-degree face

# --- rev 4: sonar bracket (front, XRP-style) --------------------------------------------
DOCK_STACK = 3.0                 # bracket plate thickness; the arm base sits on top of it
SONAR_PLATE_Y = (38.0, 73.0)     # bracket plate over the dock towers, running out over the nose
SONAR_ARM_X = (21.8, 28.8)       # two drop arms with grooves for the board edges
SONAR_ARM_Y = (65.3, 73.0)
SONAR_ARM_Z0 = 16.0
SONAR_SLOT = (1.0, 11.0, 19.5, 29.0)   # x0, x1, z0, z1: cable slot in the front wall behind the JST SH socket
