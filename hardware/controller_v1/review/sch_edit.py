"""Apply the RoboCore V1 power/flashing rework to a copy of the KiCad schematics.

Usage: python3 sch_edit.py <dir-with-copied-schematics>
"""
import re, sys, math, uuid, glob, os
sys.path.insert(0, os.path.dirname(__file__))
from symlib import extract, pins as lib_pins
from schlib import Sheet, blocks

D = sys.argv[1]
KLIB = "/Applications/KiCad.app/Contents/SharedSupport/symbols/"
ROOT = "/4fad5ee2-8ab9-4697-9a8f-c6efe4c71bb3"
ESP = ROOT + "/13ffb710-1363-4d93-be18-8b4e38f0ad43"
MOT = ESP + "/ca77a68e-8244-4425-a730-b0925c25da43"
BTN = ESP + "/712cb781-39c9-4f76-bc62-e98f0a31df4c"

def U(): return str(uuid.uuid4())
def f(v): return ("%.4f" % v).rstrip("0").rstrip(".")

# ---------------------------------------------------------------- numbering
_pwr = [max(int(n) for fn in glob.glob(D + "/*.kicad_sch") for n in re.findall(r'\(reference "#PWR(\d+)"\)', open(fn).read()))]
_flg = [max(int(n) for fn in glob.glob(D + "/*.kicad_sch") for n in re.findall(r'\(reference "#FLG(\d+)"\)', open(fn).read()))]
def next_pwr(): _pwr[0] += 1; return "#PWR%03d" % _pwr[0]
def next_flg(): _flg[0] += 1; return "#FLG%02d" % _flg[0]

# ---------------------------------------------------------------- library cache
def lib_entry(libname, name):
    """Flattened lib_symbols cache entry 'libname:name', indented for lib_symbols."""
    t = open(KLIB + libname + ".kicad_sym").read()
    b = extract(t, name)
    ext = re.search(r'\(extends "([^"]+)"\)', b)
    if ext:
        parent = extract(t, ext.group(1))
        child_props = dict(re.findall(r'\(property "([^"]+)" "((?:[^"\\]|\\.)*)"', b))
        def sub(m):
            k = m.group(1)
            return '(property "%s" "%s"' % (k, child_props[k]) if k in child_props else m.group(0)
        b = re.sub(r'\(property "([^"]+)" "((?:[^"\\]|\\.)*)"', sub, parent)
        b = b.replace('(symbol "%s_' % ext.group(1), '(symbol "%s_' % name)
        b = b.replace('(symbol "%s"' % ext.group(1), '(symbol "%s"' % name, 1)
    b = b.replace('(symbol "%s"' % name, '(symbol "%s:%s"' % (libname, name), 1)
    lines = b.split("\n")
    return "\t\t" + lines[0] + "\n" + "\n".join("\t" + l for l in lines[1:])

def pin_points(libblock, x, y, rot, mirror=None):
    """{num: [(X,Y,outward_dir)]} for a placed symbol. outward_dir in schematic coords: 'R','L','U','D'."""
    out = {}
    for p in lib_pins(libblock):
        px, py = p["x"], -p["y"]
        ang = p["rot"]  # direction from connection point into the body (lib coords, y up)
        dx, dy = round(math.cos(math.radians(ang + 180))), -round(math.sin(math.radians(ang + 180)))
        if mirror == "x": py, dy = -py, -dy
        if mirror == "y": px, dx = -px, -dx
        a = math.radians(rot); c, s = round(math.cos(a)), round(math.sin(a))
        X = x + px * c + py * s; Y = y - px * s + py * c
        DX = dx * c + dy * s; DY = -dx * s + dy * c
        d = {(1, 0): "R", (-1, 0): "L", (0, -1): "U", (0, 1): "D"}[(DX, DY)]
        out.setdefault(p["num"], []).append((round(X, 2), round(Y, 2), d))
    return out

# ---------------------------------------------------------------- item generators
def eff(justify=None, hide=False):
    j = "\n\t\t\t\t(justify %s)" % justify if justify else ""
    return "(effects\n\t\t\t\t(font\n\t\t\t\t\t(size 1.27 1.27)\n\t\t\t\t)%s\n\t\t\t)" % j

