"""RoboCore V2 robot: every dimension in one place (mm).  Revision 5, 2026-10-07.

Robot frame: X right, Y forward (towards the ESP32 antenna), Z up.
Origin = floor point under the middle of the wheel axle. The board centre
(and its IMU) sits directly above the origin.

Rev 3: one unified chassis with a perimeter rail + 8 mm hole row as the expansion bus, snap-in motors,
56 mm wheels, a snap-in line-sensor sled and a 2-servo arm module on the front dock.
Rev 4 (Fred, after the XRP photo): octagon plan and the ultrasonic on a bracket in front of the nose, XRP-style.
Rev 5 (Fred's sketches and notes, 2026-10-07):
  - cross-shaped plan (narrow rear and front, wide at the wheels, front notch with two legs that guard the sonar),
    every corner CHAMFERED;
  - prints TOP DOWN like the XRP chassis: a flat deck covers the motors and carries the board on top; the chassis
    is open underneath and everything inside hangs from the deck (no supports);
  - the real motor's encoder cover (25.2 x 25.8 mm) modelled; motors go in from BELOW and snap in;
  - the BatteryHolder3S (3 x 18650, wired 1S3P) slides in from the BACK on 45-degree V-rails and two flaps snap
    behind it (no lid);
  - twin rear ball casters printed into the chassis; grippier locking tyres.
Rev 1-4 are in rev1/ ... rev4/.
"""

# --- wheels and axle -------------------------------------------------------
TYRE_OD = 56.0          # TPU tyre outside diameter
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
BORE_DEPTH = 5.5        # from the flat inner face: bore bottom meets the shaft tip when the M2 screw is tight
WHEEL_SCREW_D = 2.4     # M2 screw into the shaft's centre hole
RIM_Z0 = 2.5            # flat inner face of the wheel: prints with no supports
WEB_Z0, WEB_T = 2.5, 3.0
LIGHT_N, LIGHT_R, LIGHT_D = 9, 18.6, 3.6   # lightening holes between the gear tips and the rim
GEAR_TEETH = 9          # RoboCore logo gear, raised on the wheel's outer face
GEAR_R_IN, GEAR_R_ROOT, GEAR_R_TIP, GEAR_H = 8.0, 12.5, 16.0, 1.2

# --- motors (XRP-style TT gearmotor with encoder, STEP from mech/CAD) -------
MOTOR_IN = 40.5         # |X| of the gearbox inner face (rev 5: room for a 1.6 mm rail wall between the battery and the encoder covers)
M_SHAFT_Y = 7.5
M_IN_Z = 8.65
M_OUT_Z = -10.15
M_HALF_H = 11.25
MOTOR_TX = MOTOR_IN + M_IN_Z              # 49.15
MOTOR_OUT = MOTOR_TX - M_OUT_Z            # 59.3: shaft-side face of the gearbox
SHAFT_TIP = MOTOR_OUT + 8.6               # 67.9
HUB_FACE_X = SHAFT_TIP - (RIM_Z0 + BORE_DEPTH)   # 59.9: wheel origin |X|; inner face 62.4, outer face 76.8
MOTOR_TOP = AXLE_Z + M_HALF_H             # 39.25
MOTOR_BOTTOM = AXLE_Z - M_HALF_H          # 16.75
M_PIN_Y = -3.5 - M_SHAFT_Y                # -11.0: locating pin on the shaft face (d 3.8, 1.7 proud)

# --- body ----------------------------------------------------------------------
FLOOR_Z0 = 10.5         # underside of the walls (the chassis is open underneath)
BODY_TOP = 52.0         # top of the deck and of the perimeter rail: this face prints on the bed
DECK_T = 2.5            # top deck (covers the motors; the board sits on it)
BODY_HALF = 81.1        # wheel section: outer face of the side walls
HALF_REAR = 63.5        # rear section (encoder covers inside)
HALF_FRONT = 47.0       # front section and the two front legs
WHEEL_SEC_Y = 35.0      # wheel section spans y -35 .. 35
NOTCH_HALF = 33.0       # front notch between the legs (the sonar sits in it)
LEG_Y1 = 84.0           # front of the legs (the sonar cans end at about 82)
C_REAR, C_WHEEL, C_LEG, C_STEP, C_NOTCH = 10.0, 5.0, 5.0, 5.0, 4.0   # 45-degree corner chamfers (legs); the wheel
                                                                       # corners are small to clear the tyres
