"""RoboCore ultrasonic sensor (CS100A, HC-SR04 compatible): netlist spec for gen_sch.py.

  RC_SPEC=spec_us RC_OUT=sensors/ultrasonic RC_PROJECT=RoboCore_Ultrasonic python3 tools/gen_sch.py

Circuit from the CS100A manual V2.0 (figure 4): one chip drives the 40 kHz transmitter (TP/TN, push-pull) and
amplifies the receiver (RP/RN). TRIG high for >10 us sends 8 pulses; ECHO stays high for the round trip time
(about 58 us per cm; ~33 ms when nothing is in range). Runs on the robot's 3.3 V.
"""
from spec_v2 import assign_part_numbers, R, C, CONN, FLAG, BLOCK, R0603, C0603, C0805

ROOT_UUID = "7d2e5a90-3c4b-4f1e-8b6a-9e0c1d2f3a01"
TITLE = "RoboCore Ultrasonic"
REV = "1.0"
DATE = "2026-10-05"
TRANSDUCER = dict(lib_id="RoboCoreV2:US_TRANSDUCER", footprint="RoboCoreV2:Ultrasonic_Transducer_D16.0mm_P10.00mm")

conn = BLOCK(
    "CONNECTOR + SUPPLY FILTER", [
        "JST SH 4-pin to the RoboCore V2 (J403): GND, 3V3, TRIG, ECHO (Qwiic power order).",
        "R1/C1 keep the transmitter's current pulses off the robot's 3.3 V rail (CS100A reference circuit)."],
    (20.32, 20.32), (76.2, 71.12), [
        CONN("J1", 4, "ULTRASONIC", "Connector_JST:JST_SH_BM04B-SRSS-TB_1x04-1MP_P1.00mm_Vertical", 15.24, 40.64,
             {1: "GND", 2: "+3V3", 3: "TRIG", 4: "ECHO"}, fields={"MF": "JST", "MP": "BM04B-SRSS-TB"}),
        R("R1", "3.3", 40.64, 30.48, "+3V3", "VCC", fp=R0603),
        C("C1", "10uF", 55.88, 38.1, "VCC", fp=C0805, description="6.3 V X5R"),
        R("R3", "100k", 40.64, 53.34, "TRIG", "GND", fp=R0603, description="keeps TRIG low with no cable"),
        FLAG("#FLG1", 66.04, 30.48, "+3V3"),
        FLAG("#FLG2", 66.04, 55.88, "GND"),
        FLAG("#FLG3", 55.88, 25.4, "VCC"),
    ])

