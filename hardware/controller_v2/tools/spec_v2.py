"""RoboCore V2 netlist spec, organised as functional blocks.

Each sheet holds blocks; each block has a title, a short description, a position/size on the sheet and its parts.
Part x/y are relative to the block's top-left corner. Pin keys are symbol pin numbers; net names are global.
gen_sch.py draws power symbols for POWER_NETS, wires nets that stay inside a block, and labels the rest.

2026-10-04 review changes: VPCC divider (R104/R121, 4.5 V), SEL solder jumper JP101 (default = adapter mode),
TE tied straight to +5V_USB (safety timer off, as before), USBLC6 channel pins swapped (same circuit, cleaner drawing).
"""
ROOT_UUID = "061529a6-e218-4bfa-b9b2-1c0a6368cc57"

R0603 = "Resistor_SMD:R_0603_1608Metric"
C0603 = "Capacitor_SMD:C_0603_1608Metric"
R0402 = "Resistor_SMD:R_0402_1005Metric"
C0402 = "Capacitor_SMD:C_0402_1005Metric"
C0805 = "Capacitor_SMD:C_0805_2012Metric"
C1206 = "Capacitor_SMD:C_1206_3216Metric"
LED0603 = "LED_SMD:LED_0603_1608Metric"
SKQG = "Button_Switch_SMD:SW_SPST_SKQG_WithoutStem"


def R(ref, val, x, y, n1, n2, rot=0, fp=R0402, **kw):
    """Vertical by default: pin 1 on top. rot=90: pin 1 on the left. rot=180: pin 1 at the bottom."""
    return dict(ref=ref, lib_id="Device:R", value=val, footprint=fp, x=x, y=y, rot=rot, nets={1: n1, 2: n2}, **kw)

def C(ref, val, x, y, n1, n2="GND", rot=0, fp=C0402, **kw):
    return dict(ref=ref, lib_id="Device:C", value=val, footprint=fp, x=x, y=y, rot=rot, nets={1: n1, 2: n2}, **kw)

def LED(ref, colour, mpn, x, y, anode, cathode):
    # Device:LED pin 1 = K, pin 2 = A; rot 90 puts the anode on top
    return dict(ref=ref, lib_id="Device:LED", value=colour, footprint=LED0603, x=x, y=y, rot=90,
                nets={2: anode, 1: cathode}, fields={"MF": "Lite-On", "MP": mpn})

def CONN(ref, n, val, fp, x, y, nets, **kw):
    return dict(ref=ref, lib_id=f"Connector_Generic:Conn_01x{n:02d}", value=val, footprint=fp, x=x, y=y, nets=nets, **kw)

def FLAG(ref, x, y, net):
    return dict(ref=ref, lib_id="power:PWR_FLAG", value="PWR_FLAG", x=x, y=y, nets={1: net})

def TP(ref, x, y, net):
    # supply test points upside down so the supply symbol points up
    return dict(ref=ref, lib_id="Connector:TestPoint", value=net, footprint="TestPoint:TestPoint_Pad_D1.0mm",
                x=x, y=y, rot=0 if net == "GND" else 180, nets={1: net}, hide_value=True, no_bom=True)

def SW(ref, val, x, y, n1, n2):
    # rot 270: pin 1 on top
    return dict(ref=ref, lib_id="Switch:SW_Push", value=val, footprint=SKQG, x=x, y=y, rot=270,
                nets={1: n1, 2: n2}, fields={"MF": "Alps Alpine", "MP": "SKQGADE010"})

def BLOCK(title, desc, at, size, parts, notes=(), label_nets=(), label_at=None):
    return dict(title=title, desc=desc, at=at, size=size, parts=parts, notes=list(notes),
                label_nets=set(label_nets), label_at=label_at or {})


# =========================================================================== POWER
usb_in = BLOCK(
    "USB-C INPUT", [
        "USB-C socket for charging and programming. 5.1k on CC1/CC2 asks the source for plain 5 V.",
        "USBLC6 clamps static on D+/D-, D106 clamps VBUS surges, and the 1.5 A resettable fuse protects the charger input."],
    (15.24, 15.24), (111.76, 96.52), [
        dict(ref="J101", lib_id="Connector:USB_C_Receptacle_USB2.0_16P", value="TYPE-C-31-M-12",
             footprint="Connector_USB:USB_C_Receptacle_HRO_TYPE-C-31-M-12", x=22.86, y=50.8,
             nets={"A1": "GND", "A12": "GND", "B1": "GND", "B12": "GND", "SH": "GND", "A4": "VBUS", "A9": "VBUS", "B4": "VBUS",
                   "B9": "VBUS", "A5": "CC1", "B5": "CC2", "A6": "USB_DP", "B6": "USB_DP", "A7": "USB_DN", "B7": "USB_DN"},
             fields={"MF": "HRO", "MP": "TYPE-C-31-M-12"}),
        dict(ref="U101", lib_id="Power_Protection:USBLC6-2SC6", value="USBLC6-2SC6", footprint="Package_TO_SOT_SMD:SOT-23-6",
             x=58.42, y=50.8, nets={1: "USB_DN", 6: "USB_D-", 3: "USB_DP", 4: "USB_D+", 5: "VBUS", 2: "GND"},
             fields={"MF": "STMicroelectronics", "MP": "USBLC6-2SC6"}),
        R("R101", "5.1k", 83.82, 76.2, "CC1", "GND"),
        R("R102", "5.1k", 93.98, 76.2, "CC2", "GND"),
        C("C101", "0.1uF", 73.66, 30.48, "VBUS"),
        dict(ref="D106", lib_id="Diode:SMF5V0A", value="SMF5.0A", footprint="Diode_SMD:D_SMF", x=60.96, y=30.48, rot=270,
             nets={1: "VBUS", 2: "GND"}, fields={"MF": "Littelfuse", "MP": "SMF5.0A", "ALT": "Vishay SMF5V0A"},
             description="VBUS surge clamp: 5 V working, 9.2 V clamp (charger IN abs. max 7 V)"),
        dict(ref="F101", lib_id="Device:Polyfuse", value="1.5A", footprint="Fuse:Fuse_1812_4532Metric", x=90.17, y=33.02, rot=90, pwr_stub={"1": 5.08, "2": 5.08},
             nets={1: "VBUS", 2: "+5V_USB"}, fields={"MF": "Bourns", "MP": "MF-MSMF150/24X-2"}),
        C("C102", "1uF", 104.14, 53.34, "+5V_USB", fp=C0603),
        FLAG("#FLG101", 38.1, 86.36, "GND"), FLAG("#FLG102", 48.26, 86.36, "VBUS"), FLAG("#FLG103", 63.5, 86.36, "+5V_USB"),
    ],
    label_nets={"CC1", "CC2"})