def prop(name, value, x, y, hide=False, justify=None):
    h = "\n\t\t\t(hide yes)" if hide else ""
    return ('\t\t(property "%s" "%s"\n\t\t\t(at %s %s 0)%s\n\t\t\t(show_name no)\n\t\t\t(do_not_autoplace no)\n\t\t\t%s\n\t\t)\n'
            % (name, value, f(x), f(y), h, eff(justify)))

def symbol(lib_id, ref, value, x, y, rot, pin_nums, path, footprint="", datasheet="", description="", extra=None,
           mirror=None, power=False, ref_off=(2.54, -1.27), val_off=(2.54, 1.27), above=None):
    m = "\t\t(mirror %s)\n" % mirror if mirror else ""
    s = ("\t(symbol\n\t\t(lib_id \"%s\")\n\t\t(at %s %s %d)\n%s\t\t(unit 1)\n\t\t(body_style 1)\n\t\t(exclude_from_sim no)\n"
         "\t\t(in_bom yes)\n\t\t(on_board yes)\n\t\t(in_pos_files yes)\n\t\t(dnp no)\n\t\t(uuid \"%s\")\n") % (lib_id, f(x), f(y), rot, m, U())
    if power:
        s += prop("Reference", ref, x, y + 3.81, hide=True)
        below = (value == "GND") == (rot == 0)
        s += prop("Value", value, x, y + 5.08 if below else y - 3.81)
    elif above:
        s += prop("Reference", ref, x, y - above - 2.54)
        s += prop("Value", value, x, y - above)
    else:
        s += prop("Reference", ref, x + ref_off[0], y + ref_off[1], justify="left")
        s += prop("Value", value, x + val_off[0], y + val_off[1], justify="left")
    s += prop("Footprint", footprint, x, y, hide=True)
    s += prop("Datasheet", datasheet, x, y, hide=True)
    s += prop("Description", description, x, y, hide=True)
    for k, v in (extra or {}).items():
        s += prop(k, v, x, y, hide=True)
    for n in pin_nums:
        s += '\t\t(pin "%s"\n\t\t\t(uuid "%s")\n\t\t)\n' % (n, U())
    s += ('\t\t(instances\n\t\t\t(project "RoboCore"\n\t\t\t\t(path "%s"\n\t\t\t\t\t(reference "%s")\n\t\t\t\t\t(unit 1)\n'
          '\t\t\t\t)\n\t\t\t)\n\t\t)\n\t)\n') % (path, ref)
    return s

def label(name, x, y, rot, kind="label", shape=None):
    if kind == "hierarchical_label":
        j = "left" if rot in (0, 90) else "right"
        return ('\t(hierarchical_label "%s"\n\t\t(shape %s)\n\t\t(at %s %s %d)\n\t\t(effects\n\t\t\t(font\n\t\t\t\t(size 1.27 1.27)\n'
                '\t\t\t)\n\t\t\t(justify %s)\n\t\t)\n\t\t(uuid "%s")\n\t)\n' % (name, shape or "input", f(x), f(y), rot, j, U()))
    j = "left bottom" if rot in (0, 90) else "right bottom"
    return ('\t(label "%s"\n\t\t(at %s %s %d)\n\t\t(effects\n\t\t\t(font\n\t\t\t\t(size 1.27 1.27)\n\t\t\t)\n\t\t\t(justify %s)\n\t\t)\n'
            '\t\t(uuid "%s")\n\t)\n' % (name, f(x), f(y), rot, j, U()))

def text(t, x, y, size=2.032):
    return ('\t(text "%s"\n\t\t(exclude_from_sim no)\n\t\t(at %s %s 0)\n\t\t(effects\n\t\t\t(font\n\t\t\t\t(size %s %s)\n'
            '\t\t\t)\n\t\t\t(justify left bottom)\n\t\t)\n\t\t(uuid "%s")\n\t)\n' % (t, f(x), f(y), size, size, U()))

def nc(x, y): return '\t(no_connect\n\t\t(at %s %s)\n\t\t(uuid "%s")\n\t)\n' % (f(x), f(y), U())

LABEL_ROT = {"R": 0, "U": 90, "L": 180, "D": 270}
VPOW_ROT = {"U": 0, "L": 90, "D": 180, "R": 270}   # +V symbols point up by default
GND_ROT = {"D": 0, "R": 90, "U": 180, "L": 270}    # GND symbols hang down by default