BODY_Y0, BODY_Y1 = -82.0, 62.0    # rear wall, front wall (the back of the notch)
SKIN_T = 3.0            # perimeter wall
# Expansion bus (Fred, 2026-10-07: no protruding lip, the side should read as one body): a flush GROOVE in the
# outer wall just under the deck. Clips hook a tongue into it; a thumb screw on the deck pulls the tongue up
# against the groove's flat top. The groove's underside is 45 degrees so it prints top-down.
BUS_GROOVE = (1.8, 46.0, 49.0)   # depth into the wall, z of its back face (bottom, top); the 45-degree lead-in
                                 # runs from (back, 46) out to the wall face at 44.2
BUS_BAND = (1.5, 43.0)  # wall thickened inside behind the groove (band thickness, from z) up to the deck
BUS_SKIP = (3, 13)      # plan sides with no groove: the wheel-section sides (the wall there is only the well skin)
DETENT_PITCH = 8.0      # V-notches in the groove's back face so clips click into place every 8 mm
DETENT = (1.4, 0.7)     # width, depth
HOLE_PITCH = 8.0        # LEGO Technic pitch hole row
HOLE_D = 4.9
HOLE_Z = 42.0
HOLE_BAND = (36.5, 49.5)   # wall thickened to 6 mm behind the hole row (front-section sides), 45-degree underside
HOLE_BAND_T = 6.0
HOLE_CLEAR = 8.0        # holes only where a Technic pin / M3 nut has this much room behind the wall
WIN_Z = (14.5, 36.5)    # diamond windows: 45-degree sides print without supports either way up
SIDE_WIN_Y = [-13.0, 13.0]   # over the wheel (4 mm web at Y 0)
REAR_SIDE_WIN_Y = -56.0      # rear-section sides: shows the encoder cover
FRONT_SIDE_WIN_Y = 51.0      # front-section sides
SIDE_WINDOWS = False         # Fred filled the side windows in Fusion (2026-10-07): solid side walls
WHEEL_ACCESS_D = 16.0        # Fred: round hole in each wheel-section side wall on the axle, to reach the wheel screw
WELL_CORNER_FILL = (20.0, 32.0, 2.0)   # Fred: 2 mm fill on the shaft wall's inner face, y 20..32, closes the gap at
                                       # the front of each wheel well

# --- chassis styling: earth-mover look (Fred, 2026-10-07: CAT 797F, JCB backhoe, loaders) ----------
# All shallow relief on the walls and the deck top: the outline, clearances and the top-down print stay as they were.
HUB_RING = (28.0, 17.0, 1.5, 22.5, 8, 3.0, 1.0)  # wheel hub round the access hole: OD, ID, height, bolt circle d,
                                                  # bolts, bolt hex AF, bolt height
FENDER = (27.0, 16.5, 2.5, 1.0, 12.0)   # arch over each wheel: half span (y), rise above the axle, band width,
                                        # height (proud), bottom of the legs (z)
LOUVRES = ([-68.0 + 4.0 * k for k in range(7)], 1.8, (16.0, 36.0), 1.2)   # rear-section sides: y, width, z, depth
CHEVRONS = ((33.5, 52.0), (12.5, 34.0), 3.2, 6.4, 0.8)   # rear wall beside the battery opening: |x|, z, stripe
                                                          # width, pitch, depth (paint them black)
