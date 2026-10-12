"""Check the generated schematic against the spec: export KiCad's netlist and compare pin groups.

Every spec net must appear in KiCad as exactly the same set of (ref, pin) pairs, whatever KiCad names it.
Also runs ERC.  usage: python3 tools/check_nets.py
"""
import collections, json, os, subprocess, sys, xml.etree.ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
CLI = "/Applications/KiCad.app/Contents/MacOS/kicad-cli"
TMP = os.environ.get("TMPDIR", "/tmp")
OUT = os.path.join(PROJ, os.environ["RC_OUT"]) if os.environ.get("RC_OUT") else PROJ
NAME = os.environ.get("RC_PROJECT", "RoboCore_V2")


def run(args):
    r = subprocess.run([CLI] + args, cwd=OUT, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(r.stderr)


def main():
    net_xml = os.path.join(TMP, f"{NAME}_net.xml")
    erc_json = os.path.join(TMP, f"{NAME}_erc.json")
    run(["sch", "export", "netlist", "--format", "kicadxml", "-o", net_xml, f"{NAME}.kicad_sch"])
    want = collections.defaultdict(set)
    for line in open(os.path.join(HERE if OUT == PROJ else OUT, "intended_nets.tsv")):
        ref, pin, net = line.rstrip("\n").split("\t")
        want[net].add((ref, pin))
    got = {}
    for n in ET.parse(net_xml).getroot().iter("net"):
        pins = {(x.get("ref"), x.get("pin")) for x in n.findall("node") if not x.get("ref").startswith("#")}
        if pins:
            got[n.get("name")] = pins
    by_pin = {p: name for name, pins in got.items() for p in pins}
    bad = 0
    for net, pins in sorted(want.items()):
        names = {by_pin.get(p) for p in pins}
        if len(names) != 1 or None in names or got[names.pop()] != pins:
            bad += 1
            print(f"MISMATCH {net}: spec {sorted(pins)}")
            for nm in {by_pin.get(p) for p in pins}:
                print(f"     kicad {nm}: {sorted(got.get(nm, []))}")
    extra = [nm for nm, pins in got.items() if not any(pins <= w for w in want.values()) and len(pins) > 1]
    for nm in extra:
        bad += 1
        print(f"EXTRA kicad net {nm}: {sorted(got[nm])}")
    total = sum(len(p) for p in want.values())
    print(f"nets: {len(want)} spec / {len(got)} kicad, pin connections: {total}, problems: {bad}")
    run(["sch", "erc", "--format", "json", "--severity-all", "-o", erc_json, f"{NAME}.kicad_sch"])
    d = json.load(open(erc_json))
    counts = collections.Counter()
    for s in d["sheets"]:
        for v in s["violations"]:
            counts[v["severity"]] += 1
            print(f"  ERC {v['severity']}: {v['type']}: {v['description']} | " + "; ".join(i["description"] for i in v["items"]))
    print(f"ERC: {counts.get('error', 0)} errors, {counts.get('warning', 0)} warnings")
    return 1 if bad or counts.get("error") else 0


if __name__ == "__main__":
    sys.exit(main())
