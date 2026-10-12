"""Turn KiCad's grouped BOM into the PCBWay assembly BOM: merge case-only value duplicates, fill
part numbers that live in the Value field, and add the rating each generic part must meet
(voltage from the rail it sits on). usage: bom_finish.py bom_raw.csv RoboCore_V1_BOM.csv
"""
import csv, sys, re, collections
rows = list(csv.DictReader(open(sys.argv[1])))

def norm(v):
    v = v.strip()
    v = re.sub(r"(?i)(\d)\s*(u|n|p)f\b", lambda m: m.group(1) + m.group(2).lower().replace("u", "µ") + "F", v)
    v = re.sub(r"(\d)k\b", r"\1K", v)
    return v
def refs(s): return [r.strip() for r in s.split(",") if r.strip()]
def expand(s):
    out = []
    for r in refs(s):
        m = re.match(r"([A-Z]+)(\d+)-(?:[A-Z]+)?(\d+)$", r)
        out += [f"{m.group(1)}{i}" for i in range(int(m.group(2)), int(m.group(3)) + 1)] if m else [r]
    return out
key = lambda r: (re.match(r"[A-Z]+", r).group(), int(re.search(r"\d+", r).group()))

# rating / sourcing note per designator (voltage chosen from the rail: 3.3 V, 4.2 V battery, 5 V USB, 6 V motor)
SPEC = {}
def spec(refs_, text):
    for r in refs_.split(): SPEC[r] = text
spec("C1 C4 C6 C10 C13 C31 C32 C33", "MLCC X7R ±10%, 50 V")
spec("C2 C8 C14 C20", "MLCC X7R ±10%, 25 V (16 V min)")
spec("C5 C7 C11", "CERAMIC (not tantalum): MLCC 1206 X5R ±10%, 16 V, e.g. Samsung CL31A106KOHNNNE; the T491A footprint pads fit a 1206 part")
spec("C9", "CERAMIC (not tantalum): MLCC 1206 X5R ±10%, 16 V, e.g. Samsung CL31A475KOHNNNE; the T491A footprint pads fit a 1206 part")
spec("C12 C16 C17", "MLCC X5R/X7R ±10%, 16 V (10 V min)")
spec("C15", "MLCC X7R ±10%, 50 V; MPU-6050 charge-pump capacitor, 50 V rating required by the datasheet")
spec("C18 C19", "MLCC X5R ±20%, 16 V; 6 V motor rail; e.g. Samsung CL21A226MOQNNNE")
spec("C22 C24 C25 C26", "MLCC X5R/X7R, 16 V or higher (25 V keeps more capacitance at 6 V)")
spec("C23 C28", "MLCC X7R ±10%, 25 V (16 V min)")
spec("C27", "MLCC X5R/X7R ±10%, 16 V")
spec("C29", "MLCC X7R ±10%, 50 V")
spec("C30", "MLCC C0G/NP0 ±5%, 50 V")
spec("F2", "PTC resettable fuse, 1812, I_hold 1.5 A, V_max ≥ 6 V, e.g. Bourns MF-MSMF150/24X-2 (MF-MSMF150-2 is obsolete)")
spec("R34", "Thick film 1% (boost loop compensation)")
spec("R35 R36 R37 R38", "Thick film 1% (sets boost output voltage, switching frequency and current limit; 1% required)")
MPN = {  # part numbers that only appear in the Value field
    "U1": ("Microchip", "MCP73871-2CCI/ML", "-2 = 4.20 V charge voltage (standard Li-ion)"),
    "U2": ("Silicon Labs", "CP2102N-A02-GQFN24", ""),
    "U3": ("STMicroelectronics", "USBLC6-2SC6", ""),
    "U5": ("TDK InvenSense", "MPU-6050", "Older part, so supply is uncertain: ask PCBWay to confirm genuine stock"),
    "Q1": ("Nexperia", "BC817-40", "any BC817 (-16/-25/-40) is fine"),
    "Q2": ("Nexperia", "BC817-40", "any BC817 (-16/-25/-40) is fine"),
}
THT = {"J2", "J5"}

groups = collections.OrderedDict()
for r in rows:
    pkg = r["Footprint"].split(":")[-1]
    if pkg == "T491A": pkg = "1206 (3216 metric) MLCC on T491A pads"
    first = expand(r["Ref"])[0]
    mf, mpn = (r["MF"] or r["MfrName"]).strip(), (r["MP"] or r["MfrPN"]).strip()
    if not mpn and first in MPN: mf, mpn = MPN[first][0], MPN[first][1]
    k = (norm(r["Value"]), pkg, mpn)
    g = groups.setdefault(k, {"refs": [], "mf": mf, "desc": r["Description"]})
    g["refs"] += expand(r["Ref"])
out = []
for (val, pkg, mpn), g in groups.items():
    rs = sorted(set(g["refs"]), key=key); first = rs[0]
    note = SPEC.get(first, "")
    if not note and first.startswith("R"):
        note = "Thick film 1%, " + ("1/8 W" if "0805" in pkg else "1/10 W")
        if val == "50": note += "; 49.9 Ω acceptable"
    if first in MPN and MPN[first][2]: note = (note + "; " if note else "") + MPN[first][2]
    if not note and first.startswith("C"): note = "MLCC X7R ±10%, 25 V"
    out.append((key(first), rs, val, pkg, g["mf"], mpn, note, "THT" if first in THT else "SMD", g["desc"]))
out.sort(key=lambda o: o[0])
with open(sys.argv[2], "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["Item", "Designators", "Qty", "Value", "Package (KiCad footprint)", "Manufacturer", "Manufacturer Part Number",
                "Rating / sourcing note", "Mount", "Description"])
    for i, (_, rs, val, pkg, mf, mpn, note, mount, desc) in enumerate(out, 1):
        w.writerow([i, ",".join(rs), len(rs), val, pkg, mf, mpn, note, mount, desc])
print(f"BOM: {len(out)} lines, {sum(len(o[1]) for o in out)} parts; "
      f"{sum(1 for o in out if not o[5] and not o[6])} lines with neither part number nor rating note")