charger = BLOCK(
    "BATTERY CHARGER + POWER PATH (MCP73871)", [
        "Charges the 1S Li-ion pack (4.20 V) at up to 1 A and powers the robot (VSYS) at the same time, from USB or the pack.",
        "VPCC divider: charging backs off if USB sags below 4.5 V. JP101 SEL: 1-2 = adapter mode 1.65 A (default), 2-3 = USB 500 mA."],
    (132.08, 15.24), (167.64, 96.52), [
        dict(ref="U102", lib_id="Battery_Management:MCP73871-2CC", value="MCP73871-2CCI/ML",
             footprint="Package_DFN_QFN:QFN-20-1EP_4x4mm_P0.5mm_EP2.5x2.5mm_ThermalVias", x=106.68, y=55.88,
             nets={1: "VSYS", 20: "VSYS", 2: "CHG_VPCC", 3: "CHG_SEL", 4: "+5V_USB", 17: "+5V_USB", 18: "+5V_USB", 19: "+5V_USB",
                   5: "CHG_THERM", 6: "CHG_PG", 7: "CHG_STAT2", 8: "CHG_STAT1", 9: "+5V_USB", 10: "GND", 11: "GND", 21: "GND",
                   12: "CHG_PROG3", 13: "CHG_PROG1", 14: "+BATT", 15: "+BATT", 16: "+BATT"},
             fields={"MF": "Microchip", "MP": "MCP73871-2CCI/ML"},
             description="TE (pin 9) tied high: safety timer off for the large 2P pack. CE and PROG2 tied high."),
        R("R104", "267k", 17.78, 36.83, "+5V_USB", "CHG_VPCC", description="VPCC divider top, 1%"),
        R("R121", "100k", 17.78, 44.45, "CHG_VPCC", "GND", description="VPCC divider bottom, 1%: 1.23 V x 3.67 = 4.51 V"),
        dict(ref="JP101", lib_id="Jumper:SolderJumper_3_Bridged12", value="SEL", mirror="x", no_bom=True,
             footprint="Jumper:SolderJumper-3_P1.3mm_Bridged12_RoundedPad1.0x1.5mm", x=33.02, y=49.53,
             nets={1: "+5V_USB", 2: "CHG_SEL", 3: "GND"},
             description="1-2 bridged (default): SEL high, adapter mode. Cut, bridge 2-3: USB mode 500 mA."),
        R("R105", "1k", 45.72, 54.61, "CHG_PROG1", "GND", description="PROG1 1k: 1 A charge current"),
        R("R106", "10k", 55.88, 59.69, "CHG_PROG3", "GND", description="PROG3 10k: 100 mA end-of-charge"),
        R("R103", "10k", 66.04, 64.77, "CHG_THERM", "GND", description="THERM fixed 10k = 0.5 V: no pack thermistor"),
        C("C103", "10uF", 137.16, 48.26, "VSYS", fp=C0603, description="16 V X5R"),
        C("C104", "4.7uF", 147.32, 48.26, "+BATT", fp=C0805),
    ],
    notes=[("4.5 V\nthreshold", 12.7, 57.15), ("SEL jumper", 27.94, 58.42), ("1 A\ncharge", 43.18, 66.04),
           ("100 mA\nend", 53.34, 71.12), ("no\nthermistor", 63.5, 76.2),
           ("TE, CE, PROG2 tied high: safety timer off (big pack), charger on.", 68.58, 90.17),
           ("+BATT: battery after the\ninput protection", 148.59, 86.36)])

chg_leds = BLOCK(
    "CHARGE STATUS LEDS", [
        "Driven by the charger: red = charging, green = charge complete, blue = USB power present."],
    (304.8, 15.24), (99.06, 96.52), [
        LED("D101", "RED", "LTST-C191KRKT", 20.32, 33.02, "+5V_USB", "LED_CHG_K"),
        R("R107", "1k", 20.32, 45.72, "LED_CHG_K", "CHG_STAT1"),
        LED("D102", "GREEN", "LTST-C191KGKT", 48.26, 33.02, "+5V_USB", "LED_FULL_K"),
        R("R108", "1k", 48.26, 45.72, "LED_FULL_K", "CHG_STAT2"),
        LED("D103", "BLUE", "LTST-C191TBKT", 76.2, 33.02, "+5V_USB", "LED_PG_K"),
        R("R109", "1k", 76.2, 45.72, "LED_PG_K", "CHG_PG"),
    ],
    notes=[("charging", 15.24, 78.74), ("charged", 43.18, 78.74), ("USB power", 69.85, 78.74)])

pwr_switch = BLOCK(
    "ON/OFF SWITCH", [
        "Switch ON grounds the P-FET gates: Q101 passes VSYS to VSYS_SW (3.3 V, buzzer, boost enable) and Q102 connects the pack to the boost.",
        "Switch OFF: R110 holds both gates high, so everything including VMOT is off (charging still works)."],
    (15.24, 116.84), (111.76, 76.2), [
        dict(ref="Q101", lib_id="Transistor_FET:AO3401A", value="AO3401A", footprint="Package_TO_SOT_SMD:SOT-23",
             x=55.88, y=45.72, rot=270, pwr_stub={"2": 5.08, "3": 5.08}, nets={1: "PWR_EN_N", 2: "VSYS", 3: "VSYS_SW"}, fields={"MF": "Alpha & Omega", "MP": "AO3401A"}),
        R("R110", "100k", 55.88, 27.94, "VSYS", "PWR_EN_N"),
        dict(ref="SW101", lib_id="Switch:SW_SPDT", value="ON/OFF", footprint="Button_Switch_SMD:SW_SPDT_CK_JS102011SAQN",
             x=78.74, y=36.83, nets={2: "PWR_EN_N", 3: "GND"}, fields={"MF": "C&K", "MP": "JS102011SAQN"}),
        C("C105", "10uF", 81.28, 58.42, "VSYS_SW", fp=C0805),
        C("C106", "0.1uF", 91.44, 58.42, "VSYS_SW"),
        FLAG("#FLG105", 96.52, 38.1, "VSYS_SW"),
    ])

vbat_sense = BLOCK(
    "BATTERY VOLTAGE SENSE", [
        "100k / 100k halves the pack voltage for the ESP32 ADC (IO4)."],
    (132.08, 116.84), (55.88, 76.2), [
        R("R117", "100k", 17.78, 25.4, "+BATT", "VBAT_SENSE"),
        R("R118", "100k", 17.78, 33.02, "VBAT_SENSE", "GND"),
        C("C120", "0.1uF", 5.08, 33.02, "VBAT_SENSE"),
    ])

pwr_leds = BLOCK(
    "POWER LEDS", [
        "Green = 3.3 V rail on. Red = motor rail (VMOT) on."],
    (193.04, 116.84), (50.8, 76.2), [
        LED("D104", "GREEN", "LTST-C191KGKT", 15.24, 25.4, "+3V3", "LED_SYS_K"),
        R("R119", "1k", 15.24, 38.1, "LED_SYS_K", "GND"),
        LED("D105", "RED", "LTST-C191KRKT", 35.56, 25.4, "VMOT", "LED_MOT_K"),
        R("R120", "2.2k", 35.56, 38.1, "LED_MOT_K", "GND"),
    ])