TAIL_LIGHT = (6.0, 11.0, 1.2, 0.6, 35.0)   # on the rear chamfers: w, h, recess depth, lens height, centre z
BADGE = ((46.0, 74.0), (22.0, 32.0), 1.0, 24.0)   # front-section sides: y, z, plate height, RoboCore logo width
DECK_TREAD = ((41.0, 58.0), (-26.0, 14.0), 3.2, 1.0, 0.6)   # tread-plate walkways on the deck over the gearboxes:
                                                       # |x|, y, groove length, width, depth

# --- deck openings ---------------------------------------------------------------------
BOARD_WIN = (28.5, -38.0, 24.5)   # half width, y0, y1: under the board (pin-header legs, cables) and behind it
USB_RELIEF = (7.5, -58.0)         # half width, y0: the USB-C plug body sits low behind the board
FRONT_SLOT = (1.0, 30.6, 20.0, 36.5)   # x0, y0, x1, y1: line-sensor and sonar cables come up here
PLUG_SLOT_X, PLUG_SLOT_Y = (39.5, 53.5), (-55.0, -43.0)   # over the encoder sockets
CABLE_PORT_X, CABLE_PORT_Y = (35.0, 40.3), (-78.5, -66.0)  # rear corners, behind the cover boss (cables from below)

# --- motor cradle -------------------------------------------------------------------
WALL_T = 3.0            # inner wall |X| 37.3 .. 40.3
WALL_Y = (-29.8, 31.0)  # ends 0.4 mm short of the DG01D-E's can flange (rev 5 had -30.4)
CRADLE_END_Y = (18.0, 20.0)                # front end wall of the cradle
SHAFT_WALL = (MOTOR_OUT + 0.2, MOTOR_OUT + 1.8)  # 59.5 .. 61.1: 0.2 mm motor clearance, 1.3 mm to the wheel
SHAFT_WALL_Y = (-29.8, 30.5)   # rear end 0.4 mm short of the DG01D-E's can flange (rev 5 had -30.5)
SHAFT_SLOT = 6.4        # slot for the 5.4 shaft, open at the BOTTOM (motors go in from below)
BOSS_GROOVE = (7.6, 0.4)
PIN_SLOT = 4.4
LATCH_Y = [-16.0, 6.0]  # snap latches on the inner wall
LATCH_W = 10.0
LATCH_SLIT = 1.0
LATCH_ROOT = 34.0       # tongue root (top); tongues hang down, the hook at the bottom catches the gearbox
LATCH_FREE_Z = 14.2     # tongue's free end (the hook's 45-degree lead-in starts here)
LEDGE_Y = [(-25.0, -22.0), (-9.0, -3.0)]   # motor stops hanging from the deck: the wheel load goes up into them
LATCH_T = 2.0           # tongue thickness (wall thinned from 3)
LATCH_HOOK = 2.0        # hook reaches 2 mm under the gearbox
WELL = (SHAFT_WALL[1], BODY_HALF - SKIN_T, -30.5, 30.5)   # wheel well (open top and bottom): x0 x1 y0 y1
WELL_END_X0 = MOTOR_OUT + 1.3

# --- board (sits ON the deck, XRP-style) -------------------------------------------
BOARD_Z = BODY_TOP      # underside of the PCB
BOARD_T = 1.6
BOARD_HOLES = [(-30.50, 26.65), (30.60, 26.25), (-30.95, -26.80), (30.85, -26.95)]
BOARD_BOSS_D = 6.4      # boss under the deck for each M2 heat-set insert
ANTENNA = (-9.05, 9.05, 23.3, 29.8, BOARD_Z + 1.6, BOARD_Z + 2.6)

