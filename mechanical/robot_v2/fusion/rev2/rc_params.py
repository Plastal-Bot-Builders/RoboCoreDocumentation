"""RoboCore V2 robot: every dimension in one place (mm).  Revision 2, 2026-10-05.

Robot frame: X right, Y forward (towards the ESP32 antenna), Z up.
Origin = floor point under the middle of the wheel axle. The board centre
(and its IMU) sits directly above the origin.

Rev 2: motors 3 mm further out (track 130) for a 1S3P pack, bottom battery
door, caster behind the pack, RoboCore line/ultrasonic boards, body shell
(side pods with wheel arches, bumper ring, front bezel). Rev 1 is in rev1/.
"""

# --- wheels and axle -------------------------------------------------------
TYRE_OD = 64.0          # TPU tyre outside diameter
AXLE_Z = TYRE_OD / 2    # axle height above the floor
TYRE_SEAT_D = 54.0      # rim diameter under the tyre
TYRE_W = 10.0           # tyre width
FLANGE_D = 58.0         # rim lips that stop the tyre walking off
FLANGE_T = 1.2
RIM_IN_R = 25.0         # inner radius of the rim ring
HUB_D = 12.0
HUB_LEN = 10.4          # wheel origin -> hub outer face (shaft tip at local z 8.4, 1.7 mm screw floor)
BORE_D = 5.5            # TT double-D shaft (5.36 measured) + clearance
BORE_FLAT = 3.8         # across the flats (3.7 nominal)
BORE_DEPTH = 6.2        # from the flat inner face (z 2.5): 5.9 mm on the shaft
WHEEL_SCREW_D = 2.4     # M2 screw into the shaft's centre hole
RIM_Z0 = 2.5            # flat inner face of the wheel (hub, web and rim): prints with no supports
WEB_Z0, WEB_T = 2.5, 3.0
ACCESS_R = 22.2         # radius of the motor mounting screws from the axle
ACCESS_D = 4.5          # holes in the wheel web to reach them with a 2 mm hex key
GEAR_TEETH = 9          # RoboCore logo gear, raised on the wheel's outer face
GEAR_R_IN, GEAR_R_ROOT, GEAR_R_TIP, GEAR_H = 8.0, 12.5, 16.0, 1.2

# --- motors (XRP-style TT gearmotor with encoder, STEP from mech/CAD) -------
# Motor model frame: length along +Y, shaft along -Z at (0, 7.5), case
# faces at z = +8.65 (inner) and -10.15 (shaft side), height x = +-11.25.
MOTOR_IN = 37.5         # |X| of the motor's inner face (rev 1: 34.5)
M_SHAFT_Y = 7.5
M_IN_Z = 8.65
M_OUT_Z = -10.15
M_HALF_H = 11.25
M_HOLES = [(8.5, -13.0), (-8.5, -13.0)]   # TT mounting holes (motor x, y), d 3.2
MOTOR_TX = MOTOR_IN + M_IN_Z              # 46.15: motor model z=0 plane in robot |X|
HUB_FACE_X = MOTOR_TX + 10.35             # 56.5: wheel origin |X|; its flat inner face is at 59.0,
                                          # 1 mm clear of M3 button heads (ISO 7380) on the motor
ENC_PLUG = (-60.1, -54.6, 24.0, 40.0)     # encoder connector y0, y1, z0, z1 (plug enters from inboard)
ENC_PLUG_IN = MOTOR_TX - 13.65            # 32.5: inner edge of the encoder board