testpts = BLOCK(
    "TEST POINTS", [
        "1 mm pads for bring-up measurements."],
    (248.92, 116.84), (50.8, 76.2), [
        TP("TP101", 7.62, 25.4, "+3V3"), TP("TP102", 22.86, 25.4, "VMOT"), TP("TP103", 38.1, 25.4, "+BATT"),
        TP("TP105", 7.62, 45.72, "VSYS_SW"), TP("TP104", 22.86, 50.8, "GND"),
    ])

mech = BLOCK(
    "MECHANICAL", [
        "M2 mounting holes (same places as V1) and fiducials for assembly."],
    (304.8, 116.84), (99.06, 76.2), [
        dict(ref="H101", lib_id="Mechanical:MountingHole", value="M2", footprint="MountingHole:MountingHole_2.2mm_M2", no_bom=True, x=10.16, y=22.86),
        dict(ref="H102", lib_id="Mechanical:MountingHole", value="M2", footprint="MountingHole:MountingHole_2.2mm_M2", no_bom=True, x=33.02, y=22.86),
        dict(ref="H103", lib_id="Mechanical:MountingHole", value="M2", footprint="MountingHole:MountingHole_2.2mm_M2", no_bom=True, x=55.88, y=22.86),
        dict(ref="H104", lib_id="Mechanical:MountingHole", value="M2", footprint="MountingHole:MountingHole_2.2mm_M2", no_bom=True, x=78.74, y=22.86),
    ] + [dict(ref=f"FID10{i}", lib_id="Mechanical:Fiducial", value="Fiducial", footprint="Fiducial:Fiducial_1mm_Mask2mm", no_bom=True,
              x=10.16 + 22.86 * ((i - 1) % 4), y=40.64 + 15.24 * ((i - 1) // 4), hide_value=True) for i in range(1, 4)])

buck_boost = BLOCK(
    "3.3 V REGULATOR (TPS63001 BUCK-BOOST)", [
        "Fixed 3.3 V from VSYS_SW (1.8-5.5 V in): holds 3.3 V from a full cell, a flat cell or USB.",
        "R111/C107 filter the control supply (VINA). PS/SYNC low = power-save mode at light load."],
    (15.24, 198.12), (109.22, 83.82), [
        dict(ref="U103", lib_id="Regulator_Switching:TPS63001", value="TPS63001DRCR",
             footprint="Package_SON:Texas_DRC0010J_ThermalVias", x=66.04, y=45.72,
             nets={1: "+3V3", 2: "BB_L2", 3: "GND", 4: "BB_L1", 5: "VSYS_SW", 6: "VSYS_SW", 7: "GND", 8: "BB_VINA", 9: "GND", 10: "+3V3", 11: "GND"},
             fields={"MF": "Texas Instruments", "MP": "TPS63001DRCR"}),
        dict(ref="L101", lib_id="Device:L", value="2.2uH", footprint="Inductor_SMD:L_Bourns-SRN4018", x=48.26, y=50.8,
             nets={1: "BB_L1", 2: "BB_L2"}, fields={"MF": "Bourns", "MP": "SRN4018-2R2M"}),
        R("R111", "100", 20.32, 38.1, "VSYS_SW", "BB_VINA", rot=90),
        C("C107", "0.1uF", 30.48, 41.91, "BB_VINA"),
        FLAG("#FLG104", 38.1, 30.48, "BB_VINA"),
        C("C108", "10uF", 8.89, 58.42, "VSYS_SW", fp=C0805),
        C("C109", "22uF", 88.9, 45.72, "+3V3", fp=C0805),
        C("C110", "22uF", 99.06, 45.72, "+3V3", fp=C0805),
    ],
    notes=[("L101: 2.2 uH, SRN4018", 33.02, 68.58), ("input", 5.08, 68.58), ("output", 88.9, 55.88)])

boost = BLOCK(
    "5.5 V MOTOR / SERVO SUPPLY (TPS61089 BOOST)", [
        "Boosts the pack (3.0-4.2 V) to VMOT = 5.5 V for the motor driver and servos. Q102 disconnects the pack when the switch is OFF (a disabled TPS61089 still passes VBAT to VMOT through its body diode).",
        "R113/R114 set 5.5 V; R115 sets ~500 kHz; R116 sets a 5.15 A switch limit; R112/C115/C116 stabilise the loop."],
    (129.54, 198.12), (170.18, 83.82), [
        dict(ref="U104", lib_id="Regulator_Switching:TPS61089", value="TPS61089RNRR",
             footprint="Package_DFN_QFN:Texas_VQFN-RNR0011A-11", x=71.12, y=45.72,
             nets={1: "BST_FSW", 2: "BST_VCC", 3: "BST_FB", 4: "BST_COMP", 5: "GND", 6: "VMOT", 7: "VSYS_SW",
                   8: "BST_ILIM", 9: "BST_VIN", 10: "BST_BOOT", 11: "BST_SW"},
             fields={"MF": "Texas Instruments", "MP": "TPS61089RNRR"}),
        dict(ref="Q102", lib_id="RoboCoreV2:SI7655DN", value="SI7655DN", footprint="Package_SO:Vishay_PowerPAK_1212-8_Single",
             x=10.16, y=35.56, rot=270, pwr_stub={"1": 2.54}, nets={4: "PWR_EN_N", 1: "+BATT", 2: "+BATT", 3: "+BATT", 5: "BST_VIN"},
             fields={"MF": "Vishay", "MP": "SI7655DN-T1-GE3"}, description="Boost input switch, gate = PWR_EN_N (on with the slide switch)"),
        dict(ref="L102", lib_id="Device:L", value="2.2uH", footprint="RoboCoreV2:L_Bourns_SRP5030CA", x=35.56, y=38.1, rot=90,
             datasheet="https://www.bourns.com/docs/product-datasheets/srp5030ca.pdf",
             nets={1: "BST_VIN", 2: "BST_SW"}, fields={"MF": "Bourns", "MP": "SRP5030CA-2R2M", "ALT": "Coilcraft XAL5030-222MEC"}),
        C("C114", "0.1uF", 58.42, 41.91, "BST_BOOT", "BST_SW", rot=180, fields_at=(-2.54, -1.27, "right")),
        R("R115", "300k", 43.18, 44.45, "BST_FSW", "BST_SW", rot=180, description="FSW ~516 kHz", fields_at=(2.03, 0.635, "left")),
        C("C111", "22uF", 20.32, 45.72, "BST_VIN", fp=C1206, fields_at=(2.03, -1.27, "left")),
        C("C112", "0.1uF", 30.48, 45.72, "BST_VIN"),
        FLAG("#FLG106", 25.4, 33.02, "BST_VIN"),
        C("C113", "2.2uF", 86.36, 57.15, "BST_VCC", fp=C0603),
        R("R116", "200k", 96.52, 54.61, "BST_ILIM", "GND", description="ILIM 1,030,000/R = 5.15 A"),
        R("R112", "9.1k", 106.68, 52.07, "BST_COMP", "BST_RC"),
        C("C115", "10nF", 106.68, 59.69, "BST_RC"),
        C("C116", "22pF", 116.84, 52.07, "BST_COMP"),
        R("R113", "300k", 127.0, 39.37, "VMOT", "BST_FB", description="VOUT = 1.212 V x (1 + 300k/84.5k) = 5.51 V"),
        R("R114", "84.5k", 127.0, 46.99, "BST_FB", "GND"),
        C("C117", "22uF", 139.7, 45.72, "VMOT", fp=C1206),
        C("C118", "22uF", 149.86, 45.72, "VMOT", fp=C1206),
        C("C119", "22uF", 160.02, 45.72, "VMOT", fp=C1206),
    ],
    notes=[("input switch + caps", 7.62, 55.88), ("loop comp.", 104.14, 71.12), ("sets 5.5 V", 123.19, 58.42), ("output", 146.05, 55.88)],
    label_at={"Q102.4": (0, -1)})

batprot = BLOCK(
    "BATTERY INPUT PROTECTION (REVERSE + OVER-VOLTAGE)", [
        "Q103/Q104 back to back: off by default, so a reversed or 2S/3S pack never reaches the board; both ways on when the pack is OK (charging).",
        "Q105 switches them on only if XT30+ is positive (D107 blocks a reversed pack; R123/C121 delay ~40 ms so U105 starts first).",
        "U105 (TPS3700) pulls the enable low above 4.6 V on the common source: 0.4 V x (1 + 1M / 95.3k). Rated to 4S (16.8 V), reversed to 3S."],
    (304.8, 198.12), (99.06, 83.82), [
        CONN("J102", 2, "XT30UPB-M", "RoboCoreV2:AMASS_XT30UPB-M_1x02_P5.0mm_Vertical", 10.16, 38.1,
             {1: "GND", 2: "BAT_RAW"}, mirror="y", fields={"MF": "AMASS", "MP": "XT30UPB-M"},
             description="1S Li-ion pack only (cells in parallel, protection board in the pack)"),
        dict(ref="Q103", lib_id="RoboCoreV2:SI7655DN", value="SI7655DN", footprint="Package_SO:Vishay_PowerPAK_1212-8_Single",
             x=33.02, y=40.64, rot=90, nets={5: "BAT_RAW", 1: "BATP_S", 2: "BATP_S", 3: "BATP_S", 4: "BATP_G"},
             fields={"MF": "Vishay", "MP": "SI7655DN-T1-GE3"}, description="Reverse/over-voltage switch, battery side"),
        dict(ref="Q104", lib_id="RoboCoreV2:SI7655DN", value="SI7655DN", footprint="Package_SO:Vishay_PowerPAK_1212-8_Single",
             x=55.88, y=43.18, rot=270, nets={5: "+BATT", 1: "BATP_S", 2: "BATP_S", 3: "BATP_S", 4: "BATP_G"},
             fields={"MF": "Vishay", "MP": "SI7655DN-T1-GE3"}, description="Reverse/over-voltage switch, board side"),
        R("R122", "100k", 66.04, 50.8, "BATP_S", "BATP_G", description="holds Q103/Q104 off"),
        dict(ref="Q105", lib_id="Transistor_FET:AO3400A", value="AO3400A", footprint="Package_TO_SOT_SMD:SOT-23",
             x=44.45, y=60.96, nets={1: "BATP_EN", 2: "GND", 3: "BATP_G"}, fields={"MF": "Alpha & Omega", "MP": "AO3400A"}),
        dict(ref="D107", lib_id="Diode:1N4148WS", value="1N4148WS", footprint="Diode_SMD:D_SOD-323", x=17.78, y=55.88, rot=90,
             nets={2: "BAT_RAW", 1: "BATP_D"}, fields={"MF": "Vishay", "MP": "1N4148WS-E3-08", "ALT": "any 1N4148WS (SOD-323)"},
             description="blocks a reversed pack from the enable"),
        R("R123", "100k", 27.94, 60.96, "BATP_D", "BATP_EN", rot=90),
        R("R124", "330k", 35.56, 68.58, "BATP_EN", "GND"),
        C("C121", "1uF", 25.4, 68.58, "BATP_EN", description="25 V X5R: turn-on delay"),
        dict(ref="U105", lib_id="RoboCoreV2:TPS3700", value="TPS3700", footprint="Package_TO_SOT_SMD:TSOT-23-6", x=78.74, y=60.96,
             nets={5: "BATP_S", 2: "GND", 4: "BATP_OV", 3: "BATP_OV", 6: "BATP_EN"},
             fields={"MF": "Texas Instruments", "MP": "TPS3700DDCR"}, description="OUTB low when INB- > 0.4 V; OUTA/INA+ unused"),
        R("R125", "1M", 66.04, 63.5, "BATP_S", "BATP_OV", description="1%"),
        R("R126", "95.3k", 66.04, 73.66, "BATP_OV", "GND", description="1%: trip at 4.6 V"),
        C("C122", "0.1uF", 91.44, 58.42, "BATP_S", description="25 V"),
        FLAG("#FLG107", 76.2, 45.72, "BATP_S"),
    ],
    notes=[("1S only", 7.62, 48.26), ("trip 4.6 V", 71.12, 78.74)])

# =========================================================================== MCU
GPIO = {1: "GND", 2: "+3V3", 3: "EN", 4: "VBAT_SENSE", 5: "MOTA_ISENSE", 6: "MOTB_ISENSE", 7: "IR_L", 8: "ENC1_A", 9: "ENC1_B",
        10: "ENC2_A", 11: "ENC2_B", 12: "I2C_SDA", 13: "USB_D-", 14: "USB_D+", 15: "EXP_IO3", 17: "I2C_SCL", 18: "IR_C",
        19: "MOTA_IN1", 20: "MOTA_IN2", 21: "MOTB_IN1", 22: "MOTB_IN2", 23: "MOT_NFAULT", 24: "BUZZER", 25: "RGB_DATA",
        27: "BOOT", 28: "SERVO3", 29: "SERVO4", 30: "EXP_IO37", 31: "SERVO1", 32: "SERVO2", 33: "US_TRIG", 34: "US_ECHO",
        35: "USER_BTN", 36: "UART_RX", 37: "UART_TX", 38: "IR_R", 39: "IMU_INT1", 40: "GND", 41: "GND"}

esp = BLOCK(
    "ESP32-S3 MODULE", [
        "ESP32-S3-WROOM-1-N8R2: 8 MB flash, 2 MB quad PSRAM. USB D+/D- go straight to the module (upload + debug, no USB-UART chip).",
        "IO35-37 are free on N8R2 (quad PSRAM; IO35/36 drive servo 3/4); an R8 (octal PSRAM) module would use them. IO45/IO46 are strapping pins: left open."],
    (15.24, 15.24), (190.5, 132.08), [
        dict(ref="U201", lib_id="RF_Module:ESP32-S3-WROOM-1", value="ESP32-S3-WROOM-1-N8R2", footprint="RF_Module:ESP32-S3-WROOM-1",
             x=76.2, y=76.2, nets=GPIO, fields={"MF": "Espressif", "MP": "ESP32-S3-WROOM-1-N8R2", "ALT": "ESP32-S3-WROOM-1-N16R2 or -N8 (never R8/R16V: octal PSRAM uses IO35-37)"}),
        C("C201", "22uF", 124.46, 33.02, "+3V3", fp=C0805),
        C("C202", "0.1uF", 134.62, 33.02, "+3V3"),
    ],
    notes=[("GPIO MAP", 116.84, 50.8, 1.5),
           ("IO0  BOOT button\nIO1  IMU INT1\nIO2  IR right (ADC)\nIO3  expansion\nIO4  battery / 2 (ADC)\n"
            "IO5, IO6  motor 1/2 current\nIO7  IR left (ADC)\nIO8, IO9  I2C SDA, SCL\nIO10  IR centre (ADC)\n"
            "IO11, IO12  motor 1 IN1, IN2\nIO13, IO14  motor 2 IN1, IN2", 116.84, 57.15, 1.27),
           ("IO15, IO16  encoder 1 A, B\nIO17, IO18  encoder 2 A, B\nIO19, IO20  USB D-, D+\nIO21  motor nFAULT\n"
            "IO35-37  expansion\nIO38, IO39  servo 1, 2\nIO40, IO41  ultrasonic\nIO42  USER button\n"
            "IO43, IO44  UART TX, RX\nIO47  buzzer\nIO48  RGB LED", 152.4, 57.15, 1.27)])

buttons = BLOCK(
    "RESET / BOOT / USER BUTTONS", [
        "RESET (EN) restarts the ESP32. Hold BOOT (IO0) and tap RESET to force USB download mode.",
        "USER (IO42) is free for your code. Each button pulls its line to GND; 10k pull-ups hold it high."],
    (15.24, 152.4), (111.76, 63.5), [
        R("R201", "10k", 15.24, 25.4, "+3V3", "EN"),
        SW("SW201", "RESET", 15.24, 43.18, "EN", "GND"),
        C("C203", "1uF", 27.94, 39.37, "EN"),
        R("R202", "10k", 55.88, 25.4, "+3V3", "BOOT"),
        SW("SW202", "BOOT", 55.88, 43.18, "BOOT", "GND"),
        R("R203", "10k", 86.36, 25.4, "+3V3", "USER_BTN"),
        SW("SW203", "USER", 86.36, 43.18, "USER_BTN", "GND"),
    ],
    notes=[("C203: reset delay", 22.86, 55.88)])

i2c = BLOCK(
    "I2C BUS + QWIIC", [
        "4.7k pull-ups on SDA (IO8) / SCL (IO9). Qwiic socket (JST SH 4-pin, 3.3 V) for extra I2C sensors."],
    (15.24, 220.98), (111.76, 60.96), [
        R("R207", "4.7k", 15.24, 27.94, "+3V3", "I2C_SDA"),
        R("R208", "4.7k", 33.02, 27.94, "+3V3", "I2C_SCL"),
        CONN("J201", 4, "Qwiic", "Connector_JST:JST_SH_BM04B-SRSS-TB_1x04-1MP_P1.00mm_Vertical", 86.36, 25.4,
             {1: "GND", 2: "+3V3", 3: "I2C_SDA", 4: "I2C_SCL"}, fields={"MF": "JST", "MP": "BM04B-SRSS-TB"}),
    ],
    label_nets={"I2C_SDA", "I2C_SCL"})

rgb = BLOCK(
    "RGB STATUS LED", [
        "WS2812B-2020-V6 addressable RGB LED on IO48 (33R in series). V6 is rated 3.3-5.3 V (older 2020 versions need 3.7 V). DOUT goes to the expansion header to chain more LEDs."],
    (210.82, 15.24), (99.06, 50.8), [
        R("R204", "33", 27.94, 30.48, "RGB_DATA", "RGB_DIN", rot=90),
        dict(ref="D201", lib_id="LED:WS2812B-2020", value="WS2812B-2020", footprint="LED_SMD:LED_WS2812B-2020_PLCC4_2.0x2.0mm",
             x=48.26, y=30.48, nets={1: "RGB_DOUT", 2: "GND", 3: "RGB_DIN", 4: "+3V3"},
             fields={"MF": "Worldsemi", "MP": "WS2812B-2020-V6", "ALT": "V6 only (LCSC C52917434): older WS2812B-2020 and most 2020 clones need VDD >= 3.5 V"}),
        C("C204", "0.1uF", 83.82, 30.48, "+3V3"),
    ])

buzzer = BLOCK(
    "BUZZER", [
        "Magnetic buzzer on VSYS_SW, switched by a low-side N-FET. A PWM tone on IO47 sets the pitch.",
        "D202 absorbs the coil kick-back; R206 keeps the FET off while the ESP32 boots."],
    (210.82, 71.12), (99.06, 71.12), [
        dict(ref="BZ201", lib_id="Device:Buzzer", value="CMT-8504-100-SMT", footprint="Buzzer_Beeper:MagneticBuzzer_CUI_CMT-8504-100-SMT",
             x=53.34, y=33.02, mirror="y", nets={1: "VSYS_SW", 2: "BUZZ_DRV"}, fields={"MF": "Same Sky (CUI)", "MP": "CMT-8504-100-SMT-TR"}),
        dict(ref="D202", lib_id="Diode:1N4148W", value="1N4148W", footprint="Diode_SMD:D_SOD-123", x=71.12, y=33.02, rot=270,
             nets={1: "VSYS_SW", 2: "BUZZ_DRV"}, fields={"MF": "Diodes Inc", "MP": "1N4148W-7-F", "ALT": "onsemi 1N4148W"}),
        dict(ref="Q201", lib_id="Transistor_FET:AO3400A", value="AO3400A", footprint="Package_TO_SOT_SMD:SOT-23",
             x=55.88, y=48.26, nets={1: "BUZZ_GATE", 2: "GND", 3: "BUZZ_DRV"}, fields={"MF": "Alpha & Omega", "MP": "AO3400A"}),
        R("R205", "100", 38.1, 48.26, "BUZZER", "BUZZ_GATE", rot=90),
        R("R206", "100k", 46.99, 57.15, "BUZZ_GATE", "GND"),
    ])

imu = BLOCK(
    "IMU (LSM6DSOX)", [
        "6-axis accelerometer + gyro on I2C, address 0x6A (SA0 = GND). CS high selects I2C. INT1 -> IO1."],
    (210.82, 147.32), (99.06, 81.28), [
        dict(ref="U202", lib_id="Sensor_Motion:LSM6DS3", value="LSM6DSOX", footprint="Package_LGA:LGA-14_3x2.5mm_P0.5mm_LayoutBorder3x4y",
             x=40.64, y=45.72, nets={1: "GND", 2: "GND", 3: "GND", 4: "IMU_INT1", 5: "+3V3", 6: "GND", 7: "GND", 8: "+3V3",
                                     12: "+3V3", 13: "I2C_SCL", 14: "I2C_SDA"},
             fields={"MF": "STMicroelectronics", "MP": "LSM6DSOXTR", "ALT": "LSM6DSO32TR (pin-compatible)"}),
        C("C205", "0.1uF", 81.28, 30.48, "+3V3"),
        C("C206", "0.1uF", 91.44, 30.48, "+3V3"),
    ])

# =========================================================================== MOTORS
driver = BLOCK(
    "DUAL MOTOR DRIVER (DRV8411A)", [
        "Two H-bridges powered from VMOT (5.5 V). Per motor, PWM on IN1/IN2 sets speed and the pair sets direction; all low = coast + sleep.",
        "IPROPI gives a copy of the motor current (200 uA per A) into 16.5k: the ESP32 reads it, and the driver limits each motor to 1.0 A (JST-SH contact rating)."],
    (15.24, 15.24), (190.5, 110.49), [
        dict(ref="U301", lib_id="RoboCoreV2:DRV8411A", value="DRV8411ARTER",
             footprint="Package_DFN_QFN:WQFN-16-1EP_3x3mm_P0.5mm_EP1.68x1.68mm_ThermalVias", x=76.2, y=60.96,
             nets={10: "VMOT", 15: "+3V3", 14: "MOTA_IN1", 13: "MOTA_IN2", 7: "MOTB_IN1", 8: "MOTB_IN2", 6: "MOT_NFAULT",
                   16: "MOTA_P", 2: "MOTA_N", 3: "MOTB_P", 5: "MOTB_N", 12: "MOTA_ISENSE", 9: "MOTB_ISENSE",
                   11: "GND", 1: "GND", 4: "GND", 17: "GND"},
             fields={"MF": "Texas Instruments", "MP": "DRV8411ARTER"}),
        C("C301", "10uF", 12.7, 45.72, "VMOT", fp=C0805),
        C("C302", "0.1uF", 22.86, 45.72, "VMOT"),
        C("C303", "22uF", 33.02, 45.72, "VMOT", fp=C1206),
        R("R303", "10k", 38.1, 72.39, "+3V3", "MOT_NFAULT", rot=90),
        R("R302", "16.5k", 99.06, 71.12, "MOTB_ISENSE", "GND", description="IPROPI 16.5k 1%: ITRIP 1.0 A"),
        C("C305", "1nF", 109.22, 71.12, "MOTB_ISENSE"),
        R("R301", "16.5k", 124.46, 68.58, "MOTA_ISENSE", "GND", description="IPROPI 16.5k 1%: ITRIP 1.0 A"),
        C("C304", "1nF", 134.62, 68.58, "MOTA_ISENSE"),
    ],
    notes=[("ITRIP = VREF / (16.5k x 200 uA/A) = 3.3 / 3.3 = 1.0 A", 96.52, 88.9), ("bulk caps", 15.24, 58.42)])

motor1 = BLOCK(
    "MOTOR 1 (XRP JST-SH 6-PIN)", [
        "XRP motor plug: 1 M+, 2 M-, 3 3.3 V, 4 encoder A, 5 encoder B, 6 GND.",
        "10k pull-ups on the encoder outputs."],
    (210.82, 15.24), (91.44, 53.34), [
        CONN("J301", 6, "MOTOR_1", "Connector_JST:JST_SH_BM06B-SRSS-TB_1x06-1MP_P1.00mm_Vertical", 45.72, 27.94,
             {1: "MOTA_P", 2: "MOTA_N", 3: "+3V3", 4: "ENC1_A", 5: "ENC1_B", 6: "GND"}, fields={"MF": "JST", "MP": "BM06B-SRSS-TB"}),
        R("R304", "10k", 66.04, 33.02, "+3V3", "ENC1_A"),
        R("R305", "10k", 78.74, 33.02, "+3V3", "ENC1_B"),
    ],
    label_nets={"ENC1_A", "ENC1_B"})

motor2 = BLOCK(
    "MOTOR 2 (XRP JST-SH 6-PIN)", [
        "Same plug as motor 1.",
        "10k pull-ups on the encoder outputs."],
    (210.82, 72.39), (91.44, 53.34), [
        CONN("J302", 6, "MOTOR_2", "Connector_JST:JST_SH_BM06B-SRSS-TB_1x06-1MP_P1.00mm_Vertical", 45.72, 27.94,
             {1: "MOTB_P", 2: "MOTB_N", 3: "+3V3", 4: "ENC2_A", 5: "ENC2_B", 6: "GND"}, fields={"MF": "JST", "MP": "BM06B-SRSS-TB"}),
        R("R306", "10k", 66.04, 33.02, "+3V3", "ENC2_A"),
        R("R307", "10k", 78.74, 33.02, "+3V3", "ENC2_B"),
    ],
    label_nets={"ENC2_A", "ENC2_B"})

# =========================================================================== IO CONNECTORS
H = "Connector_PinHeader_2.54mm:PinHeader_1x{:02d}_P2.54mm_Vertical"
S = "Connector_PinSocket_2.54mm:PinSocket_1x{:02d}_P2.54mm_Vertical"

servos = BLOCK(
    "SERVOS", [
        "Four hobby-servo headers (signal, +, -) as on the XRP. Power is VMOT (5.5 V); C401/C402 are local bulk storage.",
        "Servo 1/2 on IO38/IO39, servo 3/4 on IO35/IO36 (all four signals are also on the expansion headers)."],
    (15.24, 15.24), (96.52, 60.96), [
        CONN("J401", 3, "SERVO_1", H.format(3), 30.48, 30.48, {1: "SERVO1_HDR", 2: "VMOT", 3: "GND"}),
        CONN("J402", 3, "SERVO_2", H.format(3), 30.48, 48.26, {1: "SERVO2_HDR", 2: "VMOT", 3: "GND"}),
        CONN("J407", 3, "SERVO_3", H.format(3), 58.42, 30.48, {1: "SERVO3_HDR", 2: "VMOT", 3: "GND"}),
        CONN("J408", 3, "SERVO_4", H.format(3), 58.42, 48.26, {1: "SERVO4_HDR", 2: "VMOT", 3: "GND"}),
        C("C401", "22uF", 81.28, 33.02, "VMOT", fp=C1206),
        C("C402", "22uF", 81.28, 50.80, "VMOT", fp=C1206),
    ])

ultra = BLOCK(
    "ULTRASONIC SENSOR", [
        "HC-SR04-type ultrasonic module on a 4-pin 2.54 mm header: 3V3, TRIG, ECHO, GND (the HC-SR04 pin order,",
        "so a straight cable works). Use a 3.3 V-capable module (HC-SR04+, RCWL-1601). Header again since 2026-10-08."],
    (116.84, 15.24), (101.6, 60.96), [
        CONN("J403", 4, "ULTRASONIC", H.format(4), 50.8, 25.4,
             {1: "+3V3", 2: "US_TRIG_HDR", 3: "US_ECHO_HDR", 4: "GND"}),
    ])

linef = BLOCK(
    "LINE FOLLOWER (3-CHANNEL IR)", [
        "3-channel IR line-follower module (TCRT5000 type) on a 5-pin 2.54 mm header: 3V3, GND, L, C, R.",
        "Analog outputs to ADC1: IO7 left, IO10 centre, IO2 right. Header again since 2026-10-08."],
    (223.52, 15.24), (101.6, 60.96), [
        CONN("J404", 5, "LINE_FOLLOWER", H.format(5), 50.8, 25.4,
             {1: "+3V3", 2: "GND", 3: "IR_L_HDR", 4: "IR_C_HDR", 5: "IR_R_HDR"}),
    ])

exp_a = BLOCK(
    "EXPANSION HEADER A", [
        "Female 2.54 mm header: the sensor, servo, buzzer and LED signals, for prototyping."],
    (15.24, 81.28), (96.52, 76.2), [
        CONN("J405", 14, "EXPANSION_A", S.format(14), 50.8, 22.86,
             {1: "+3V3", 2: "GND", 3: "IR_L_HDR", 4: "IR_C_HDR", 5: "IR_R_HDR", 6: "US_TRIG_HDR", 7: "US_ECHO_HDR", 8: "SERVO1_HDR", 9: "SERVO2_HDR",
              10: "BUZZER", 11: "RGB_DOUT", 12: "EXP_IO3_HDR", 13: "VMOT", 14: "GND"}),
    ])

exp_b = BLOCK(
    "EXPANSION HEADER B", [
        "Female 2.54 mm header: I2C, UART0, servo 3/4 signals (IO35/IO36), spare IO37, IMU interrupt, USER button, EN and VSYS_SW."],
    (116.84, 81.28), (101.6, 76.2), [
        CONN("J406", 14, "EXPANSION_B", S.format(14), 50.8, 22.86,
             {1: "+3V3", 2: "GND", 3: "I2C_SDA", 4: "I2C_SCL", 5: "UART_TX_HDR", 6: "UART_RX_HDR", 7: "SERVO3_HDR", 8: "SERVO4_HDR",
              9: "EXP_IO37_HDR", 10: "IMU_INT1", 11: "USER_BTN", 12: "EN", 13: "VSYS_SW", 14: "GND"}),
    ])

protect = BLOCK(
    "HEADER PROTECTION", [
        "330R in series with every ESP32 pin that leaves the board: limits the current if a pin is shorted to a rail or zapped.",
        "Nets ending in _HDR are the connector side."],
    (15.24, 162.56), (203.2, 71.12), [
        R("R401", "330", 33.02, 27.94, "SERVO1", "SERVO1_HDR", rot=90),
        R("R402", "330", 33.02, 35.56, "SERVO2", "SERVO2_HDR", rot=90),
        R("R403", "330", 33.02, 43.18, "US_TRIG", "US_TRIG_HDR", rot=90),
        R("R404", "330", 33.02, 50.80, "US_ECHO", "US_ECHO_HDR", rot=90),
        R("R405", "330", 33.02, 58.42, "IR_L", "IR_L_HDR", rot=90),
        R("R406", "330", 99.06, 27.94, "IR_C", "IR_C_HDR", rot=90),
        R("R407", "330", 99.06, 35.56, "IR_R", "IR_R_HDR", rot=90),
        R("R408", "330", 99.06, 43.18, "EXP_IO3", "EXP_IO3_HDR", rot=90),
        R("R409", "330", 99.06, 50.80, "SERVO3", "SERVO3_HDR", rot=90),
        R("R410", "330", 99.06, 58.42, "SERVO4", "SERVO4_HDR", rot=90),
        R("R411", "330", 165.10, 27.94, "EXP_IO37", "EXP_IO37_HDR", rot=90),
        R("R412", "330", 165.10, 35.56, "UART_TX", "UART_TX_HDR", rot=90),
        R("R413", "330", 165.10, 43.18, "UART_RX", "UART_RX_HDR", rot=90),
    ])

SHEETS = [
    dict(title="Power", file="power.kicad_sch", uuid="80f846ad-ef74-4e4c-a27b-799718835af2", paper="A2",
         blocks=[usb_in, charger, chg_leds, pwr_switch, vbat_sense, pwr_leds, testpts, mech, buck_boost, boost, batprot],
         summary=["USB-C in, 1 A Li-ion charger with power path,", "ON/OFF switch, 3.3 V buck-boost, 5.5 V boost (VMOT)."]),
    dict(title="MCU", file="mcu.kicad_sch", uuid="c779f82d-ebf4-4734-a128-1a0a621acf25",
         blocks=[esp, buttons, i2c, rgb, buzzer, imu],
         summary=["ESP32-S3 module, buttons, RGB LED, buzzer,", "LSM6DSOX IMU, I2C pull-ups + Qwiic."]),
    dict(title="Motors", file="motors.kicad_sch", uuid="2b0301c1-476a-4367-9fe7-b5388e9f042f",
         blocks=[driver, motor1, motor2],
         summary=["DRV8411A dual H-bridge with current sense,", "two XRP motor connectors with encoders."]),
    dict(title="IO connectors", file="io.kicad_sch", uuid="5fbebdb8-a863-42ce-9c70-c54585cc4446",
         blocks=[servos, ultra, linef, exp_a, exp_b, protect],
         summary=["Servos, ultrasonic, line follower,", "two 14-pin expansion headers."]),
]

# LCSC numbers for PCBWay / JLC assembly (stock checked 2026-10-05, see docs/RoboCore_V2_sourcing.md).
# Passives and the 2.54 mm headers are generic: their part numbers are picked when the production BOM is made.
LCSC_PN = {
    "ESP32-S3-WROOM-1-N8R2": "C2913204", "DRV8411ARTER": "C18816315", "TPS63001DRCR": "C28060", "TPS61089RNRR": "C165129",
    "MCP73871-2CCI/ML": "C5121473", "TPS3700DDCR": "C33002", "1N4148WS-E3-08": "C129905", "LSM6DSOXTR": "C481766", "USBLC6-2SC6": "C7519", "AO3401A": "C15127", "AO3400A": "C20917",
    "SI7655DN-T1-GE3": "C727830", "1N4148W-7-F": "C83528", "SMF5.0A": "C151296", "MF-MSMF150/24X-2": "C78695",
    "TYPE-C-31-M-12": "C165948", "XT30UPB-M": "C428721", "BM06B-SRSS-TB": "C160392", "BM04B-SRSS-TB": "C160390", "BM05B-SRSS-TB": "C160391",
    "SKQGADE010": "C116647", "JS102011SAQN": "C221660", "CMT-8504-100-SMT-TR": "C22359707", "SRN4018-2R2M": "C913207",
    "SRP5030CA-2R2M": "C2046809", "LTST-C191KRKT": "C125099", "LTST-C191KGKT": "C125098", "LTST-C191TBKT": "C99290",
    "WS2812B-2020-V6": "C52917434",
}
# Generic parts pinned to exact, cheap, in-stock LCSC parts (checked 2026-10-07). PCBWay's V1 quote showed what happens
# without them: it picked automotive / anti-surge parts at 10-100x the price, and bought an MPU-6050 for a capacitor
# whose description mentioned the MPU-6050. (Device, value, size) -> (manufacturer, MPN, LCSC).
PASSIVES = {
    # 0402 resistors, 1 %, 62.5 mW (main board)
    ("R", "5.1k", "0402"): ("UNI-ROYAL", "0402WGF5101TCE", "C25905"), ("R", "10k", "0402"): ("UNI-ROYAL", "0402WGF1002TCE", "C25744"),
    ("R", "267k", "0402"): ("UNI-ROYAL", "0402WGF2673TCE", "C270622"), ("R", "1k", "0402"): ("YAGEO", "RC0402FR-071KL", "C106235"),
    ("R", "100k", "0402"): ("UNI-ROYAL", "0402WGF1003TCE", "C25741"), ("R", "100", "0402"): ("YAGEO", "RC0402FR-07100RL", "C106232"),
    ("R", "9.1k", "0402"): ("UNI-ROYAL", "0402WGF9101TCE", "C25926"), ("R", "300k", "0402"): ("UNI-ROYAL", "0402WGF3003TCE", "C25774"),
    ("R", "84.5k", "0402"): ("UNI-ROYAL", "0402WGF8452TCE", "C26988"), ("R", "200k", "0402"): ("UNI-ROYAL", "0402WGF2003TCE", "C25764"),
    ("R", "2.2k", "0402"): ("UNI-ROYAL", "0402WGF2201TCE", "C25879"), ("R", "330k", "0402"): ("UNI-ROYAL", "0402WGF3303TCE", "C25778"),
    ("R", "1M", "0402"): ("UNI-ROYAL", "0402WGF1004TCE", "C26083"), ("R", "95.3k", "0402"): ("UNI-ROYAL", "0402WGF9532TCE", "C26990"),
    ("R", "33", "0402"): ("YAGEO", "RC0402FR-0733RL", "C138002"), ("R", "4.7k", "0402"): ("UNI-ROYAL", "0402WGF4701TCE", "C25900"),
    ("R", "16.5k", "0402"): ("UNI-ROYAL", "0402WGF1652TCE", "C25857"), ("R", "330", "0402"): ("UNI-ROYAL", "0402WGF3300TCE", "C25104"),
    # 0603 resistors, 1 %, 100 mW (sensor boards)
    ("R", "150", "0603"): ("UNI-ROYAL", "0603WAF1500T5E", "C22808"), ("R", "10k", "0603"): ("YAGEO", "RC0603FR-0710KL", "C98220"),
    ("R", "100k", "0603"): ("UNI-ROYAL", "0603WAF1003T5E", "C25803"), ("R", "680", "0603"): ("UNI-ROYAL", "0603WAF6800T5E", "C23228"),
    ("R", "15M", "0603"): ("UNI-ROYAL", "0603WAF1505T5E", "C80615"), ("R", "3.3", "0603"): ("YAGEO", "RC0603FR-073R3L", "C137725"),
    # capacitors (Samsung), rated well above the rail they sit on
    ("C", "0.1uF", "0402"): ("Samsung", "CL05B104KB5NNNC", "C960916"),    # 50 V X7R (VBUS, battery side)
    ("C", "10nF", "0402"): ("Samsung", "CL05B103KB5NNNC", "C15195"),      # 50 V X7R
    ("C", "1nF", "0402"): ("Samsung", "CL05B102KB5NNNC", "C14442"),       # 50 V X7R
    ("C", "22pF", "0402"): ("Samsung", "CL05C220JB5NNNC", "C70464"),      # 50 V C0G
    ("C", "1uF", "0402"): ("Samsung", "CL05A105KA5NNNC", "C16193167"),    # 25 V X5R
    ("C", "1uF", "0603"): ("Samsung", "CL10A105KA8NNNC", "C5673"),        # 25 V X5R (USB 5 V)
    ("C", "2.2uF", "0603"): ("Samsung", "CL10A225KO8NNNC", "C23630"),     # 16 V X5R
    ("C", "10uF", "0603"): ("Samsung", "CL10A106MO8NQNC", "C92487"),      # 16 V X5R
    ("C", "0.1uF", "0603"): ("Samsung", "CL10B104KB8NNNC", "C1591"),      # 50 V X7R
    ("C", "18pF", "0603"): ("Samsung", "CL10C180JB8NNNC", "C1647"),       # 50 V C0G
    ("C", "4.7uF", "0805"): ("Samsung", "CL21A475KAQNNNE", "C1779"),      # 25 V X5R
    ("C", "10uF", "0805"): ("Samsung", "CL21A106KOQNNNE", "C1713"),       # 16 V X5R (5.5 V max rail)
    ("C", "22uF", "0805"): ("Samsung", "CL21A226MAQNNNE", "C45783"),      # 25 V X5R
    ("C", "22uF", "1206"): ("Samsung", "CL31A226KAHNNNE", "C12891"),      # 25 V X5R
}
HEADERS = {   # footprint name -> (manufacturer, MPN, LCSC); heights match the KiCad 3D models (chassis CAD)
    "PinHeader_1x03_P2.54mm_Vertical": ("hanxia", "HX PH254-01-03-Z-L11.5", "C52016391"),   # 6 mm pin, 2.5 mm body, 3 mm tail
    "PinHeader_1x04_P2.54mm_Vertical": ("hanxia", "HX PH254-01-04-Z-L11.5", "C52016392"),   # ultrasonic header J403
    "PinHeader_1x05_P2.54mm_Vertical": ("Hong Cheng", "HC-PZ254-11.5L-1x5PZ", "C27985190"),    # line-follower header J404
    "PinSocket_1x14_P2.54mm_Vertical": ("Hong Cheng", "HC-PM254-8.5H-1x14PZ", "C22373900"),  # 8.5 mm tall
}


def assign_part_numbers(sheets):
    """Fill MF / MP / LCSC on parts that have no MPN: generic R / C from PASSIVES, headers from HEADERS."""
    missing = []
    for sheet in sheets:
        for blk in sheet["blocks"]:
            for p in blk["parts"]:
                f = p.setdefault("fields", {})
                if f.get("MP") or p.get("no_bom") or p.get("ref", "#").startswith("#"):
                    if f.get("MP") in LCSC_PN:
                        f["LCSC"] = LCSC_PN[f["MP"]]
                    continue
                fpn = p.get("footprint", "").split(":")[-1]
                kind = {"Device:R": "R", "Device:C": "C"}.get(p.get("lib_id"))
                hit = PASSIVES.get((kind, p["value"], fpn.split("_")[1] if "_" in fpn else "")) if kind else HEADERS.get(fpn)
                if hit:
                    f["MF"], f["MP"], f["LCSC"] = hit
                else:
                    missing.append(p["ref"])
    return missing


_missing = assign_part_numbers(SHEETS)
if _missing:
    print("spec_v2: no part number for", _missing)

ROOT_NOTES = [("RoboCore V2 - ESP32-S3 robot controller (68 x 60 mm, same outline as V1)", 25.4, 30.48, 2.5),
              ("Parts follow the SparkFun XRP Controller where possible; circuit drawn independently.", 25.4, 36.83, 1.5),
              ("Power flow: USB-C 5 V -> charger -> VSYS -> ON/OFF -> VSYS_SW -> 3.3 V buck-boost and 5.5 V boost (VMOT).", 25.4, 182.88, 1.5),
              ("Battery: 1S Li-ion (cells in parallel) on XT30. Programming: USB-C straight to the ESP32-S3.", 25.4, 187.96, 1.5)]