# --- battery: BatteryHolder3S (3 x 18650 wired 1S3P) --------------------------------
BATT_FILE_ID = 'urn:adsk.wipprod:dm.lineage:MdK99V-NTtKY6mHX1vpFuA'
BATT = (61.6, 78.4, 21.6)        # plastic width, length (contact springs add 4.4 each end), height with cells
BATT_Y = (-66.7, 11.7)           # plastic ends
BATT_Z0 = 13.6                   # lowest point (a 0.9 mm peg at x -27.9, y -63.9); flat base at 14.5
BATT_GAP = 0.5
BATT_RAIL_K = 16.36              # V-rails: 45-degree faces x - z = K (|x|); the holder's bottom edges ride on them
BATT_RAIL_X = BATT[0] / 2 + BATT_GAP   # 31.3: inner face of the rail walls (rear half) and of the battery opening
BATT_RAIL_T = 1.6                # rail wall (the encoder cover sits 0.6 mm outside it and backs it up)
BATT_STOP = (12.0, 14.0, 23.6, 28.0)   # y0, y1, |x| from, top there: front stop at the plastic corners, 45-degree top
FLAP_Y = (-78.4, -66.6)          # snap flaps: the rail walls' rear ends, hanging from the deck, flex outwards
FLAP_CATCH = (29.3, -67.0, -70.7, (15.2, 21.5))   # bump: inner |x|, catch face y, ramp end y, z range
BATT_OPEN_TOP = 37.5             # rear opening: |x| < BATT_RAIL_X, open at the bottom

# --- casters: two 1/2" balls snap into sockets printed in the rear corners -------------
BALL_D = 12.7
CASTER_X, CASTER_Y = 49.0, -73.0
CASTER_TUBE_D = 16.0
CASTER_LIP_Z = 3.7               # socket bottom: the opening (d 12.0) is 0.7 smaller than the ball
CASTER_CLEAR = 0.2               # ball cavity radial clearance
CASTER_VENT_D = 4.0              # push the ball out from the top with a pin

# --- nose: line-sensor pocket (rev 6: open pocket, board screwed straight to the chassis, no sled) ----
LINE_C = (0.0, 41.0)
LINE_UNDER_Z = 10.5     # underside of the line-sensor board (TCRT5000 faces about 3.4 mm off the floor)
LINE_BOARD = (60.0, 24.0, 1.6)
LINE_HOLES = ((-25.8, 40.0), (25.8, 40.0))   # the board's two M3 holes (KiCad: 51.6 mm pitch, 1 mm behind the centre line)
LINE_BOSS_D = 6.5       # screw bosses hanging from the deck down to the board's top face; M3 self-tapping pilots
NOSE_HALF = 37.5        # outer face of the pocket side walls, joins the inner walls
NOSE_Y = (24.5, 59.1)   # pocket rear wall starts / pocket front wall ends (at the skin)
NOSE_TOP = 18.0         # dock towers hang from the deck down to here
NOSE_POCKET = (33.0, 28.0, 56.5, 15.0)   # half width, y0, y1 of the open pocket (last value unused)
POCKET_WALL_T = 4.5     # pocket side walls 33 .. 37.5
SLED_SKID_DZ = 7.5      # skid bottom = board underside - 7.5 (always below the TCRT5000 faces)
SKID = (30.0, 54.0)     # skid half width, rear end y (runs forward to the nose; 45-degree chamfers both ends)

# --- ultrasonic + front dock ----------------------------------------------------------
# Ultrasonic: the HC-SR04 model Fred added (2026-10-08) replaces the custom RoboCore_Ultrasonic. Its 4-pin right-angle
# header hangs off one long edge, so the board is mounted header-UP (the Dupont plugs then sit in the pod under the
# plate instead of hanging below the robot); it is 45 x 20 mm with Ø16 cans 26 mm apart.
US_FILE_ID = 'urn:adsk.wipprod:dm.lineage:rUifbtyYSxeIajUVYzAKEA'   # HCSR04 Ultrasonic Sensor
US_CZ = 24.0            # transducer centre: low enough for the Dupont plugs on the header to clear the plate
US_TILT = 0.0           # degrees (rev 5 pod: the board sits flat against the faceplate; HC-SR04-style sensors
                        # have a 15-degree measuring angle, so at z 30 the floor is well outside it)
