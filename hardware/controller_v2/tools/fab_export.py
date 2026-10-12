"""PCBWay order files for the three RoboCore V2 boards (system python3; calls kicad-cli):

  python3 tools/fab_export.py            -> fab/PCBWay_V2_<date>/<board>/

Per board: gerbers + drill zip, BOM in PCBWay's column layout (one exact MPN per line, clean descriptions), placement
(CPL) file, assembly drawings (fab layer, top and bottom) and renders. Lessons from the V1 quote (2026-10-07): every
line carries an exact MPN + LCSC number, and descriptions never mention another part number (PCBWay bought an
MPU-6050 for a capacitor whose note mentioned one).
"""
import csv, datetime, os, re, shutil, subprocess, sys, zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
CLI = "/Applications/KiCad.app/Contents/MacOS/kicad-cli"
DATE = os.environ.get("FAB_DATE", datetime.date.today().isoformat())
OUT = os.path.join(PROJ, "fab", f"PCBWay_V2_{DATE}")

BOARDS = [  # folder, project, label, copper layers
    (".", "RoboCore_V2", "RoboCore_V2_Controller", 4),
    ("sensors/line_sensor", "RoboCore_LineSensor", "RoboCore_LineSensor", 2),
    ("sensors/ultrasonic", "RoboCore_Ultrasonic", "RoboCore_Ultrasonic", 2),
]
THT = ("PinHeader", "PinSocket", "XT30", "TCRT5000", "Ultrasonic_Transducer")

CAPS = {   # MPN -> rating text for the description
    "CL05B104KB5NNNC": "100nF 50V X7R ±10%", "CL05B103KB5NNNC": "10nF 50V X7R ±10%", "CL05B102KB5NNNC": "1nF 50V X7R ±10%",
    "CL05C220JB5NNNC": "22pF 50V C0G ±5%", "CL05A105KA5NNNC": "1uF 25V X5R ±10%", "CL10A105KA8NNNC": "1uF 25V X5R ±10%",
    "CL10A225KO8NNNC": "2.2uF 16V X5R ±10%", "CL10A106MO8NQNC": "10uF 16V X5R ±20%", "CL10B104KB8NNNC": "100nF 50V X7R ±10%",
    "CL10C180JB8NNNC": "18pF 50V C0G ±5%", "CL21A475KAQNNNE": "4.7uF 25V X5R ±10%", "CL21A106KOQNNNE": "10uF 16V X5R ±10%",
    "CL21A226MAQNNNE": "22uF 25V X5R ±20%", "CL31A226KAHNNNE": "22uF 25V X5R ±10%",
}
DESC = {   # MPN -> clean description (function and package only)
    "ESP32-S3-WROOM-1-N8R2": "Wi-Fi/BLE module, 8 MB flash, 2 MB quad PSRAM",
    "LSM6DSOXTR": "6-axis IMU (accelerometer + gyroscope), I2C", "DRV8411ARTER": "Dual H-bridge motor driver, 4 A",
    "TPS63001DRCR": "Buck-boost converter, 3.3 V fixed", "TPS61089RNRR": "Boost converter, 7 A switch",
    "MCP73871-2CCI/ML": "Li-ion charger with power path, 4.20 V charge voltage", "TPS3700DDCR": "Window voltage supervisor",
    "SI7655DN-T1-GE3": "P-channel MOSFET, PowerPAK 1212-8", "AO3400A": "N-channel MOSFET 30 V", "AO3401A": "P-channel MOSFET 30 V",
    "USBLC6-2SC6": "USB ESD protection, 2 lines", "SMF5.0A": "TVS diode 5 V", "1N4148WS-E3-08": "Switching diode",
    "1N4148W-7-F": "Switching diode", "MF-MSMF150/24X-2": "PTC resettable fuse 1.5 A", "TYPE-C-31-M-12": "USB-C receptacle, 16 pin",
    "XT30UPB-M": "Battery connector XT30, male, vertical", "BM04B-SRSS-TB": "JST SH 4-pin vertical header",
    "BM05B-SRSS-TB": "JST SH 5-pin vertical header", "BM06B-SRSS-TB": "JST SH 6-pin vertical header",
    "SKQGADE010": "Tactile switch 5.2 x 5.2 mm", "JS102011SAQN": "Slide switch SPDT, side-actuated",
    "CMT-8504-100-SMT-TR": "Magnetic buzzer 8.5 mm", "SRN4018-2R2M": "Power inductor 2.2 uH", "SRP5030CA-2R2M": "Power inductor 2.2 uH",
    "LTST-C191KRKT": "LED red 0603", "LTST-C191KGKT": "LED green 0603", "LTST-C191TBKT": "LED blue 0603",
    "WS2812B-2020-V6": "Addressable RGB LED 2020", "HX PH254-01-03-Z-L11.5": "Pin header 1x3, 2.54 mm, straight",
    "HC-PM254-8.5H-1x14PZ": "Female socket 1x14, 2.54 mm, 8.5 mm tall", "TCRT5000": "Reflective optical sensor (IR LED + phototransistor)",
    "LM339": "Quad comparator", "CS100A": "Ultrasonic ranging IC, SOP-16", "XC32M4-8.000-F12LJDT": "Crystal 8 MHz 12 pF, 3225",
    "HY40A16T12-1": "Ultrasonic transmitter 40 kHz, 16 mm, open type", "HY40A16R12-1": "Ultrasonic receiver 40 kHz, 16 mm, open type",
}
NOTES = {  # MPN -> note for PCBWay
    "MCP73871-2CCI/ML": "Must be the -2 version (4.20 V). Other suffixes charge to the wrong voltage.",
    "ESP32-S3-WROOM-1-N8R2": "Alternative: -N16R2. Do NOT use R8 / R16V (octal PSRAM) versions.",
    "JS102011SAQN": "LCSC shows 0 stock (2026-10-07); Digi-Key has 54,000+. Lever must overhang the board edge as drawn.",
    "CMT-8504-100-SMT-TR": "LCSC had only 12 (2026-10-07); Digi-Key has 30,000+.",
    "CS100A": "Not stocked at LCSC. Please source in China (AliExpress / 1688 / Taobao, maker Suzhou ShunGuiZhiLian, 100sensor.com). If you cannot, tell us and we will consign it.",
    "HY40A16T12-1": "TRANSMITTER: fit at LS1 only (not interchangeable with the receiver). Mounted on the bottom side; observe + polarity (square pad).",
    "HY40A16R12-1": "RECEIVER: fit at LS2 only. Mounted on the bottom side; observe + polarity (square pad).",
    "TCRT5000": "Through-hole, inserted from the BOTTOM side (sensor faces the floor), body flat against the board, soldered on top. Pin 1 = square pad.",
    "XT30UPB-M": "Through-hole, top side.",
    "HX PH254-01-03-Z-L11.5": "Through-hole, top side, short end in the board (6 mm pin up).",
    "HC-PM254-8.5H-1x14PZ": "Through-hole, top side.",
}