rng = BLOCK(
    "RANGING (CS100A)", [
        "Y1 8 MHz crystal (12 pF load, 18 pF caps). R2 15M sets the receiver sensitivity: lower it (5.1M-22M) if",
        "far readings jump around; raise it for more range. TP1/TP2: amplifier and comparator outputs, for tuning."],
    (106.68, 20.32), (149.86, 86.36), [
        dict(ref="U1", lib_id="RoboCoreV2:CS100A", value="CS100A", footprint="Package_SO:SOIC-16_3.9x9.9mm_P1.27mm",
             x=63.5, y=50.8, fields={"MF": "Suzhou ShunGuiZhiLian (100sensor.com)", "MP": "CS100A",
                                     "ALT": "not at LCSC: buy from AliExpress/Alibaba and consign to the assembler"},
             nets={4: "VCC", 9: "VCC", 3: "GND", 12: "GND", 8: "TRIG", 7: "ECHO", 16: "GND", 5: "AMP_OUT", 6: "COMP_OUT",
                   10: "TX_P", 11: "TX_N", 2: "RX_P", 1: "RX_N", 13: "XTAL_I", 14: "XTAL_O"}),
        C("C2", "0.1uF", 48.26, 27.94, "VCC", fp=C0603, description="AVDD"),
        C("C3", "0.1uF", 78.74, 27.94, "VCC", fp=C0603, description="DVDD"),
        dict(ref="Y1", lib_id="Device:Crystal_GND24", value="8MHz", footprint="Crystal:Crystal_SMD_3225-4Pin_3.2x2.5mm",
             x=111.76, y=71.12, nets={1: "XTAL_I", 3: "XTAL_O", 2: "GND", 4: "GND"},
             fields={"MF": "HCI", "MP": "XC32M4-8.000-F12LJDT"}),
        C("C4", "18pF", 101.6, 81.28, "XTAL_I", fp=C0603, description="C0G"),
        C("C5", "18pF", 121.92, 81.28, "XTAL_O", fp=C0603, description="C0G"),
        R("R2", "15M", 127.0, 45.72, "RX_P", "GND", fp=R0603, description="receiver sensitivity, 5.1M-22M"),
        dict(ref="LS1", value="TX 40kHz", x=104.14, y=33.02, nets={1: "TX_P", 2: "TX_N"},
             fields={"MF": "HYDZ", "MP": "HY40A16T12-1"}, **TRANSDUCER),
        dict(ref="LS2", value="RX 40kHz", x=104.14, y=50.8, nets={1: "RX_P", 2: "RX_N"},
             fields={"MF": "HYDZ", "MP": "HY40A16R12-1"}, **TRANSDUCER),
        dict(ref="TP1", lib_id="Connector:TestPoint", value="AMP", footprint="TestPoint:TestPoint_Pad_D1.0mm",
             x=22.86, y=63.5, rot=90, nets={1: "AMP_OUT"}, no_bom=True),
        dict(ref="TP2", lib_id="Connector:TestPoint", value="COMP", footprint="TestPoint:TestPoint_Pad_D1.0mm",
             x=22.86, y=71.12, rot=90, nets={1: "COMP_OUT"}, no_bom=True),
        dict(ref="H1", lib_id="Mechanical:MountingHole", value="M2", footprint="MountingHole:MountingHole_2.2mm_M2", no_bom=True, x=139.7, y=20.32),
        dict(ref="H2", lib_id="Mechanical:MountingHole", value="M2", footprint="MountingHole:MountingHole_2.2mm_M2", no_bom=True, x=139.7, y=30.48),
        dict(ref="H3", lib_id="Mechanical:MountingHole", value="M2", footprint="MountingHole:MountingHole_2.2mm_M2", no_bom=True, x=139.7, y=40.64),
        dict(ref="H4", lib_id="Mechanical:MountingHole", value="M2", footprint="MountingHole:MountingHole_2.2mm_M2", no_bom=True, x=139.7, y=50.8),
    ],
    notes=[("PD low = always on; BLIND2 unused", 30.48, 81.28)])

SHEETS = [
    dict(title="Ultrasonic", file="ultrasonic.kicad_sch", uuid="7d2e5a90-3c4b-4f1e-8b6a-9e0c1d2f3a02", paper="A3",
         summary=["CS100A single-chip ranger", "HC-SR04 TRIG/ECHO, 3.3 V"], blocks=[conn, rng]),
]
ROOT_NOTES = [("RoboCore ultrasonic sensor: CS100A + 40 kHz transducer pair, HC-SR04 timing. JST SH 4 to RoboCore V2 J403.", 25.4, 30.48)]

LCSC_PN = {"BM04B-SRSS-TB": "C160390", "XC32M4-8.000-F12LJDT": "C2842191", "HY40A16T12-1": "C17701106", "HY40A16R12-1": "C17701107"}
for _sheet in SHEETS:
    for _blk in _sheet["blocks"]:
        for _p in _blk["parts"]:
            _mp = _p.get("fields", {}).get("MP")
            if _mp in LCSC_PN:
                _p["fields"]["LCSC"] = LCSC_PN[_mp]
_missing = assign_part_numbers(SHEETS)
if _missing:
    print(__name__, ": no part number for", _missing)