# --- body / chassis ------------------------------------------------------------
FLOOR_Z0 = 10.5         # underside of chassis, battery door and side pods (one flat plane)
FLOOR_T = 3.0
FZ = FLOOR_Z0 + FLOOR_T  # 13.5: top of the floor
BODY_Y0, BODY_Y1 = -80.0, 56.0
CH_HALF = 56.5          # chassis and bumper ring half width
POD_OUT = 73.5          # side pods: |X| 56.5 .. 73.5
BODY_R = 10.0           # plan-view corner radius
BELT_Z = 49.5           # top of the bumper ring and pods
WALL_T = 3.0            # motor walls |X| 34.5 .. 37.5
WALL_Y = (-51.0, 31.0)
WALL_TOP = 43.0
WALL_WINDOW = (-52.0, -30.6, 24.0, 40.0)   # y0, y1, z0, z1: relief for the round motor can
MOTOR_RAILS = [(39.0, 41.5), (51.0, 53.5)]  # |X| ranges of the rails under each motor
MOTOR_RAIL_Y = (-52.0, 9.0)
MOTOR_BOTTOM = AXLE_Z - M_HALF_H          # 20.75
MOTOR_BOSS_D = 8.0
MOTOR_BOSS_DEPTH = 7.0  # bosses reach |X| 30.5
INSERT_M3_D = 4.0       # heat-set insert hole, M3 x 4 short insert
INSERT_M3_DEPTH = 5.5
INSERT_M2_D = 3.2       # M2 insert hole
INSERT_M2_DEPTH = 5.0
REAR_WALL_T = 2.5
FRONT_WALL_Y = 53.5     # front wall beside the bezel (|X| 35.5 .. 56.5)
COLUMN_D = 10.0         # columns for the ring (vertical insert) and pods (horizontal insert)
COLUMNS = [(51.5, 45.0), (51.5, -71.0)]   # (|X|, Y)
POD_SCREW_Z = 25.0

# --- board ----------------------------------------------------------------
BOARD_Z = 46.0           # underside of the RoboCore V2 board
BOARD_T = 1.6
BOARD_HOLES = [(-30.50, 26.65), (30.60, 26.25), (-30.95, -26.80), (30.85, -26.95)]
PILLAR_D = 7.0           # J403/J404 are SMD now: no pin tails near any hole, so full-width pillars
ANTENNA = (-9.05, 9.05, 23.3, 29.8, 47.6, 48.6)  # x0 x1 y0 y1 z0 z1 of the module's antenna end
J403 = (-25.90, -25.65)  # ultrasonic socket, JST SH 4 vertical
J404 = (16.70, -25.15)   # line sensor socket, JST SH 5 vertical
J102 = (-13.90, -26.25)  # XT30
SW101_LEVER = (34.0, 36.2, -17.45)

# --- battery: flat 1S3P 18650 pack (1S2P with the spacer) -------------------
PACK3 = (57.0, 70.0, 20.0)
PACK2 = (38.0, 70.0, 20.0)
PACK_Y = (-52.5, 17.5)     # 2.1 mm ahead of the encoder plugs, 15.7 mm from the antenna
DOOR_TOP = 13.0            # pack sits on the door
BAY_HALF = 29.5            # door opening
BAY_Y = (-53.5, 19.0)
DOOR_GAP = 0.3
DOOR_TAB = (10.3, 19.0, 27.0)      # front tab: half width, y0, y1 (rebate in the front block)
DOOR_SCREW_Y = 23.0               # M3 x 6 knurled thumb screw, insert in the front block
DOOR_TONGUES = [(11.0, 21.0)]     # |X| ranges of the rear hinge tongues (clear of the ball pocket)
DOOR_TONGUE = (3.5, 11.3, 12.3)   # length, z0, z1
PACK_RIB_X = 29.0
PACK_RIB_Y = [-44.0, -2.0, 12.0]
PACK_RIB_TOP = 30.0
FRONT_STOP = (19.0, 21.0, 24.0, 28.0)   # y0, y1, half width, top
REAR_STOP = (-56.0, -53.5, 22.0, 22.0)  # y0, y1, half width, top
HOLD_LUGS = [(-30.4, -23.4), (5.0, 11.0)]  # 45-degree wedges on the walls: rear ones carry the board pillars
LUG_TOP = 35.6
SPACER_IN = 19.3           # 1S2P spacer inner face |X|
SPACER_TOP = 30.0

# --- caster (16 mm ball: glass marble or steel ball) ------------------------
BALL_D = 16.0
CASTER_Y = -61.0         # as far forward as the pack allows: ~20 % of the weight on the ball
CASTER_SCREW_X = 12.0
CASTER_LIP_Z = 4.0       # bottom of the cup (ball retention lip)
CASTER_CUP_D = 22.0