def run(args, cwd):
    r = subprocess.run([CLI] + args, cwd=cwd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"kicad-cli {' '.join(args[:3])} failed:\n{r.stderr[-1500:]}")
    return r.stdout


def describe(value, fp, mpn):
    size = re.search(r"_(\d{4})_", fp)
    if mpn in CAPS:
        return f"Ceramic capacitor {CAPS[mpn]} {size.group(1) if size else ''}".strip()
    if fp.split(":")[-1].startswith("R_"):
        return f"Chip resistor {value}{'' if value[-1].isalpha() else ''} ohm ±1% {size.group(1) if size else ''}".replace("ohm", "Ω").replace(" Ω", "Ω")
    return DESC.get(mpn, value)


def bom(folder, name, label, dest):
    tmp = os.path.join(dest, "_bom.csv")
    run(["sch", "export", "bom", "-o", tmp, "--fields", "Reference,Value,Footprint,MF,MP,LCSC,${QUANTITY}",
         "--labels", "Refs,Value,Footprint,MF,MP,LCSC,Qty", "--group-by", "Value,Footprint,MP", "--sort-field", "Reference",
         f"{name}.kicad_sch"], os.path.join(PROJ, folder))
    raw = list(csv.DictReader(open(tmp, encoding="utf-8")))
    os.remove(tmp)
    rows, by = [], {}          # one line per part number: the servo headers, buttons and SH connectors differ only in label
    for r in raw:
        key = (r["MP"] or r["Value"], r["Footprint"])
        if key not in by:
            by[key] = dict(r, Refs=[], Qty=0, Values=[])
            rows.append(by[key])
        g = by[key]
        g["Refs"] += expand(r["Refs"]); g["Qty"] += int(r["Qty"])
        if r["Value"] not in g["Values"]:
            g["Values"].append(r["Value"])
    nat = lambda x: (re.match(r"[A-Z]+", x).group(0), int(re.search(r"\d+", x).group(0)))
    for g in rows:
        g["Refs"] = ",".join(sorted(g["Refs"], key=nat)); g["Qty"] = str(g["Qty"]); g["Value"] = " / ".join(g["Values"])
    out = os.path.join(dest, f"{label}_BOM.csv")
    refs = []
    missing = []
    with open(out, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["Item #", "Designator", "Qty", "Manufacturer", "Mfg Part #", "Description / Value", "Package/Footprint",
                    "Mounting Type", "LCSC Part #", "Notes"])
        for i, r in enumerate(rows, 1):
            fp = r["Footprint"]
            if not r["MP"]:
                missing.append(r["Refs"])
            mount = "THT" if any(k in fp for k in THT) else "SMD"
            w.writerow([i, r["Refs"], r["Qty"], r["MF"], r["MP"], f'{describe(r["Value"], fp, r["MP"])} ({r["Value"]})',
                        fp.split(":")[-1], mount, r["LCSC"], NOTES.get(r["MP"], "")])
            refs += [x for x in expand(r["Refs"])]
    return out, len(rows), sum(int(r["Qty"]) for r in rows), set(refs), missing, rows


