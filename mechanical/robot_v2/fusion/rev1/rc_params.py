"""RoboCore V2 robot: every dimension in one place (mm).

Robot frame: X right, Y forward (towards the ESP32 antenna), Z up.
Origin = floor point under the middle of the wheel axle. The board centre
(and its IMU) sits directly above the origin.
"""

# --- wheels and axle -------------------------------------------------------
TYRE_OD = 64.0          # TPU tyre outside diameter
AXLE_Z = TYRE_OD / 2    # axle height above the floor
TYRE_SEAT_D = 54.0      # rim diameter under the tyre
TYRE_ID = 53.4          # tyre inside diameter (0.6 mm stretch onto the seat)
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

# --- motors (XRP-style TT gearmotor with encoder, STEP from mech/CAD) -------
# Motor model frame: length along +Y, shaft along -Z at (0, 7.5), case
# faces at z = +8.65 (inner) and -10.15 (shaft side), height x = +-11.25.
MOTOR_IN = 34.5         # |X| of the motor's inner face (outside the board)
M_SHAFT_Y = 7.5
M_IN_Z = 8.65
M_OUT_Z = -10.15
M_HALF_H = 11.25
M_HOLES = [(8.5, -13.0), (-8.5, -13.0)]   # TT mounting holes (motor x, y), d 3.2
MOTOR_TX = MOTOR_IN + M_IN_Z              # 43.15: motor model z=0 plane in robot |X|
HUB_FACE_X = MOTOR_TX + 10.35             # 53.5: wheel origin |X|; its flat inner face is at 56.0,
                                          # 1 mm clear of M3 button heads (ISO 7380) on the motor

# --- chassis ----------------------------------------------------------------
FLOOR_Z0 = 14.0         # ground clearance
FLOOR_T = 4.0
FZ = FLOOR_Z0 + FLOOR_T  # 18: top of the floor
FLOOR_Y0, FLOOR_Y1 = -72.0, 56.0
FLOOR_HALF = 34.5        # floor half width front and rear
FLOOR_MOTOR_HALF = 51.0  # floor half width under the motors
MOTOR_PAD_Y = (-52.0, 9.0)
MOTOR_BOTTOM = AXLE_Z - M_HALF_H          # 20.75
WALL_T = 3.0             # inner (motor mounting) walls
WALL_Y = (-51.0, 31.0)
WALL_TOP = 43.0
WALL_WINDOW = (-52.0, -30.6, 24.0, 40.0)   # y0, y1, z0, z1: relief for the round motor can
MOTOR_BOSS_D = 8.0
INSERT_M3_D = 4.0        # heat-set insert hole, M3 x 4 short insert
INSERT_M3_DEPTH = 5.5
INSERT_M2_D = 3.2        # M2 insert hole
INSERT_M2_DEPTH = 5.0

# --- board ----------------------------------------------------------------
BOARD_Z = 46.0           # underside of the RoboCore V2 board
BOARD_T = 1.6
BOARD_HOLES = [(-30.50, 26.65), (30.60, 26.25), (-30.95, -26.80), (30.85, -26.95)]
PILLAR_D = 7.0
PILLAR_TOP_D = 5.0       # J403 pin 1 is 4.3 mm from H103
PILLAR_TOP_H = 2.0       # thin top above the 1.5 mm pin tails
ANTENNA_Y = (23.3, 29.8)

# --- battery: one 18650 in a standard 1-cell holder (with leads) -----------
BATT_HOLDER = (21.0, 77.0, 20.0)   # w, l, h of a typical holder
BATT_HALF_IN = 11.5                 # tunnel half width
BATT_WALL = 2.0
BATT_Y = (-66.0, 12.0)              # holder slides in from the back
BATT_WALL_TOP = 39.0
DECK_Z = (39.0, 41.5)               # roof over the battery and cable channels
DECK_Y = (-51.0, 12.0)
STOP_Y = (12.0, 14.5)               # front stop for the holder

# snap latch (cut-out leaf in the floor with a hook behind the holder)
LATCH_HALF = 5.0
LATCH_Y = (-71.0, -53.0)
LATCH_T = 1.2
LATCH_HOOK_H = 2.0
LATCH_GAP = 1.0

# --- caster (16 mm ball: glass marble or steel ball) ------------------------
BALL_D = 16.0
CASTER_Y = -40.0
CASTER_SCREW_X = 18.0
CASTER_LIP_Z = 4.0       # bottom of the cup (ball retention lip)
CASTER_CUP_D = 22.0

# --- nose: HC-SR04 face plate and line-sensor slots -------------------------
US_PLATE_Y = (53.0, 56.0)
US_PLATE_HALF = 26.0
US_PLATE_TOP = 60.0
US_PCB_CZ = 47.0          # HC-SR04 board centre height (pins point down)
US_CAN_X = 13.0
US_CAN_HOLE = 16.8
US_PCB_HOLES = [(-20.5, -8.25), (20.5, -8.25), (-20.5, 8.25), (20.5, 8.25)]
US_BOSS_D = 4.5
US_BOSS_H = 1.5           # PCB stands 1.5 mm off the plate (header body)
US_CRYSTAL_WIN = (6.0, 5.3, 10.3)   # half width, z from/to above the PCB centre
US_PILOT_D = 1.6
LINE_SLOT_Y = (39.0, 48.0)
LINE_SLOT_X = (8.0, 22.0)
LEGO_D = 4.9
TIE_SLOTS = [(-23.0, -44.0), (23.0, -44.0), (-23.0, 2.0), (23.0, 2.0)]   # zip-tie pairs on the deck
LOGO_TEXT, LOGO_H, LOGO_Z = 'ROBOCORE', 6.0, 27.0
LINE_PCB_TOP = 12.6       # line module: sensor faces about 4 mm above the floor
SKID_X, SKID_Y, SKID_Z = 20.0, 48.0, 3.0   # anti-tip skids, clear of the floor when level
LEGO_PITCH = 8.0