class Ed:
    """Collects edits for one sheet and applies them in one pass."""
    def __init__(self, fn):
        self.fn = fn; self.S = Sheet(fn); self.t = self.S.text
        self.repl = {}     # (s,e) -> new text ('' = delete)
        self.add = []      # new top-level items
        self.cache = []    # new lib_symbols entries
        self.powlib = {}
    def delete(self, item): self.repl[(item["s"], item["e"])] = ""
    def replace_block(self, item, new): self.repl[(item["s"], item["e"])] = new
    def wire_at(self, a, b):
        for w in self.S.wires:
            p = [tuple(round(v, 2) for v in q) for q in w["pts"]]
            if p in ([a, b], [b, a]): return w
        raise KeyError((a, b))
    def label_at(self, name, x, y):
        return next(l for l in self.S.labels if l["name"] == name and abs(l["x"] - x) < .01 and abs(l["y"] - y) < .01)
    def junction_at(self, x, y):
        return next(j for j in self.S.junctions if abs(j["x"] - x) < .01 and abs(j["y"] - y) < .01)
    def nc_at(self, x, y):
        return next(j for j in self.S.noconnects if abs(j["x"] - x) < .01 and abs(j["y"] - y) < .01)
    def need(self, libname, name):
        key = libname + ":" + name
        if extract(self.S.libsec, key) is None and key not in [c[0] for c in self.cache]:
            self.cache.append((key, lib_entry(libname, name)))
        return extract(self.S.libsec, key) or next(c[1] for c in self.cache if c[0] == key)
    def set_prop(self, sym, name, value):
        b = self.repl.get((sym["s"], sym["e"]), sym["block"])
        b2, n = re.subn(r'(\(property "%s" )"(?:[^"\\]|\\.)*"' % re.escape(name), r'\1"%s"' % value.replace("\\", "\\\\"), b, count=1)
        assert n == 1, (sym["ref"], name)
        self.repl[(sym["s"], sym["e"])] = b2
    def power(self, lib, x, y, d, path):
        name = lib.split(":")[1]
        self.need("power", name)
        rot = (GND_ROT if name == "GND" else VPOW_ROT)[d]
        self.add.append(symbol(lib, next_pwr(), name, x, y, rot, ["1"], path, power=True,
                               description='Power symbol creates a global label with name \\"%s\\"' % name))
    def flag(self, x, y, path, rot=0):
        self.need("power", "PWR_FLAG")
        self.add.append(symbol("power:PWR_FLAG", next_flg(), "PWR_FLAG", x, y, rot, ["1"], path, power=True,
                               description="Special symbol for telling ERC where power comes from"))
    def connect(self, pt, conn, path):
        x, y, d = pt
        kind, val = conn if isinstance(conn, tuple) else ("label", conn)
        if kind == "label": self.add.append(label(val, x, y, LABEL_ROT[d]))
        elif kind == "power": self.power(val, x, y, d, path)
        elif kind == "nc": self.add.append(nc(x, y))
        elif kind == "hier": self.add.append(label(val, x, y, LABEL_ROT[d], "hierarchical_label", "input"))
    def place(self, libname, name, ref, value, x, y, rot, conns, path, footprint, datasheet="", description="", extra=None, mirror=None, above=None):
        lb = self.need(libname, name)
        pts = pin_points(lb, x, y, rot, mirror)
        nums = sorted(pts, key=lambda n: (len(n), n))
        self.add.append(symbol(libname + ":" + name, ref, value, x, y, rot, nums, path, footprint, datasheet, description, extra, mirror, above=above))
        done = set()
        for num, conn in conns.items():
            for (px, py, d) in pts[num]:
                if (px, py) in done: continue
                done.add((px, py)); self.connect((px, py, d), conn, path)
        return pts
    def save(self):
        t = self.t
        for (s, e), new in sorted(self.repl.items(), reverse=True):
            t = t[:s] + new + t[e:]
            if new == "" and t[s - 1:s] == "\t" and t[s:s + 1] == "\n":   # drop the emptied line
                t = t[:s - 1] + t[s + 1:]
        if self.cache:
            m = re.search(r'^\t\(lib_symbols\n', t, flags=re.M)
            end = next(e for s, e, b in blocks(t, "lib_symbols"))
            t = t[:end - 1] + "".join(c[1] + "\n" for c in self.cache) + "\t" + t[end - 1:]
        anchor = t.find("\n\t(sheet_instances")
        if anchor < 0: anchor = t.find("\n\t(embedded_fonts")
        if anchor < 0: anchor = t.rstrip().rfind("\n)")
        t = t[:anchor + 1] + "".join(self.add) + t[anchor + 1:]
        open(self.fn, "w").write(t)