US_UNDER_Y = 68.6       # the cans' base; the board's front-side SMD parts (1.2 proud) then stop 0.3 short of the faceplate
US_HEADER = (-5.3, 5.3, 36.5, 51.0)   # x and z range the header plastic + Dupont plugs take up behind the board (header up)
US_CAN_X = 13.0         # TX at +X: on the viewer's left seen from the front
US_PCB = (45.0, 20.0, 1.6)
EYE_D = 16.0            # transducer can diameter (HC-SR04 model)
TOWER_X = (21.8, 30.8)  # dock towers (sonar bracket, arm base)
TOWER_Y = (40.0, 59.0)
DOCK_INSERTS = [(-27.0, 53.0), (27.0, 53.0)]   # M3 inserts on the tower tops

# --- arm module (shoulder + gripper servos) ------------------------------------------------
# Fred's servo models (2026-10-08) replace the built reference: the MG90S assembly on the shoulder, the SG90 ("Servo",
# with its own cross horn and cable) on the gripper. Both are placed through the SG90 frame below, which the arm base,
# the deck posts and the horns are designed round (the MG90S model matches it within 0.3 mm).
SERVO_FILES = {'shoulder': ('urn:adsk.wipprod:dm.lineage:R0C4sTuMSMuPh_VMcrdxeQ', 'Assembly Micro Servo MG90S'),
               'gripper': ('urn:adsk.wipprod:dm.lineage:UviUxa5dS4y7YsuZY7FtYQ', 'Servo')}
# model frame -> SG90 frame (columns = images of the model's x, y, z; then the translation), per file
MG90S_TO_SG90 = ([(0, 1, 0), (-1, 0, 0), (0, 0, 1)], (11.43, 0.0, 6.78))   # long axis y, shaft up z; placed by its tabs
                                                                           # (outer face at z 19.44), bottom lands at -0.26
SG90_NATIVE_TO_SG90 = ([(0, -1, 0), (0, 0, 1), (-1, 0, 0)], (-0.25, 0.0, 15.7))   # the SG90 file's 'Servo:1' body in its
                                         # own coordinates: long axis z (shaft at +5.15), bottom at y -15.7 -> SG90 frame
SERVO_HIDE = ('LevaServo', 'PernoServo')   # the SG90 model's cross horn and pin: the jaw uses the single-arm horn instead
SG90_BODY = (22.4, 12.2, 24.2)          # servo frame: long axis x, width y, case height z (shaft up)
SG90_SHAFT_X = -5.4                     # output shaft offset along the long axis
SG90_TAB = (11.8, 15.8, 17.0, 19.44, 13.75, 2.7)   # tab x0 x1, z0 z1, hole x, hole d
SG90_TOP = 28.5                          # horn seat; both of Fred's models have their gear housing top at 27.98
SHOULDER = (64.0, 77.0)                  # (Y, Z) of the shoulder axis (along X)
SHOULDER_SERVO_X = -17.0                 # robot X of the servo's bottom face (shaft points +X)
ARM_LEN = 70.0                           # shoulder axis to wrist axis
ARM_PLATE_X = [(15.6, 18.6), (-21.0, -18.0)]
ARM_RAISED = 30.0                        # carry pose for renders (deg from horizontal-forward)
ARM_OPEN = 12.0                          # each jaw, degrees
JAW_PITCH_R = 9.0                        # gear sectors: module 1.5, 12 teeth on a full circle
JAW_MODULE = 1.5
JAW_LEN = 34.0
ARM_DECK_Y = (56.0, 90.0)
JAW_PIVOT_Y = 78.6
ARM_BASE_Y = (38.0, 65.0)

# --- arm styling (rev 5, after Fred's toy excavator, 2026-10-07) --------------------------
BOOM = ([(0.0, -7.0), (64.0, -7.0), (64.0, 6.0), (44.0, 12.0), (16.0, 12.5), (0.0, 7.0)], [0, 3, 3, 12, 12, 0])
                                         # side-plate outline (arm frame y, z): curved boom, round shoulder end (r 7)