def expand(refs):
    out = []
    for part in refs.split(","):
        m = re.match(r"([A-Z]+)(\d+)-[A-Z]*(\d+)$", part.strip())
        if m:
            out += [f"{m.group(1)}{n}" for n in range(int(m.group(2)), int(m.group(3)) + 1)]
        else:
            out.append(part.strip())
    return out


def cpl(folder, name, label, dest, refs):
    tmp = os.path.join(dest, "_pos.csv")
    run(["pcb", "export", "pos", "-o", tmp, "--format", "csv", "--units", "mm", "--side", "both", "--exclude-dnp", f"{name}.kicad_pcb"],
        os.path.join(PROJ, folder))
    rows = [r for r in csv.DictReader(open(tmp, encoding="utf-8")) if r["Ref"] in refs]
    os.remove(tmp)
    out = os.path.join(dest, f"{label}_CPL.csv")
    with open(out, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["Designator", "Mid X", "Mid Y", "Layer", "Rotation", "Value", "Package"])
        for r in rows:
            w.writerow([r["Ref"], f'{float(r["PosX"]):.3f}mm', f'{float(r["PosY"]):.3f}mm', "Top" if r["Side"] == "top" else "Bottom",
                        f'{float(r["Rot"]):.1f}', r["Val"], r["Package"]])
    return out, len(rows), sorted(refs - {r["Ref"] for r in rows})


def gerbers(folder, name, label, dest, copper):
    g = os.path.join(dest, "gerbers")
    shutil.rmtree(g, ignore_errors=True)
    os.makedirs(g)
    cu = ["F.Cu", "In1.Cu", "In2.Cu", "B.Cu"] if copper == 4 else ["F.Cu", "B.Cu"]
    layers = ",".join(cu + ["F.Paste", "B.Paste", "F.Silkscreen", "B.Silkscreen", "F.Mask", "B.Mask", "Edge.Cuts"])
    pcb = os.path.join(PROJ, folder, f"{name}.kicad_pcb")
    run(["pcb", "export", "gerbers", "-o", g + "/", "--layers", layers, pcb], PROJ)
    run(["pcb", "export", "drill", "-o", g + "/", "--format", "excellon", "--excellon-separate-th", "--excellon-units", "mm",
         "--generate-map", "--map-format", "gerberx2", pcb], PROJ)
    z = os.path.join(dest, f"{label}_gerbers.zip")
    with zipfile.ZipFile(z, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in sorted(os.listdir(g)):
            zf.write(os.path.join(g, f), f)
    return z, sorted(os.listdir(g))


def drawings(folder, name, label, dest):
    pcb = os.path.join(PROJ, folder, f"{name}.kicad_pcb")
    run(["pcb", "export", "pdf", "-o", os.path.join(dest, f"{label}_assembly_top.pdf"), "--layers", "F.Fab,Edge.Cuts",
         "--include-border-title", pcb], PROJ)
    run(["pcb", "export", "pdf", "-o", os.path.join(dest, f"{label}_assembly_bottom.pdf"), "--layers", "B.Fab,Edge.Cuts",
         "--mirror", "--include-border-title", pcb], PROJ)
    for side in ("top", "bottom"):
        run(["pcb", "render", "--side", side, "--quality", "high", "--width", "1800", "--height", "1400",
             "-o", os.path.join(dest, f"{label}_render_{side}.png"), pcb], PROJ)


def main():
    os.makedirs(OUT, exist_ok=True)
    summary = []
    for folder, name, label, copper in BOARDS:
        dest = os.path.join(OUT, label)
        os.makedirs(dest, exist_ok=True)
        b, lines, parts, refs, missing, _ = bom(folder, name, label, dest)
        c, placed, unplaced = cpl(folder, name, label, dest, refs)
        z, files = gerbers(folder, name, label, dest, copper)
        drawings(folder, name, label, dest)
        summary.append(f"{label}: BOM {lines} lines / {parts} parts (no MPN: {missing or 'none'}), CPL {placed} placements"
                       f" (not placed: {unplaced or 'none'}), gerbers {len(files)} files")
    print("\n".join(summary))


if __name__ == "__main__":
    main()