# ======================================================================= ROOT
R = Ed(D + "/RoboCore.kicad_sch")
R.t = R.t.replace('(paper "A4")', '(paper "A3")', 1)
S = R.S
# --- charger: SEL high (AC-adapter mode, 1.65 A input), TE high (timer off), 1 A charge, 100 mA termination
for a, b in (((111.76, 161.29), (128.27, 161.29)), ((128.27, 161.29), (128.27, 179.07)),
             ((130.81, 140.97), (132.08, 140.97)), ((132.08, 140.97), (132.08, 143.51))):
    R.delete(R.wire_at(a, b))
R.delete(R.junction_at(128.27, 179.07)); R.delete(R.junction_at(132.08, 143.51))
R.add.append(label("+5V_USB", 111.76, 161.29, 0)); R.add.append(label("+5V_USB", 130.81, 140.97, 0))
R.set_prop(S.sym("R8"), "Value", "1K"); R.set_prop(S.sym("R9"), "Value", "10K")
# --- LDO: pin-compatible low-dropout part
vr = S.sym("VR1")
for k, v in (("Value", "TLV1117LV33DCYR"), ("Datasheet", "https://www.ti.com/lit/ds/symlink/tlv1117lv.pdf"),
             ("Description", "1-A low-dropout regulator, 3.3 V fixed, SOT-223 (pin-compatible with LM1117)"),
             ("MF", "Texas Instruments"), ("MP", "TLV1117LV33DCYR"), ("Package", "SOT-223-4"), ("PACKAGE", "SOT-223-4"),
             ("Description_1", "1A LDO 3.3V SOT-223"), ("Check_prices", ""), ("SnapEDA_Link", ""), ("PURCHASE-URL", "")):
    R.set_prop(vr, k, v)
# --- battery net: one name (+BATT) instead of VBAT/+BATT
R.delete(R.label_at("VBAT", 180.34, 104.14))
R.delete(R.label_at("VBAT", 68.58, 156.21)); R.power("power:+BATT", 68.58, 153.67, "U", ROOT)  # label sat mid-wire; symbol must sit on a wire end
# --- system rail names: charger OUT = VSYS, switched rail feeding LDO + boost EN = VSYS_SW
for ref, name in (("#PWR03", "VSYS"), ("#PWR010", "VSYS_SW")):
    p = S.sym(ref); R.delete(p); R.add.append(label(name, p["x"], p["y"], 180))
# --- battery connector -> XT30 (pad 1 = -, pad 2 = +, matches pins 1=GND, 2=+BATT)
j2 = S.sym("J2")
for k, v in (("Value", "XT30UPB-M"), ("Footprint", "Connector_AMASS:AMASS_XT30UPB-M_1x02_P5.0mm_Vertical"),
             ("Datasheet", "https://www.tme.eu/Document/e5863b891432488e7531b3c4468225ac/XT30PB-M.pdf"),
             ("Description", "Battery input, XT30 male, vertical PCB mount, keyed"), ("MF", "AMASS"), ("MANUFACTURER", "AMASS"),
             ("MP", "XT30UPB-M"), ("Package", "XT30UPB"), ("MAXIMUM_PACKAGE_HEIGHT", ""), ("Description_1", "XT30 2-pin 15A vertical PCB"),
             ("Check_prices", ""), ("SnapEDA_Link", "")):
    R.set_prop(j2, k, v)
# --- USB-C: replace 24-pin USB3 hybrid with 16-pin USB2 receptacle
j1 = S.sym("J1"); R.delete(j1)
for name, x, y in (("VBUS", 36.83, 50.8), ("VBUS", 36.83, 63.5), ("VBUS", 36.83, 81.28), ("USB_DP", 36.83, 55.88),
                   ("USB_DP", 69.85, 45.72), ("USB_DN", 36.83, 58.42), ("USB_DN", 69.85, 48.26)):
    R.delete(R.label_at(name, x, y))
old = S.pin_positions(j1)
for num, lst in old.items():
    x, y = lst[0]["x"], lst[0]["y"]
    if any(abs(n["x"] - x) < .01 and abs(n["y"] - y) < .01 for n in S.noconnects): R.delete(R.nc_at(x, y))
