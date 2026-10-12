"""Minimal KiCad .kicad_sch reader for locating pins, wires, labels at coordinates."""
import re, math, uuid as _uuid
from symlib import extract, pins as lib_pins

def blocks(text, head, indent="\t"):
    """Yield (start,end,block) for top-level '(head' blocks at given indent."""
    for m in re.finditer(r'^%s\(%s[ \n]' % (indent, re.escape(head)), text, flags=re.M):
        i = m.start() + len(indent); depth = 0; j = i
        while True:
            c = text[j]
            if c == '"':
                j += 1
                while text[j] != '"':
                    if text[j] == '\\': j += 1
                    j += 1
            elif c == '(':
                depth += 1
            elif c == ')':
                depth -= 1
                if depth == 0: break
            j += 1
        yield i, j + 1, text[i:j + 1]

def r2(v): return round(v * 100) / 100

class Sheet:
    def __init__(self, path):
        self.path = path; self.text = open(path).read(); self.parse()
    def parse(self):
        t = self.text
        ls = re.search(r'^\t\(lib_symbols', t, flags=re.M)
        self.libsec = t[ls.start():next(e for s, e, b in blocks(t, "lib_symbols"))] if ls else ""
        self.symbols = []
        for s, e, b in blocks(t, "symbol"):
            lib_id = re.search(r'\(lib_id "([^"]+)"\)', b).group(1)
            at = re.search(r'\(at ([\-\d\.]+) ([\-\d\.]+) ([\-\d\.]+)\)', b)
            mir = re.search(r'\(mirror (\w)\)', b[:400])
            ref = re.search(r'\(property "Reference" "([^"]*)"', b).group(1)
            val = re.search(r'\(property "Value" "([^"]*)"', b).group(1)
            uid = re.search(r'\(uuid "([^"]+)"\)', b).group(1)
            self.symbols.append(dict(s=s, e=e, lib_id=lib_id, x=float(at.group(1)), y=float(at.group(2)), rot=int(float(at.group(3))),
                                     mirror=mir.group(1) if mir else None, ref=ref, val=val, uuid=uid, block=b))
        self.wires = [dict(s=s, e=e, pts=[(float(a), float(b_)) for a, b_ in re.findall(r'\(xy ([\-\d\.]+) ([\-\d\.]+)\)', b)], block=b)
                      for s, e, b in blocks(t, "wire")]
        self.labels = []
        for kind in ("label", "global_label", "hierarchical_label"):
            for s, e, b in blocks(t, kind):
                m = re.match(r'\(%s "([^"]*)"' % kind, b); at = re.search(r'\(at ([\-\d\.]+) ([\-\d\.]+) ([\-\d\.]+)\)', b)
                self.labels.append(dict(s=s, e=e, kind=kind, name=m.group(1), x=float(at.group(1)), y=float(at.group(2)), rot=int(float(at.group(3))), block=b))
        self.junctions = [dict(s=s, e=e, x=float(m.group(1)), y=float(m.group(2))) for s, e, b in blocks(t, "junction")
                          for m in [re.search(r'\(at ([\-\d\.]+) ([\-\d\.]+)\)', b)]]
        self.noconnects = [dict(s=s, e=e, x=float(m.group(1)), y=float(m.group(2))) for s, e, b in blocks(t, "no_connect")
                           for m in [re.search(r'\(at ([\-\d\.]+) ([\-\d\.]+)\)', b)]]
        self.sheets = []
        for s, e, b in blocks(t, "sheet"):
            name = re.search(r'\(property "Sheetname" "([^"]*)"', b).group(1)
            sp = [dict(name=m.group(1), x=float(m.group(2)), y=float(m.group(3))) for m in re.finditer(r'\(pin "([^"]+)" \w+\s*\(at ([\-\d\.]+) ([\-\d\.]+)', b)]
            self.sheets.append(dict(s=s, e=e, name=name, pins=sp, block=b))
    def libsym(self, lib_id):
        b = extract(self.libsec, lib_id)
        ext = re.search(r'\(extends "([^"]+)"\)', b or "")
        if ext: b = extract(self.libsec, lib_id.split(":")[0] + ":" + ext.group(1)) or b
        return b
    def pin_positions(self, sym):
        b = self.libsym(sym["lib_id"]); out = {}
        for p in lib_pins(b):
            x, y = p["x"], -p["y"]
            if sym["mirror"] == "x": y = -y
            if sym["mirror"] == "y": x = -x
            a = math.radians(sym["rot"]); c, s_ = round(math.cos(a)), round(math.sin(a))
            X = sym["x"] + x * c + y * s_; Y = sym["y"] - x * s_ + y * c
            out.setdefault(p["num"], []).append(dict(num=p["num"], name=p["name"], x=r2(X), y=r2(Y)))
        return out
    def sym(self, ref):
        return next(s for s in self.symbols if s["ref"] == ref)
    def at_point(self, x, y, tol=0.02):
        """Everything whose connection point is at (x,y)."""
        hits = []
        for w in self.wires:
            for i, (a, b) in enumerate(w["pts"]):
                if abs(a - x) < tol and abs(b - y) < tol: hits.append(("wire_end", w))
            (x1, y1), (x2, y2) = w["pts"][0], w["pts"][-1]
            if (abs(x1 - x2) < tol and abs(x1 - x) < tol and min(y1, y2) - tol < y < max(y1, y2) + tol) or \
               (abs(y1 - y2) < tol and abs(y1 - y) < tol and min(x1, x2) - tol < x < max(x1, x2) + tol):
                if not any(h[1] is w for h in hits): hits.append(("wire_mid", w))
        for l in self.labels:
            if abs(l["x"] - x) < tol and abs(l["y"] - y) < tol: hits.append((l["kind"], l))
        for j in self.junctions:
            if abs(j["x"] - x) < tol and abs(j["y"] - y) < tol: hits.append(("junction", j))
        for n in self.noconnects:
            if abs(n["x"] - x) < tol and abs(n["y"] - y) < tol: hits.append(("no_connect", n))
        for s in self.symbols:
            for num, lst in self.pin_positions(s).items():
                for p in lst:
                    if abs(p["x"] - x) < tol and abs(p["y"] - y) < tol: hits.append(("pin", dict(ref=s["ref"], num=num, name=p["name"], lib_id=s["lib_id"])))
        for sh in self.sheets:
            for p in sh["pins"]:
                if abs(p["x"] - x) < tol and abs(p["y"] - y) < tol: hits.append(("sheet_pin", dict(sheet=sh["name"], name=p["name"])))
        return hits
    def trace(self, x, y, tol=0.02):
        """Follow wires from a point; return set of points and everything attached (one sheet)."""
        seen_w = set(); pts = [(x, y)]; attached = []; visited = set()
        while pts:
            px, py = pts.pop()
            key = (r2(px), r2(py))
            if key in visited: continue
            visited.add(key)
            for kind, obj in self.at_point(px, py, tol):
                if kind in ("wire_end", "wire_mid"):
                    if id(obj) in seen_w: continue
                    seen_w.add(id(obj)); attached.append(("wire", obj)); pts.extend(obj["pts"])
                else:
                    attached.append((kind, obj))
        return attached

def describe(att):
    out = []
    for kind, o in att:
        if kind == "wire": out.append(f"wire{[(a, b) for a, b in o['pts']]}")
        elif kind == "pin": out.append(f"PIN {o['ref']}.{o['num']}({o['name']})")
        elif kind in ("label", "global_label", "hierarchical_label"): out.append(f"{kind.upper()} '{o['name']}'@({o['x']},{o['y']})")
        elif kind == "sheet_pin": out.append(f"SHEETPIN {o['sheet']}:{o['name']}")
        elif kind == "junction": out.append(f"junction@({o['x']},{o['y']})")
        elif kind == "no_connect": out.append(f"NC@({o['x']},{o['y']})")
    return out