# --- nose: line sensor ------------------------------------------------------
LINE_C = (0.0, 41.0)      # board centre in plan
LINE_UNDER_Z = 10.5       # underside of the line-sensor board (9 .. 13 allowed)
LINE_BOARD = (60.0, 24.0, 1.6)
NOSE_HALF = 35.5
NOSE_Y = (19.0, 56.0)     # front block: battery-bay front to the bezel
NOSE_TOP = 18.0
NOSE_POCKET = (30.6, 28.5, 54.0, 15.0)   # half width, y0, y1, ceiling z (sensor sits underneath)
LINE_SLOT_X = (20.0, 28.0)               # covers hole spacings 40 .. 56 mm (ours: 51.6)
LINE_HOLE_DY = -1.0
LINE_LEDS = [-16.0, 0.0, 16.0]
LINE_LED_DY = -1.4
LINE_LED_WIN = (6.0, 4.5)
LINE_PLUG = (10.0, -7.2, 9.0, 7.0)       # x, dy, w, h of the cable pass-through

# --- front bezel + RoboCore ultrasonic -----------------------------------------
US_CZ = 50.0              # transducer centre height (>= 45 mm: beam is 70 deg wide)
US_UNDER_Y = 53.0         # PCB underside (transducer side) faces forward from here
US_CAN_X = 13.0           # TX at +X: on the viewer's left seen from the front
US_HOLES = [(-20.5, -7.5), (20.5, -7.5), (-20.5, 7.5), (20.5, 7.5)]
US_BOSS_D = 4.4           # 2.6 mm from the hole to the can edge
US_PILOT_D = 1.6
BEZEL_FACE_Y = 64.0       # transducers stand 1 mm proud of the face
BEZEL_T = 2.0
BEZEL_HALF = 35.5
BEZEL_TOP = 66.0
BEZEL_BOTTOM = 3.0        # skirt bottom = skid line, 0.5 mm below the TCRT5000 faces
BEZEL_BACK_Y = 46.0
EYE_HOLE = 16.8
EYE_BEVEL = 2.0
BEZEL_SCREWS = [(-32.5, 51.0), (32.5, 51.0)]
LOGO_RC = (46.0, 26.0)    # RoboCore logo width, centre Z on the bezel face
DEBOSS = 0.6

# --- bumper ring ----------------------------------------------------------------
RING_Z = (47.0, BELT_Z)
RING_SKIRT_Z0 = 44.0
RING_SKIRT_T = 2.0
BOARD_OPEN = (35.0, 31.0, 3.0)           # half x, half y, corner radius
LEVER_SLOT = (34.0, 40.5, -21.0, -14.0)
MOTOR_NOTCH = (35.0, 40.0, 16.0, 23.0)   # |X| range, Y range (motor cables to J301/J302)
COMB_SLOTS = [(J403[0], 6.0), (J404[0], 6.0)]
COMB_DEPTH = -37.0
REAR_NOTCH = (-17.0, 7.0, -40.0)         # USB-C plug + XT30 lead

# --- side pods (wheel arches + motor fairings) ------------------------------------
WELL_R = 35.5             # 3.5 mm round the tyre
FENDER_R = 40.5          # 5 mm arch band over the 3.5 mm tyre gap
POD_WALL = 2.0
POD_TOP_R, POD_BOT_R = 10.0, 4.0
FENDER_BLEND_R = 10.0
POD_RIB_Y = -55.0

# --- rear ------------------------------------------------------------------------
LEGO_D = 4.9
LEGO_PITCH = 8.0
LEGO_ROW_Z = 20.0
LEGO_ROW_X = 40.0         # holes at -40 .. 40
LOGO_PB = (56.0, 34.0)    # Plastal-Bot logo width, centre Z on the rear wall
TIE_SLOTS = [(-24.0, -56.0), (24.0, -56.0), (-20.0, 24.0), (20.0, 24.0)]   # zip-tie strain relief

# --- logo artwork (traced outlines from the PCB work) ------------------------------
ART_DIR = '/Users/fred/Projects/Gypul_The_Balancing_Robot/PCB-Design/RoboCoreDesign/RoboCore_V2/lib/art'