BOOM_WINDOWS = [(22.0, 2.5, 6.0), (35.5, 2.5, 6.0), (51.0, 1.5, 4.0)]   # diamond truss windows: y, z, half diagonal
BOOM_CYL = (14.5, 3.5, 2.0, (15.0, 34.0, 45.0), (12.5, 46.5))   # "hydraulic cylinder" on top: axis z, barrel r, rod r,
                                                                 # (barrel y0, barrel y1, rod end), eye ys (saddles)
GEAR_BOSS = (9, 5.2, 6.8, 1.2, 5.6)     # RoboCore gear on the shoulder: teeth, root r, tip r, height, hex AF
WRIST_BOSS = (59.5, 0.5, 8.0, 4.6)      # y, z, boss d, hex AF (bolt-head bosses at the wrist, both plates)
HORN = (7.0, 4.0, 3.0, 1.5, 16.0, 4.0)  # SG90 single-arm horn: hub d, hub height, spline bore depth, arm thickness,
                                         # arm length, arm width
HORN_HOLES = (9.0, 13.0)                # horn-arm screw holes from the axis
GRIP_HORN_ANGLE = 14.0                  # deg: the gripper horn's arm points 14 deg outward so it stays inside the finger
ARM_MAX = 85.0                          # shoulder joint limit (deg); the minimum is the floor pose
JAW_LIMITS = (0.0, 35.0)                # each jaw (deg), 0 = closed

# --- expansion bus clip (template) -------------------------------------------------
CLIP_W = 16.0           # one clip covers two detents
CLIP_T = 2.2
CLIP_GAP = 0.25         # print clearance on the rail profile (tune with the test coupon)
CLIP_TAB = (13.0, 6.5)  # tab over the deck: reach from the wall face, thickness (M3 insert + thumb screw onto the deck)
CLIP_LEG_Z0 = 41.2      # bottom of the clip's outer leg (3 mm under the groove's lead-in)
CLIP_Y = -57.0          # display clip on the right rear-section rail, snapped to the nearest detent (not over the wheels)
BALLAST_CLIP_X = [-44.0, 44.0]   # ballast clips (3 M8 nuts each) on the rear rail, for the arm module
BALLAST_BUMP_DY = 4.0   # bump 4 mm off centre: the clips sit at x +-44 (clear of the caster vents and cable ports)
                        # with their bumps in the detents at x 48 and -40

# --- rear / logos ------------------------------------------------------------------------
LOGO_PB = (26.0, 43.5)  # Plastal-Bot logo width, centre Z on the rear wall (above the battery opening)
LOGO_RC = (34.0, 50.0)  # RoboCore logo on top of the sonar bracket plate: width, centre Y
DEBOSS = 0.6
ART_DIR = '/Users/fred/Projects/Gypul_The_Balancing_Robot/PCB-Design/RoboCoreDesign/RoboCore_V2/lib/art'

INSERT_M3_D, INSERT_M3_DEPTH = 4.0, 5.5
PILOT_M3 = (2.5, 8.0)            # M3 self-tapping pilot (line-sensor bosses): diameter, depth
INSERT_M2_D, INSERT_M2_DEPTH = 3.2, 5.0