R.add.append(label("CC1", 36.83, 53.34, 180)); R.add.append(label("CC2", 69.85, 43.18, 0)); R.add.append(label("VBUS", 69.85, 53.34, 0))
gnd_old = [(lst[0]["x"], lst[0]["y"]) for num, lst in old.items() if num in ("A1", "A12", "B1", "B12", "GN1")]
R.gnd_old = gnd_old
R.place("Connector", "USB_C_Receptacle_USB2.0_16P", "J1", "TYPE-C-31-M-12", 320.04, 215.9, 0,
        {"A4": "VBUS", "A5": "CC1", "B5": "CC2", "A6": "USB_DP", "B6": "USB_DP", "A7": "USB_DN", "B7": "USB_DN",
         "A8": ("nc", None), "B8": ("nc", None), "A1": ("power", "power:GND"), "SH": ("power", "power:GND")},
        ROOT, "Connector_USB:USB_C_Receptacle_HRO_TYPE-C-31-M-12", "https://www.lcsc.com/datasheet/lcsc_datasheet_1811131825_Korean-Hroparts-Elec-TYPE-C-31-M-12_C165948.pdf",
        "USB 2.0 Type-C receptacle, 16 pin, mid/top mount", {"MF": "Korean Hroparts Elec", "MP": "TYPE-C-31-M-12"}, above=25.4)
# --- 6 V motor boost (TPS61089); EN tied to VIN (always on): the drivers sleep when the 3.3 V rail is switched off
# --- 6 V motor boost (TPS61089), values per TI SLVSD38C equations: 300k/75k -> 6.06 V, RFSW 300k ~516 kHz, RILIM 200k -> 5.15 A
R.place("Regulator_Switching", "TPS61089", "U7", "TPS61089RNRR", 340.36, 60.96, 0,
        {"7": ("power", "power:+BATT"), "9": ("power", "power:+BATT"), "1": "BOOST_FSW", "10": "BOOST_BST", "11": "BOOST_SW",
         "5": ("power", "power:GND"), "2": "BOOST_VCC", "8": "BOOST_ILIM", "4": "BOOST_COMP", "3": "BOOST_FB",
         "6": ("power", "power:+6V")},
        ROOT, "Package_DFN_QFN:Texas_VQFN-RNR0011A-11", "https://www.ti.com/lit/ds/symlink/tps61089.pdf",
        "6 V motor supply boost, 2.7-12 V in, 7 A switch", {"MF": "Texas Instruments", "MP": "TPS61089RNRR"}, above=11.43)
R.place("Device", "L", "L1", "2.2uH", 317.5, 45.72, 0, {"1": ("power", "power:+BATT"), "2": "BOOST_SW"}, ROOT,
        "Inductor_SMD:L_Coilcraft_XAL5030-XXX", "https://www.coilcraft.com/getmedia/49bc46c8-4b2c-45b9-9b6c-2eaa235ea698/xal50xx.pdf",
        "Boost inductor 2.2 uH, Isat 9.2 A, 14.5 mOhm max", {"MF": "Coilcraft", "MP": "XAL5030-222MEC"})
FP_R, FP_C, FP_C12 = "Resistor_SMD:R_0805_2012Metric", "Capacitor_SMD:C_0805_2012Metric", "Capacitor_SMD:C_1206_3216Metric"
FP_R6, FP_C6 = "Resistor_SMD:R_0603_1608Metric", "Capacitor_SMD:C_0603_1608Metric"   # boost control parts: 0603 to fit under the drivers
GNDc, BATc, V6c = ("power", "power:GND"), ("power", "power:+BATT"), ("power", "power:+6V")
passives = [
    ("C", "C22", "22uF 16V", FP_C12, BATc, GNDc), ("C", "C23", "0.1uF", FP_C6, BATc, GNDc),
    ("C", "C24", "22uF 16V", FP_C12, V6c, GNDc), ("C", "C25", "22uF 16V", FP_C12, V6c, GNDc), ("C", "C26", "22uF 16V", FP_C12, V6c, GNDc),
    ("C", "C27", "2.2uF", FP_C6, "BOOST_VCC", GNDc), ("C", "C28", "0.1uF", FP_C6, "BOOST_BST", "BOOST_SW"),
    ("R", "R34", "9.1K", FP_R6, "BOOST_COMP", "BOOST_RC"), ("C", "C29", "10nF", FP_C6, "BOOST_RC", GNDc),
    ("C", "C30", "22pF", FP_C6, "BOOST_COMP", GNDc), ("R", "R35", "300K", FP_R6, V6c, "BOOST_FB"),
    ("R", "R36", "75K", FP_R6, "BOOST_FB", GNDc), ("R", "R37", "300K", FP_R6, "BOOST_FSW", "BOOST_SW"),
    ("R", "R38", "200K", FP_R6, "BOOST_ILIM", GNDc)]
