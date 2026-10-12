"""Draw the placement map (zones, courtyards, holes) to PNG for layout iteration.
KiCad python:  tools/place_debug.py  -> writes JSON; system python with pymupdf draws it."""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
if sys.argv[1:2] == ["draw"]:
    import pymupdf
    d = json.load(open(sys.argv[2]))
    S = 14.0
    doc = pymupdf.open(); page = doc.new_page(width=(172 - 100) * S, height=(124 - 59) * S)
    T = lambda x, y: ((x - 100) * S, (y - 59) * S)
    def rect(r, color, fill=None, w=1):
        page.draw_rect(pymupdf.Rect(*T(r[0], r[1]), *T(r[2], r[3])), color=color, fill=fill, width=w)
    for z in d["zones"]:
        rect(z["rect"], (0, 0, 1), None, 2)
        page.insert_text(T(z["rect"][0] + 0.2, z["rect"][1] + 1.0), z["name"], fontsize=9, color=(0, 0, 1))
    for ref, r in d["occ"]:
        rect(r, (0.3, 0.3, 0.3), (0.85, 0.85, 0.85) if not ref.startswith("U201") else None)
        page.insert_text(T(r[0] + 0.1, (r[1] + r[3]) / 2 + 0.3), ref, fontsize=7, color=(0.6, 0, 0))
    for ref, r in d["holes"]:
        rect(r, (1, 0.5, 0), None)
    page.insert_text((10, 20), "failed: " + ", ".join(d["failed"]), fontsize=10, color=(1, 0, 0))
    page.get_pixmap(dpi=100).save(sys.argv[3])
    sys.exit(0)
import build_pcb as B
import placement_v2 as PL
comps = B.netlist()
PL.placement.lenient = True
PL.placement(comps)
zones = [dict(name=z[0], rect=z[2]) for z in PL.ZONES if z[1] == "T"]
holes = []
json.dump(dict(zones=zones, occ=[(k, r) for k, r in PL.placement.occ["T"]], holes=holes,
               failed=PL.placement.failed), open(sys.argv[1], "w"))