# --- sonar bracket (Fred, 2026-10-07: the old slide-in grooves were impractical; modern look) -----------
# A plate on the dock (2 x M3, the arm base stacks on it) with a headlight-style POD hanging from its front:
# a faceplate with two round eyes and bezels, a brow, and two side walls. The board goes in from the BACK of
# the pod: the cans drop into the eyes (that locates it) and two snap strips click behind the PCB.
DOCK_STACK = 3.0                 # bracket plate thickness; the arm base sits on top of it
SONAR_PLATE_Y = (38.0, 73.0)     # bracket plate over the dock towers, running out over the nose
SONAR_PLATE_CHAMFER = 4.0
POD_HALF = 25.2                  # pod outer half width (PCB 45 + 0.7 each side + 2 mm walls: the hooks then clear the PCB edge)
POD_WALL = 2.0
POD_Y = (62.5, 72.6)             # rear (0.5 in front of the chassis nose) to the faceplate's front; the PCB's front face is at y 70
POD_Z0 = 12.0                    # bottom of the pod (PCB bottom edge at 14)
POD_FACE_T = 2.5                 # faceplate; the PCB's front face sits against its back (US_UNDER_Y)
EYE_CLEAR = 0.8                  # eye opening = can + this
EYE_DZ = 0.0                     # the HC-SR04's cans are on the board's centre line
EYE_BEZEL = (21.0, 1.0)          # raised ring round each eye: OD, proud
POD_BROW = (3.0, 44.0, 48.4)     # visor over the eyes: reach forward, underside z, top z at the faceplate (47-degree slope)
POD_CHAMFER = 2.0                # on the pod's vertical front corners
POD_SNAP = (66.4, 67.0, 66.8, 1.6, 18.0, 30.0)   # slit y0 y1 (strip behind), hook front y (PCB back at 67.1), hook reach, hook z0 z1
POD_WINDOW = (5.9, 13.6, 18.9)   # window through the faceplate for the HC-SR04's crystal (10.5 x 4 x 3 proud, bottom centre): half width, z0, z1
SONAR_SLOT = (-8.0, 8.0, 28.0, 41.0)   # x0, x1, z0, z1: slot in the front wall for the 4 Dupont wires (under the bus band)

# --- rev 5: real motor encoder cover (from the maker's drawing) --------------------------
COVER = (25.79, 25.2, 22.3)      # thickness (robot X), height (Z), length (Y)
COVER_Y = (-56.9, -34.8)         # behind the gearbox and the can neck (shaft at y 0)
COVER_INSET = 0.0                # outer face flush with the gearbox's shaft face (worst case for the battery gap)
COVER_BOSS = (19.2, -63.9)       # square end boss, its end y
COVER_PLUG = (12.0, 7.0, 6.0, -52.5)   # encoder socket on the cover's side face (robot +Z on the right motor): x, y, out, y0

# --- rev 5: tyre ---------------------------------------------------------------------------------
TYRE_ID = 45.2                   # stretched onto the 46 mm seat
TYRE_EDGE_R = 26.8               # crown edge radius (crown peaks at TYRE_OD / 2)
TYRE_BEADS = (2.6, 0.7, 2.0)     # from each side, height, base width: lock into rim grooves
RIM_GROOVE = (0.9, 2.4)          # depth, width (45-degree sides)
TREAD = (24, 1.6, 26.0)          # grooves per half, width, groove floor radius (staggered half a pitch)

# --- hand edits ported from Fusion v30 (Fred, 2026-10-13): keep them through rebuilds ---------------------------
HAND_EDITS = True
WHEEL_SKIN_CUT = 1.0     # v30 Extrude142/143: 1 mm cut off both wheel-section outer wall faces (x +-81.1, y -30..30, z 10.5..51.5)
# --- fasteners (Task A, 2026-10-14): 'inserts' = rev 5 heat-set inserts; 'plastic' = screws for plastic + captive nuts
FASTENERS = 'plastic'
PILOT_M2 = (1.7, 6.0)            # M2 thread-forming screw pilot in the board bosses: diameter, depth
NUT_M3 = (5.5, 2.4)              # M3 hex nut across flats, thickness (DIN 934); pockets get +0.2 on the flats
CASTER_VENT_D_PROPOSED = 5.5     # Task C: fits a 3 mm flat screwdriver's shank; not applied until Fred says so
BALLAST_CLIP_X_PROPOSED = [-40.0, 40.0]   # Task C: tabs end at |x| 48, clear of the vents at |x| 47..51
