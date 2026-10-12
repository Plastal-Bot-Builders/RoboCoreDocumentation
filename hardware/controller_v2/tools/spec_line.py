"""RoboCore line sensor (3-channel IR, like the Funduino tracker): netlist spec for gen_sch.py.

  RC_SPEC=spec_line RC_OUT=sensors/line_sensor RC_PROJECT=RoboCore_LineSensor python3 tools/gen_sch.py

Three Vishay TCRT5000 reflective sensors face the floor. Each phototransistor pulls its output low over a white
(reflective) surface and lets the 10k pull-up take it high over the black line, so the robot reads three analog
voltages (IO7 / IO10 / IO2 on the RoboCore V2, ADC1). An LM339 compares each one with half the supply and lights a
green LED over the line, so students can see what the sensor sees without any code.
"""
from spec_v2 import assign_part_numbers, R, C, LED, CONN, FLAG, BLOCK, R0603, C0603, C0805

ROOT_UUID = "4b6f3f0e-8d55-4a8c-9a3e-2f1d6c7b5a01"
TITLE = "RoboCore Line Sensor"
REV = "1.0"
DATE = "2026-10-05"
TCRT = dict(lib_id="RoboCoreV2:TCRT5000", value="TCRT5000", footprint="OptoDevice:Vishay_TCRT5000",
            fields={"MF": "Vishay", "MP": "TCRT5000", "ALT": "TCRT5000L (long leads)"})


def channel(side, n, ref_u, r_led, r_pu, out):
    return BLOCK(
        f"{side} SENSOR", [f"IR LED ~14 mA ({r_led[1]} from 3.3 V). Output {out}: low over white, high over the line."],
        (20.32 + 66.04 * n, 20.32), (60.96, 55.88), [
            R(r_led[0], r_led[1], 15.24, 25.4, "+3V3", f"IRLED_{side[0]}", fp=R0603),
            R(r_pu[0], r_pu[1], 43.18, 25.4, "+3V3", out, fp=R0603),
            dict(ref=ref_u, x=30.48, y=43.18, nets={4: f"IRLED_{side[0]}", 3: "GND", 1: out, 2: "GND"}, **TCRT),
        ])


conn = BLOCK(
    "CONNECTOR", ["JST SH 5-pin to the RoboCore V2 (J404): GND, 3V3, L, C, R. Same pin order as the board's socket."],
    (20.32, 86.36), (60.96, 76.2), [
        CONN("J1", 5, "LINE_SENSOR", "Connector_JST:JST_SH_BM05B-SRSS-TB_1x05-1MP_P1.00mm_Vertical", 20.32, 35.56,
             {1: "GND", 2: "+3V3", 3: "IR_L", 4: "IR_C", 5: "IR_R"}, fields={"MF": "JST", "MP": "BM05B-SRSS-TB"}),
        C("C1", "10uF", 40.64, 30.48, "+3V3", fp=C0805, description="6.3 V X5R"),
        C("C2", "0.1uF", 50.8, 30.48, "+3V3", fp=C0603),
        FLAG("#FLG1", 40.64, 48.26, "+3V3"),
        FLAG("#FLG2", 50.8, 48.26, "GND"),
        dict(ref="H1", lib_id="Mechanical:MountingHole", value="M3", footprint="MountingHole:MountingHole_3.2mm_M3", no_bom=True, x=12.7, y=55.88),
        dict(ref="H2", lib_id="Mechanical:MountingHole", value="M3", footprint="MountingHole:MountingHole_3.2mm_M3", no_bom=True, x=25.4, y=55.88),
    ])

ind = BLOCK(
    "LINE INDICATORS (LM339)", [
        "Each comparator sinks its LED when the sensor voltage is above VREF (1.65 V), i.e. over the black line.",
        "VREF = half of 3.3 V. The spare comparator has its inputs tied so its output stays low (pin 13 unused)."],
    (86.36, 86.36), (127.0, 76.2), [
        dict(ref="U4", lib_id="RoboCoreV2:LM339_QUAD", value="LM339", footprint="Package_SO:SOIC-14_3.9x8.7mm_P1.27mm",
             x=55.88, y=45.72, fields={"MF": "JSCJ", "MP": "LM339", "ALT": "TI LM339DR"},
             nets={3: "+3V3", 12: "GND", 5: "VREF", 4: "IR_L", 2: "IND_L", 7: "VREF", 6: "IR_C", 1: "IND_C",
                   9: "VREF", 8: "IR_R", 14: "IND_R", 11: "GND", 10: "VREF"}),
        R("R7", "100k", 12.7, 35.56, "+3V3", "VREF", fp=R0603),
        R("R8", "100k", 12.7, 50.8, "VREF", "GND", fp=R0603),
        C("C3", "0.1uF", 22.86, 50.8, "VREF", fp=C0603),
        C("C4", "0.1uF", 35.56, 25.4, "+3V3", fp=C0603, description="LM339 supply"),
        R("R9", "680", 86.36, 30.48, "+3V3", "LEDA_L", fp=R0603),
        R("R10", "680", 99.06, 30.48, "+3V3", "LEDA_C", fp=R0603),
        R("R11", "680", 111.76, 30.48, "+3V3", "LEDA_R", fp=R0603),
        LED("D1", "GREEN", "LTST-C191KGKT", 86.36, 50.8, "LEDA_L", "IND_L"),
        LED("D2", "GREEN", "LTST-C191KGKT", 99.06, 50.8, "LEDA_C", "IND_C"),
        LED("D3", "GREEN", "LTST-C191KGKT", 111.76, 50.8, "LEDA_R", "IND_R"),
    ],
    notes=[("lit = over the line", 88.9, 66.04)])

SHEETS = [
    dict(title="Line sensor", file="line_sensor.kicad_sch", uuid="4b6f3f0e-8d55-4a8c-9a3e-2f1d6c7b5a02", paper="A3",
         summary=["3x TCRT5000, analog outputs", "LM339 line indicator LEDs"],
         blocks=[channel("LEFT", 0, "U1", ("R1", "150"), ("R2", "10k"), "IR_L"),
                 channel("CENTRE", 1, "U2", ("R3", "150"), ("R4", "10k"), "IR_C"),
                 channel("RIGHT", 2, "U3", ("R5", "150"), ("R6", "10k"), "IR_R"),
                 conn, ind]),
]
ROOT_NOTES = [("RoboCore line sensor: 3x Vishay TCRT5000, analog outputs + LED indicators. JST SH 5 to RoboCore V2 J404.", 25.4, 30.48)]

LCSC_PN = {"TCRT5000": "C2984661", "LM339": "C2829428", "LTST-C191KGKT": "C125098", "BM05B-SRSS-TB": "C160391"}
for _sheet in SHEETS:
    for _blk in _sheet["blocks"]:
        for _p in _blk["parts"]:
            _mp = _p.get("fields", {}).get("MP")
            if _mp in LCSC_PN:
                _p["fields"]["LCSC"] = LCSC_PN[_mp]
_missing = assign_part_numbers(SHEETS)
if _missing:
    print(__name__, ": no part number for", _missing)