# PCM_Elektuur symbols are already cached in this sheet; place them directly
def place_cached(E, lib_id, ref, val, x, y, rot, conns, path, fp, desc):
    lb = E.S.libsym(lib_id); pts = pin_points(lb, x, y, rot)
    E.add.append(symbol(lib_id, ref, val, x, y, rot, sorted(pts), path, fp, "", desc))
    for num, conn in conns.items():
        E.connect(pts[num][0], conn, path)
for i, (kind, ref, val, fp, c1, c2) in enumerate(passives):
    place_cached(R, "PCM_Elektuur:" + kind, ref, val, 299.72 + 12.7 * (i % 7), 95.25 + 27.94 * (i // 7), 0, {"1": c1, "2": c2}, ROOT, fp,
                 "capacitor" if kind == "C" else "resistor")
# --- power switch: slide switch pulls P-FET gate low -> VSYS reaches LDO + boost EN; charger stays live when off
R.place("Transistor_FET", "AO3401A", "Q3", "AO3401A", 345.44, 167.64, 0,
        {"1": "PWR_EN_N", "2": "VSYS", "3": "VSYS_SW"}, ROOT, "Package_TO_SOT_SMD:SOT-23",
        "http://www.aosmd.com/pdfs/datasheet/AO3401A.pdf", "Power switch P-MOSFET", {"MF": "Alpha & Omega", "MP": "AO3401A"})
place_cached(R, "PCM_Elektuur:R", "R41", "100K", 325.12, 152.4, 0, {"1": "VSYS", "2": "PWR_EN_N"}, ROOT, FP_R, "resistor")
R.place("Connector_Generic", "Conn_01x02", "J5", "POWER_SW", 309.88, 167.64, 0,
        {"1": "PWR_EN_N", "2": GNDc}, ROOT, "Connector_JST:JST_PH_B2B-PH-K_1x02_P2.00mm_Vertical",
        "http://www.jst-mfg.com/product/pdf/eng/ePH.pdf", "External ON/OFF switch (closed = ON); fit a jumper for always-on",
        {"MF": "JST", "MP": "B2B-PH-K-S"})
R.flag(142.24, 41.91, ROOT)   # VSYS_SW is driven through Q3 (passive pins)
for t_, x_, y_ in (("MOTOR SUPPLY BOOST 3.0-4.2 V -> 6 V (TPS61089, 5 A limit)", 299.72, 30.48),
                   ("Boost passives (values per TI SLVSD38C)", 299.72, 80.01),
                   ("POWER SWITCH: chassis switch on J5, closed = ON (charger stays live when OFF)", 299.72, 142.24),
                   ("USB-C 16-pin (USB 2.0)", 299.72, 182.88)):
    R.add.append(text(t_, x_, y_))
bt = next(b for s_, e_, b in blocks(S.text, "text") if "BATTERY JST CONNECTOR" in b)
st = S.text.find(bt); R.repl[(st, st + len(bt))] = bt.replace("BATTERY JST CONNECTOR", "BATTERY CONNECTOR (XT30, 1S Li-ion)")
R.save()

# ======================================================================= ESP32 sheet
E = Ed(D + "/ESP32_BOARD_CONNECTION.kicad_sch")
E.t = E.t.replace('(paper "A4")', '(paper "A3")', 1)
S = E.S
def relabel(ed, item, new):
    ed.replace_block(item, item["block"].replace('"%s"' % item["name"], '"%s"' % new, 1))
relabel(E, E.label_at("BOOT", 30.48, 45.72), "VBAT_SENSE")        # IO0 -> battery voltage (ADC1_CH0)
relabel(E, E.label_at("BOOT", 152.4, 175.26), "I2C_SCL")          # BOOT button + auto-boot transistor -> IO9
relabel(E, E.label_at("nFAULT_B", 30.48, 60.96), "nSLEEP")        # IO6 -> driver nSLEEP
relabel(E, E.label_at("nFAULT_B", 151.13, 151.13), "nSLEEP")
sh = next(x for x in S.sheets if x["name"] == "MotorDriver")
E.replace_block(sh, sh["block"].replace('(pin "nFAULT_B" input', '(pin "nSLEEP" input', 1))
# --- CP2102N QFN20 -> QFN24 (same drawing for shared pins; DTR now exists)
u2 = S.sym("U2"); lb24 = E.need("Interface_USB", "CP2102N-Axx-xQFN24")
p24 = pin_points(lb24, u2["x"], u2["y"], u2["rot"])
b = u2["block"].replace('(lib_id "Interface_USB:CP2102N-Axx-xQFN20")', '(lib_id "Interface_USB:CP2102N-Axx-xQFN24")')
b = re.sub(r'\t\t\(pin "\d+"\n\t\t\t\(uuid "[^"]+"\)\n\t\t\)\n', "", b)
b = b.replace("\t\t(instances", "".join('\t\t(pin "%s"\n\t\t\t(uuid "%s")\n\t\t)\n' % (n, U()) for n in sorted(p24, key=int)) + "\t\t(instances", 1)
b = re.sub(r'(\(property "Value" )"[^"]*"', r'\1"CP2102N-A02-GQFN24"', b, count=1)
b = re.sub(r'(\(property "Footprint" )"[^"]*"', r'\1"Package_DFN_QFN:QFN-24-1EP_4x4mm_P0.5mm_EP2.6x2.6mm"', b, count=1)
b = re.sub(r'(\(property "Description" )"[^"]*"', r'\1"USB to UART bridge with DTR (auto-program), QFN-24"', b, count=1)
E.replace_block(u2, b)
P = lambda n: p24[n][0]
dtr = E.label_at("DTR", 217.17, 54.61)
E.replace_block(dtr, dtr["block"].replace("(at 217.17 54.61 0)", "(at %s %s 0)" % (f(P("23")[0]), f(P("23")[1]))))
for n in ("1", "22", "18"): E.add.append(nc(*P(n)[:2]))                       # RI/CLK, DSR, CTS unused
for x, y in ((217.17, 80.01), (217.17, 77.47)): E.delete(E.nc_at(x, y))       # now RXT / TXT
# LED wires used to end on old TXT/RXT pins (now GPIO.2 / GPIO.3): shorten and relabel
for oldy, net, newpin in ((82.55, "CP_TXT", "14"), (85.09, "CP_RXT", "13")):
    w = next(w for w in S.wires if any(abs(px - 217.17) < .01 and abs(py - oldy) < .01 for px, py in w["pts"]))
    (x1, y1), (x2, y2) = w["pts"][0], w["pts"][-1]
    assert abs(y1 - y2) < .01, ("LED wire not horizontal", w["pts"])
    E.replace_block(w, w["block"].replace("(xy 217.17 %s)" % f(oldy), "(xy 222.25 %s)" % f(oldy)))
    E.add.append(label(net, 222.25, oldy, 0)); E.add.append(nc(217.17, oldy))
    E.add.append(label(net, *P(newpin)[:2], 0))
E.power("power:+3.3V", P("5")[0], P("5")[1], "U", ESP)                          # VIO
# --- battery voltage divider -> IO0 (4.2 V -> 2.1 V)
E.need("power", "+BATT")
place_cached(E, "PCM_Elektuur:R", "R39", "100K", 299.72, 50.8, 0, {"1": BATc, "2": "VBAT_SENSE"}, ESP, FP_R, "resistor")
place_cached(E, "PCM_Elektuur:R", "R40", "100K", 317.5, 50.8, 0, {"1": "VBAT_SENSE", "2": GNDc}, ESP, FP_R, "resistor")
place_cached(E, "PCM_Elektuur:C", "C33", "0.1uF", 335.28, 50.8, 0, {"1": "VBAT_SENSE", "2": GNDc}, ESP, FP_C, "capacitor")
E.add.append(text("BATTERY VOLTAGE SENSE -> IO0 (ADC1_CH0), 4.2 V -> 2.1 V", 294.64, 30.48))
E.save()

# ======================================================================= Motor driver sheet
M = Ed(D + "/MotorDriver.kicad_sch"); S = M.S
relabel(M, next(l for l in S.labels if l["name"] == "nFAULT_B"), "nFAULT_A")   # both drivers share one open-drain fault line
M.add.append(label("nSLEEP", 104.14, 60.96, 180, "hierarchical_label", "input"))
M.add.append(label("nSLEEP", 97.79, 143.51, 180, "hierarchical_label", "input"))
M.need("power", "+6V")
for ref in ("#PWR039", "#PWR043"):
    p = S.sym(ref); b = p["block"].replace('(lib_id "power:+BATT")', '(lib_id "power:+6V")')
    b = re.sub(r'(\(property "Value" )"\+BATT"', r'\1"+6V"', b).replace('name \\"+BATT\\"', 'name \\"+6V\\"')
    M.replace_block(p, b)
for ref, y in (("C31", 60.96), ("C32", 143.51)):
    place_cached(M, "PCM_Elektuur:C", ref, "0.1uF", 190.5, y, 0, {"1": V6c, "2": GNDc}, MOT, FP_C, "capacitor")
M.add.append(text("VM decoupling: TI requires 0.1 uF close to each VM pin", 177.8, 45.72))
M.save()

# ======================================================================= Buttons sheet
B = Ed(D + "/Buttons.kicad_sch"); S = B.S
q2 = S.sym("Q2")   # emitter/collector were swapped: mirror so E->DTR, C->BOOT(IO9)
B.replace_block(q2, q2["block"].replace("(at 160.02 69.85 0)\n", "(at 160.02 69.85 0)\n\t\t(mirror x)\n", 1))
B.delete(S.sym("C21")); B.delete(S.sym("#PWR056"))
B.delete(B.wire_at((162.56, 130.81), (162.56, 132.08))); B.delete(B.wire_at((162.56, 142.24), (162.56, 146.05)))
B.delete(B.junction_at(162.56, 130.81))
B.save()

# ======================================================================= prune dangling GND stubs left by old J1
R2 = Ed(D + "/RoboCore.kicad_sch"); S = R2.S
def connected_elsewhere(S, x, y, w):
    for ow in S.wires:
        if ow is w: continue
        for px, py in ow["pts"]:
            if abs(px - x) < .01 and abs(py - y) < .01: return True
        (x1, y1), (x2, y2) = ow["pts"][0], ow["pts"][-1]
        if (abs(x1 - x2) < .01 and abs(x1 - x) < .01 and min(y1, y2) < y < max(y1, y2)) or \
           (abs(y1 - y2) < .01 and abs(y1 - y) < .01 and min(x1, x2) < x < max(x1, x2)): return True
    for kind, o in S.at_point(x, y):
        if kind in ("pin", "label", "hierarchical_label", "global_label", "no_connect", "sheet_pin"): return True
    return False
removed = 0
while True:
    S = Sheet(D + "/RoboCore.kicad_sch")
    dead = [w for w in S.wires for (x, y) in (w["pts"][0], w["pts"][-1]) if not connected_elsewhere(S, x, y, w)]
    if not dead: break
    w = dead[0]; t = S.text; s, e = w["s"], w["e"]
    t = t[:s] + t[e:]
    if t[s - 1:s] == "\t" and t[s:s + 1] == "\n": t = t[:s - 1] + t[s + 1:]
    open(D + "/RoboCore.kicad_sch", "w").write(t); removed += 1
print("pruned dangling wires:", removed)
# remove junctions that now join fewer than 3 wire ends
S = Sheet(D + "/RoboCore.kicad_sch"); t = S.text
for j in sorted(S.junctions, key=lambda j: -j["s"]):
    n = sum(1 for w in S.wires for (px, py) in w["pts"] if abs(px - j["x"]) < .01 and abs(py - j["y"]) < .01)
    n += sum(1 for w in S.wires if (lambda a, b: (abs(a[0]-b[0]) < .01 and abs(a[0]-j["x"]) < .01 and min(a[1],b[1]) < j["y"] < max(a[1],b[1])) or
                                     (abs(a[1]-b[1]) < .01 and abs(a[1]-j["y"]) < .01 and min(a[0],b[0]) < j["x"] < max(a[0],b[0])))(w["pts"][0], w["pts"][-1])) * 2
    pins_here = sum(1 for kind, o in S.at_point(j["x"], j["y"]) if kind == "pin")
    if n + pins_here < 3:
        s, e = j["s"], j["e"]; t = t[:s] + t[e:]
        if t[s - 1:s] == "\t" and t[s:s + 1] == "\n": t = t[:s - 1] + t[s + 1:]
open(D + "/RoboCore.kicad_sch", "w").write(t)
print("done")
