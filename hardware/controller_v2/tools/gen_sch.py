"""Generate the RoboCore V2 schematic (root + sub-sheets) from spec_v2.py.

Layout model
  * Each sheet is split into functional blocks. A block is drawn as a dashed box with a bold title and a
    one- or two-line description of what the circuit does.
  * Supply and ground nets (POWER_NETS) get power symbols at the pin.
  * Other nets whose pins sit in the same block are drawn as wires by a small orthogonal router.
  * A net that leaves its block gets one global label per wired group, so blocks and sheets join by name.
  * Unused pins get a no-connect flag. Reference/value text is placed where it overlaps the least.
Part positions in the spec are relative to their block's top-left corner.

Connectivity is checked afterwards with tools/check_nets.py (KiCad's own netlist against the spec).

usage: python3 tools/gen_sch.py            (writes *.kicad_sch next to RoboCore_V2.kicad_pro)
Other boards (the sensor boards): RC_SPEC=spec_line RC_OUT=sensors/line_sensor RC_PROJECT=RoboCore_LineSensor python3 tools/gen_sch.py
"""
import math, os, re, sys, textwrap, uuid

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import importlib  # noqa: E402
spec = importlib.import_module(os.environ.get("RC_SPEC", "spec_v2"))
OUT = os.path.join(PROJ, os.environ["RC_OUT"]) if os.environ.get("RC_OUT") else PROJ

STOCK = "/Applications/KiCad.app/Contents/SharedSupport/symbols"
LOCAL = {"RoboCoreV2": os.path.join(PROJ, "lib", "RoboCoreV2.kicad_sym")}
VERSION = "20260306"
PROJECT = os.environ.get("RC_PROJECT", "RoboCore_V2")
DATE = getattr(spec, "DATE", "2026-10-04")
TITLE = getattr(spec, "TITLE", "RoboCore V2")
REV = getattr(spec, "REV", "2.0")
STUB = 2.54
U = lambda: str(uuid.uuid4())
r2 = lambda v: round(v * 100) / 100

POWER_NETS = {"GND", "+3V3", "+BATT", "VBUS", "+5V_USB", "VSYS", "VSYS_SW", "VMOT"}
POWER_LIB = {"GND": "power:GND", "+3V3": "power:+3V3", "+BATT": "power:+BATT", "VBUS": "power:VBUS"}
SUPPLY_LIB = "power:VCC"          # other rails: generic supply symbol, net name = value


# ---------------------------------------------------------------- library access
_libcache = {}
def libtext(lib):
    if lib not in _libcache:
        path = LOCAL.get(lib) or f"{STOCK}/{lib}.kicad_sym"
        _libcache[lib] = open(path).read()
    return _libcache[lib]

def sexp_block(text, start):
    depth, j = 0, start
    while True:
        c = text[j]
        if c == '"':
            j += 1
            while text[j] != '"':
                if text[j] == "\\":
                    j += 1
                j += 1
        elif c == "(":
            depth += 1
        elif c == ")":
            depth -= 1
            if depth == 0:
                return text[start:j + 1]
        j += 1

def raw_symbol(lib, name):
    t = libtext(lib)
    m = re.search(r'\(symbol "%s"\s' % re.escape(name), t)
    if not m:
        raise KeyError(f"{lib}:{name} not found")
    return sexp_block(t, m.start())

def top_props(block):
    """property blocks that belong to the top-level symbol (not nested units)."""
    out, depth, i = [], 0, 0
    while i < len(block):
        c = block[i]
        if c == '"':
            i += 1
            while block[i] != '"':
                if block[i] == "\\":
                    i += 1
                i += 1
        elif c == "(":
            depth += 1
            if depth == 2 and block.startswith("(property ", i):
                b = sexp_block(block, i)
                out.append(b)
                i += len(b)
                depth -= 1
                continue
        elif c == ")":
            depth -= 1
        i += 1
    return out

def flat_symbol(lib, name):
    """Symbol block flattened (extends resolved), renamed to 'lib:name' for lib_symbols."""
    b = raw_symbol(lib, name)
    ext = re.search(r'\(extends "([^"]+)"\)', b)
    if ext:
        parent = raw_symbol(lib, ext.group(1))
        child_props = {re.match(r'\(property "([^"]+)"', p).group(1): p for p in top_props(b)}
        merged = parent
        for p in top_props(parent):
            key = re.match(r'\(property "([^"]+)"', p).group(1)
            if key in child_props:
                merged = merged.replace(p, child_props.pop(key), 1)
        extra = "".join("\n\t\t" + p for p in child_props.values())
        merged = re.sub(r'(\(symbol "%s"\s)' % re.escape(ext.group(1)), r'\1', merged, count=1)
        b = merged.replace(f'(symbol "{ext.group(1)}"', f'(symbol "{name}"', 1)
        b = b.replace(f'(symbol "{ext.group(1)}_', f'(symbol "{name}_')
        if extra:
            b = b.replace("\n\t\t(symbol ", extra + "\n\t\t(symbol ", 1)
    b = b.replace(f'(symbol "{name}"', f'(symbol "{lib}:{name}"', 1)
    return b

def lib_pins(block):
    pins = []
    for m in re.finditer(r'\(pin (\w+) (\w+)\s*\(at ([\-\d\.]+) ([\-\d\.]+) (\d+)\)\s*\(length ([\d\.]+)\)(.*?)\(name "([^"]*)".*?\(number "([^"]+)"',
                         block, flags=re.S):
        pins.append(dict(etype=m.group(1), x=float(m.group(3)), y=float(m.group(4)), ang=int(m.group(5)),
                         length=float(m.group(6)), name=m.group(8), num=m.group(9), hidden="(hide yes)" in m.group(7)))
    return pins

def lib_graphics_pts(block):
    """Corner points of the drawn body (rectangles, polylines, arcs, circles) in library coordinates."""
    body = block[block.find("(symbol ", 1):] if block.find("(symbol ", 1) > 0 else block
    pts = [(float(a), float(b)) for a, b in re.findall(r'\((?:xy|start|end|mid) ([\-\d\.]+) ([\-\d\.]+)\)', body)]
    for cx, cy, r in re.findall(r'\(circle\s*\(center ([\-\d\.]+) ([\-\d\.]+)\)\s*\(radius ([\d\.]+)\)', body):
        cx, cy, r = float(cx), float(cy), float(r)
        pts += [(cx - r, cy - r), (cx + r, cy + r)]
    return pts


# ---------------------------------------------------------------- geometry
def xform(sym, x, y):
    """lib coords (y up) -> sheet coords (y down) for a placed symbol."""
    x, y = x, -y
    if sym.get("mirror") == "x":
        y = -y
    if sym.get("mirror") == "y":
        x = -x
    a = math.radians(sym.get("rot", 0))
    c, s = round(math.cos(a)), round(math.sin(a))
    return r2(sym["x"] + x * c + y * s), r2(sym["y"] - x * s + y * c)

def xvec(sym, x, y):
    o = dict(sym, x=0, y=0)
    return xform(o, x, y)

def xdir(sym, ang):
    """outward pin direction in sheet coords (unit vector)."""
    a = math.radians(ang + 180)
    dx, dy = round(math.cos(a)), -round(math.sin(a))
    if sym.get("mirror") == "x":
        dy = -dy
    if sym.get("mirror") == "y":
        dx = -dx
    r = math.radians(sym.get("rot", 0))
    c, s = round(math.cos(r)), round(math.sin(r))
    return dx * c + dy * s, -dx * s + dy * c

def norm(x1, y1, x2, y2):
    return (min(x1, x2), min(y1, y2), max(x1, x2), max(y1, y2))

def rects_overlap(a, b, shrink=0.0):
    return min(a[2], b[2]) - max(a[0], b[0]) > shrink and min(a[3], b[3]) - max(a[1], b[1]) > shrink

def overlap_area(a, b):
    w = min(a[2], b[2]) - max(a[0], b[0])
    h = min(a[3], b[3]) - max(a[1], b[1])
    return w * h if w > 0 and h > 0 else 0.0

def seg_rect_hit(a, b, r, shrink=0.3):
    x1, y1, x2, y2 = r[0] + shrink, r[1] + shrink, r[2] - shrink, r[3] - shrink
    if x1 >= x2 or y1 >= y2:
        return False
    if a[1] == b[1]:
        lo, hi = min(a[0], b[0]), max(a[0], b[0])
        return y1 < a[1] < y2 and max(lo, x1) < min(hi, x2)
    lo, hi = min(a[1], b[1]), max(a[1], b[1])
    return x1 < a[0] < x2 and max(lo, y1) < min(hi, y2)

def on_seg(p, a, b, tol=0.005):
    if abs(a[1] - b[1]) < tol and abs(p[1] - a[1]) < tol:
        return min(a[0], b[0]) - tol <= p[0] <= max(a[0], b[0]) + tol
    if abs(a[0] - b[0]) < tol and abs(p[0] - a[0]) < tol:
        return min(a[1], b[1]) - tol <= p[1] <= max(a[1], b[1]) + tol
    return False

def seg_relation(a, b, c, d):
    """'none' | 'cross' (proper X, no connection) | 'touch' (would connect)."""
    ha, hc = a[1] == b[1], c[1] == d[1]
    if ha == hc:   # parallel
        if ha and a[1] == c[1]:
            if max(min(a[0], b[0]), min(c[0], d[0])) <= min(max(a[0], b[0]), max(c[0], d[0])) + 0.005:
                return "touch"
        if not ha and a[0] == c[0]:
            if max(min(a[1], b[1]), min(c[1], d[1])) <= min(max(a[1], b[1]), max(c[1], d[1])) + 0.005:
                return "touch"
        return "none"
    h1, h2, v1, v2 = (a, b, c, d) if ha else (c, d, a, b)
    ix, iy = v1[0], h1[1]
    if not (min(h1[0], h2[0]) - 0.005 <= ix <= max(h1[0], h2[0]) + 0.005 and min(v1[1], v2[1]) - 0.005 <= iy <= max(v1[1], v2[1]) + 0.005):
        return "none"
    p = (ix, iy)
    if p in (h1, h2, v1, v2) or any(abs(p[0] - q[0]) < 0.005 and abs(p[1] - q[1]) < 0.005 for q in (h1, h2, v1, v2)):
        return "touch"
    return "cross"

def text_w(s, size=1.27):
    return len(s) * size * 0.92 + 0.3


# ---------------------------------------------------------------- emitters
def font(size=1.27, bold=False, italic=False):
    extra = (" (bold yes)" if bold else "") + (" (italic yes)" if italic else "")
    return f"(font (size {size} {size}){extra})"

def prop(name, value, x, y, hide=False, justify=None, angle=0):
    j = f" (justify {justify})" if justify else ""
    h = " (hide yes)" if hide else ""
    return f'\t\t(property "{name}" "{value}" (at {r2(x)} {r2(y)} {angle}){h} (effects {font()}{j}))'

def symbol_text(c, ref_spot, val_spot, hide_ref=False, hide_val=False):
    """Reference/Value property lines. spots: (x, y, visual_justify) with text kept horizontal on screen."""
    rot = c.get("rot", 0)
    ang = 90 if rot in (90, 270) else 0
    # direction the text runs in sheet coords; if it runs right-to-left KiCad mirrors the justification
    vx, _ = xvec(c, 1, 0) if ang == 0 else xvec(c, 0, 1)
    flip = vx < 0
    def j(v):
        if v in ("left", "right") and flip:
            return "right" if v == "left" else "left"
        return v
    out = []
    for name, val, spot, hide in (("Reference", c["ref"], ref_spot, hide_ref), ("Value", c["value"], val_spot, hide_val)):
        x, y, just = spot
        out.append(prop(name, val, x, y, hide=hide, justify=j(just), angle=ang))
    return out

def symbol_instance(c, sheet_path, libblock, ref_spot, val_spot, hide_ref=False, hide_val=False):
    x, y = c["x"], c["y"]
    props = symbol_text(c, ref_spot, val_spot, hide_ref, hide_val) + [
        prop("Footprint", c.get("footprint", ""), x, y, hide=True),
        prop("Datasheet", c.get("datasheet", ""), x, y, hide=True),
        prop("Description", c.get("description", ""), x, y, hide=True)]
    for k, v in c.get("fields", {}).items():
        props.append(prop(k, v, x, y, hide=True))
    mirror = f"\n\t\t(mirror {c['mirror']})" if c.get("mirror") else ""
    ref = c["ref"]
    # stable ids (derived from sheet + reference) keep the schematic <-> PCB link across regenerations
    sid = lambda tag: str(uuid.uuid5(uuid.NAMESPACE_URL, f"robocore-v2/{sheet_path}/{ref}/{tag}"))
    pins = "\n".join(f'\t\t(pin "{p["num"]}" (uuid "{sid("pin" + p["num"])}"))' for p in lib_pins(libblock))
    return f'''	(symbol
		(lib_id "{c['lib_id']}")
		(at {r2(x)} {r2(y)} {c.get('rot', 0)}){mirror}
		(unit 1)
		(exclude_from_sim no)
		(in_bom {"no" if ref.startswith("#") or c.get("no_bom") else "yes"})
		(on_board {"no" if ref.startswith("#") else "yes"})
		(dnp {"yes" if c.get("dnp") else "no"})
		(uuid "{sid("symbol")}")
{chr(10).join(props)}
{pins}
		(instances
			(project "{PROJECT}"
				(path "{sheet_path}"
					(reference "{ref}")
					(unit 1)
				)
			)
		)
	)'''

def global_label(net, x, y, d):
    ang = {(1, 0): 0, (-1, 0): 180, (0, -1): 90, (0, 1): 270}[d]
    just = "left" if ang in (0, 90) else "right"
    return f'''	(global_label "{net}"
		(shape passive)
		(at {r2(x)} {r2(y)} {ang})
		(fields_autoplaced yes)
		(effects {font()} (justify {just}))
		(uuid "{U()}")
		(property "Intersheetrefs" "${{INTERSHEET_REFS}}" (at {r2(x)} {r2(y)} 0) (hide yes) (effects {font()} (justify {just})))
	)'''

def wire(a, b):
    return f'\t(wire (pts (xy {r2(a[0])} {r2(a[1])}) (xy {r2(b[0])} {r2(b[1])})) (stroke (width 0) (type default)) (uuid "{U()}"))'

def junction(p):
    return f'\t(junction (at {r2(p[0])} {r2(p[1])}) (diameter 0) (color 0 0 0 0) (uuid "{U()}"))'

def no_connect(p):
    return f'\t(no_connect (at {r2(p[0])} {r2(p[1])}) (uuid "{U()}"))'

def text(t, x, y, size=1.27, bold=False, italic=False, justify="left"):
    t = t.replace('"', "'")
    return f'\t(text "{t}" (exclude_from_sim no) (at {r2(x)} {r2(y)} 0) (effects {font(size, bold, italic)} (justify {justify})) (uuid "{U()}"))'

def box(x1, y1, x2, y2):
    return (f'\t(rectangle (start {r2(x1)} {r2(y1)}) (end {r2(x2)} {r2(y2)}) '
            f'(stroke (width 0.3) (type dash) (color 72 72 72 1)) (fill (type none)) (uuid "{U()}"))')


# ---------------------------------------------------------------- sheet model
class Sheet:
    def __init__(self, sheet, sheet_path, ref_base):
        self.spec, self.path = sheet, sheet_path
        self.libs, self.out = {}, []
        self.wires = []          # (net, a, b)
        self.points = []         # (pt, net)  pin ends, power-symbol pins, label anchors
        self.obst = []           # (rect, kind)  bodies, power symbols, labels, notes, title bands
        self.fieldrects = []
        self.symbols = []        # placed real symbols (dicts with geometry)
        self.pwr_n = ref_base
        self.report = []
        self.warn = []

    def lib(self, lib_id):
        if lib_id not in self.libs:
            lib, name = lib_id.split(":")
            self.libs[lib_id] = flat_symbol(lib, name)
        return self.libs[lib_id]

    # -------------------------------------------------------- geometry of a placed symbol
    def geometry(self, c):
        blk = self.lib(c["lib_id"])
        pins = []
        for p in lib_pins(blk):
            px, py = xform(c, p["x"], p["y"])
            dx, dy = xdir(c, p["ang"])
            pins.append(dict(p, px=px, py=py, d=(dx, dy), net=None))
        gpts = [xform(c, a, b) for a, b in lib_graphics_pts(blk)]
        if not gpts:
            gpts = [(c["x"] - 1, c["y"] - 1), (c["x"] + 1, c["y"] + 1)]
        gx, gy = [p[0] for p in gpts], [p[1] for p in gpts]
        body = (min(gx), min(gy), max(gx), max(gy))
        allx = gx + [p["px"] for p in pins] + [p["px"] - p["d"][0] * p["length"] for p in pins]
        ally = gy + [p["py"] for p in pins] + [p["py"] - p["d"][1] * p["length"] for p in pins]
        x1, y1, x2, y2 = min(allx), min(ally), max(allx), max(ally)
        for p in pins:   # pin ends always sit on the outline (LED arrows etc. may stick out past them)
            if p["d"] == (0, 1):
                y2 = min(y2, p["py"])
            elif p["d"] == (0, -1):
                y1 = max(y1, p["py"])
            elif p["d"] == (1, 0):
                x2 = min(x2, p["px"])
            elif p["d"] == (-1, 0):
                x1 = max(x1, p["px"])
        full = (x1, y1, x2, y2)
        return blk, pins, body, full

    # -------------------------------------------------------- power symbols
    def power_symbol(self, net, p, o):
        """Place a power symbol whose pin is at p and whose body points along o."""
        lib_id = POWER_LIB.get(net, SUPPLY_LIB)
        gnd = net == "GND"
        rot = next(r for r in (0, 90, 180, 270)
                   if xvec(dict(rot=r), 0, -1 if gnd else 1) == (o[0], o[1]))
        self.pwr_n += 1
        c = dict(ref=f"#PWR{self.pwr_n}", lib_id=lib_id, value=net, x=p[0], y=p[1], rot=rot)
        self.lib(lib_id)
        tw = text_w(net)
        hide_val = gnd and o[0] != 0
        if hide_val:
            spot = (p[0], p[1], None)
            rect = norm(p[0], p[1] - 1.4, p[0] + o[0] * 2.8, p[1] + 1.4)
        elif o[0] == 0:   # vertical: text centred beyond the tip
            ty = p[1] + o[1] * 3.81
            spot = (p[0], ty, None)
            rect = norm(p[0] - max(1.4, tw / 2), p[1], p[0] + max(1.4, tw / 2), ty + o[1] * 0.8)
        else:
            tx = p[0] + o[0] * 3.3
            spot = (tx, p[1], "left" if o[0] > 0 else "right")
            rect = norm(p[0], p[1] - 1.4, tx + o[0] * tw, p[1] + 1.4)
        self.out.append(symbol_instance(c, self.path, self.lib(lib_id), (p[0], p[1], None), spot, hide_ref=True, hide_val=hide_val))
        self.obst.append((rect, "pwr"))
        self.points.append((p, net))

    def place_power(self, sym, pins, block_rect):
        """Power symbols for every pin of sym on a POWER_NETS net (grouping runs of adjacent pins)."""
        c = sym["c"]
        dense = len({(p["px"], p["py"]) for p in pins}) > 4 or c["lib_id"].startswith("Connector")
        byloc = {}
        for p in pins:
            if p["net"] in POWER_NETS:
                byloc.setdefault((p["px"], p["py"]), p)
        groups = {}
        for loc, p in byloc.items():
            groups.setdefault((p["net"], p["d"]), []).append(loc)
        allpins = [(p["px"], p["py"], p["d"]) for p in pins]
        for (net, d), locs in groups.items():
            natural = (0, 1) if net == "GND" else (0, -1)
            horiz = d[1] == 0
            locs.sort(key=lambda q: (q[1], q[0]) if horiz else (q[0], q[1]))
            # split into runs: neighbours on the same side with no other pin between them
            runs, cur = [], [locs[0]]
            for q in locs[1:]:
                prev = cur[-1]
                between = [a for a in allpins if a[2] == d and (a[0], a[1]) not in locs and
                           ((horiz and a[0] == q[0] and prev[1] < a[1] < q[1]) or
                            (not horiz and a[1] == q[1] and prev[0] < a[0] < q[0]))]
                if dense and not between and abs(q[0] - prev[0]) + abs(q[1] - prev[1]) <= 10.2:
                    cur.append(q)
                else:
                    runs.append(cur)
                    cur = [q]
            runs.append(cur)
            for run in runs:
                if not dense:
                    for q in run:
                        o = natural if horiz else d
                        L = c.get("pwr_stub", {}).get(byloc[q]["num"], 0)
                        if L:
                            e = (r2(q[0] + d[0] * L), r2(q[1] + d[1] * L))
                            self.add_wire(net, q, e)
                            q = e
                        self.power_symbol(net, q, o)
                    continue
                if len(run) == 1 and not horiz:
                    self.power_symbol(net, run[0], d)
                    continue
                ends = [(r2(q[0] + d[0] * STUB), r2(q[1] + d[1] * STUB)) for q in run]
                for q, e in zip(run, ends):
                    self.add_wire(net, q, e)
                if len(ends) > 1:
                    self.add_wire(net, ends[0], ends[-1])
                if horiz:
                    # natural direction if the side is clear beyond the run, else point outward
                    tip = ends[0] if natural[1] < 0 else ends[-1]
                    pin_y = run[0][1] if natural[1] < 0 else run[-1][1]
                    clear = not any(a[2] == d and a[0] == run[0][0] and 0 < (pin_y - a[1]) * -natural[1] < 7.62 for a in allpins)
                    if clear:
                        self.power_symbol(net, tip, natural)
                    else:
                        self.power_symbol(net, ends[0], d)
                else:
                    self.power_symbol(net, ends[len(ends) // 2], d)

    # -------------------------------------------------------- wires
    def add_wire(self, net, a, b):
        if a == b:
            return
        self.wires.append((net, a, b))

    def seg_cost(self, net, a, b, ends, area):
        """None if the segment would short/overlap something, else a crossing penalty."""
        if not (area[0] <= min(a[0], b[0]) and max(a[0], b[0]) <= area[2] and area[1] <= min(a[1], b[1]) and max(a[1], b[1]) <= area[3]):
            return None
        for r, kind in self.obst:
            if seg_rect_hit(a, b, r):
                return None
        for p, pn in self.points:
            if on_seg(p, a, b) and (pn != net):
                return None
        pen = 0
        for wn, c, d in self.wires:
            if wn == net:
                continue
            rel = seg_relation(a, b, c, d)
            if rel == "touch":
                return None
            if rel == "cross":
                pen += 25
        for r in self.fieldrects:
            if seg_rect_hit(a, b, r, 0.1):
                pen += 4
        return pen

    def path_cost(self, net, path, d_start, d_end, area):
        cost, bends = 0.0, len(path) - 2
        for i in range(len(path) - 1):
            a, b = path[i], path[i + 1]
            if a == b or (a[0] != b[0] and a[1] != b[1]):
                return None
            pc = self.seg_cost(net, a, b, None, area)
            if pc is None:
                return None
            cost += abs(a[0] - b[0]) + abs(a[1] - b[1]) + pc
        # leave the start pin outward, arrive at the end pin from outside
        v = (path[1][0] - path[0][0], path[1][1] - path[0][1])
        dot = v[0] * d_start[0] + v[1] * d_start[1]
        if dot < 0:
            return None
        if dot == 0:
            cost += 3
        if d_end is not None:
            w = (path[-2][0] - path[-1][0], path[-2][1] - path[-1][1])
            dot = w[0] * d_end[0] + w[1] * d_end[1]
            if dot < 0:
                return None
            if dot == 0:
                cost += 3
        return cost + 4 * bends

    @staticmethod
    def candidates(pa, da, pb, db):
        out = []
        if pa[0] == pb[0] or pa[1] == pb[1]:
            out.append([pa, pb])
        out += [[pa, (pb[0], pa[1]), pb], [pa, (pa[0], pb[1]), pb]]
        for k in (1.27, 2.54, 5.08, 7.62):
            q = (r2(pa[0] + da[0] * k), r2(pa[1] + da[1] * k))
            out += [[pa, q, (pb[0], q[1]), pb], [pa, q, (q[0], pb[1]), pb]]
            if db is not None:
                r = (r2(pb[0] + db[0] * k), r2(pb[1] + db[1] * k))
                out += [[pa, (r[0], pa[1]), r, pb], [pa, (pa[0], r[1]), r, pb], [pa, q, (r[0], q[1]), r, pb], [pa, q, (q[0], r[1]), r, pb]]
        mx = r2(round((pa[0] + pb[0]) / 2 / 1.27) * 1.27)
        my = r2(round((pa[1] + pb[1]) / 2 / 1.27) * 1.27)
        out += [[pa, (mx, pa[1]), (mx, pb[1]), pb], [pa, (pa[0], my), (pb[0], my), pb]]
        clean = []
        for path in out:
            p2 = [path[0]]
            for q in path[1:]:
                if q != p2[-1]:
                    p2.append(q)
            # drop collinear middle points
            p3 = [p2[0]]
            for i in range(1, len(p2) - 1):
                a, b, c = p3[-1], p2[i], p2[i + 1]
                if (a[0] == b[0] == c[0]) or (a[1] == b[1] == c[1]):
                    continue
                p3.append(b)
            p3.append(p2[-1])
            if len(p3) >= 2:
                clean.append(p3)
        return clean

    def route_net(self, net, terms, area):
        """Prim-style tree: join each terminal to the nearest point of the wired group. Returns groups."""
        terms = sorted(terms, key=lambda t: (t["p"][1], t["p"][0]))
        groups = []
        remaining = list(terms)
        while remaining:
            tree = [remaining.pop(0)]
            segs = []
            while remaining:
                best = None
                for t in remaining:
                    targets = [(g["p"], g["d"]) for g in tree]
                    for a, b in segs:
                        if a[1] == b[1] and min(a[0], b[0]) < t["p"][0] < max(a[0], b[0]):
                            targets.append(((t["p"][0], a[1]), None))
                        if a[0] == b[0] and min(a[1], b[1]) < t["p"][1] < max(a[1], b[1]):
                            targets.append(((a[0], t["p"][1]), None))
                    for tp, td in targets:
                        if abs(tp[0] - t["p"][0]) + abs(tp[1] - t["p"][1]) > 90:
                            continue
                        for path in self.candidates(t["p"], t["d"], tp, td):
                            cost = self.path_cost(net, path, t["d"], td, area)
                            if cost is not None and (best is None or cost < best[0]):
                                best = (cost, t, path)
                if best is None:
                    break
                _, t, path = best
                for i in range(len(path) - 1):
                    self.add_wire(net, path[i], path[i + 1])
                    segs.append((path[i], path[i + 1]))
                tree.append(t)
                remaining.remove(t)
            groups.append(dict(terms=tree, segs=segs))
        return groups

    # -------------------------------------------------------- labels
    def label_rect(self, net, s, d):
        L = text_w(net) + 2.6
        e = (s[0] + d[0] * L, s[1] + d[1] * L)
        if d[1] == 0:
            return norm(s[0], s[1] - 1.1, e[0], e[1] + 1.1)
        return norm(s[0] - 1.1, s[1], e[0] + 1.1, e[1])

    def place_label(self, net, group, area, prefer=None):
        best = None
        spots = []
        for t in group["terms"]:
            for k, d in enumerate([t["d"], (t["d"][1], t["d"][0]), (-t["d"][1], -t["d"][0])]):
                spots.append((t, d, k * 3))
        tpts = {t["p"] for t in group["terms"]}
        for a, b in group["segs"]:
            L = abs(a[0] - b[0]) + abs(a[1] - b[1])
            ux, uy = (b[0] - a[0]) / L, (b[1] - a[1]) / L
            k = 2.54
            while k < L - 0.1:
                q = (r2(a[0] + ux * k), r2(a[1] + uy * k))
                if q not in tpts:
                    for d in ((uy, ux), (-uy, -ux)):
                        d = (int(round(d[0])), int(round(d[1])))
                        spots.append((dict(p=q, d=d, ref="~", num="~"), d, 5))
                k += 2.54
        for t, d, base in spots:
            if True:
                k = base / 3
                if prefer and (t["ref"], t["num"]) == prefer[:2]:
                    if d != prefer[2]:
                        continue
                elif prefer:
                    continue
                s = (r2(t["p"][0] + d[0] * STUB), r2(t["p"][1] + d[1] * STUB))
                pc = self.seg_cost(net, t["p"], s, None, area)
                if pc is None:
                    pc = 200
                # nothing of this net may already run along the stub direction
                for wn, a, b in self.wires:
                    if wn == net and (on_seg(s, a, b) or (on_seg(t["p"], a, b) and on_seg((t["p"][0] + d[0] * 0.5, t["p"][1] + d[1] * 0.5), a, b))):
                        pc += 200
                rect = self.label_rect(net, s, d)
                bad = 0
                for r, kind in self.obst:
                    if rects_overlap(rect, r, 0.05):
                        bad += 100
                for wn, a, b in self.wires:
                    if seg_rect_hit(a, b, rect, 0.05):
                        bad += 100
                for p, pn in self.points:
                    if rect[0] + 0.05 < p[0] < rect[2] - 0.05 and rect[1] + 0.05 < p[1] < rect[3] - 0.05:
                        bad += 100
                if not (area[0] <= rect[0] and rect[2] <= area[2] and area[1] <= rect[1] and rect[3] <= area[3]):
                    bad += 60
                cost = pc + bad + base
                if best is None or cost < best[0]:
                    best = (cost, t, d, s, rect)
        if best is None:
            raise ValueError(f"no label spot for {net} (prefer={prefer})")
        cost, t, d, s, rect = best
        if cost >= 100:
            self.warn.append(f"label {net} at {t['ref']}.{t['num']} overlaps (cost {cost:.0f})")
        self.add_wire(net, t["p"], s)
        self.out.append(global_label(net, s[0], s[1], d))
        self.obst.append((rect, "label"))
        self.points.append((s, net))

    # -------------------------------------------------------- fields
    def field_spots(self, sym):
        c, body, full = sym["c"], sym["body"], sym["full"]
        x, y = c["x"], c["y"]
        rw, vw = text_w(c["ref"]), text_w(c["value"])
        cands = []
        def lr(xx, just, pen):
            cands.append(((xx, y - 1.27, just), (xx, y + 1.27, just), pen))
        npins = len({(p["px"], p["py"]) for p in sym["pins"]})
        if npins <= 2 and (full[3] - full[1]) >= (full[2] - full[0]):      # vertical 2-pin
            lr(body[2] + 1.0, "left", 0)
            lr(body[0] - 1.0, "right", 1)
        elif npins <= 2:                                                   # horizontal 2-pin
            cx = (full[0] + full[2]) / 2
            cands.append(((cx, body[1] - 1.6, None), (cx, body[3] + 1.6, None), 0))
            cands.append(((cx, body[1] - 4.0, None), (cx, body[1] - 1.6, None), 1))
            cands.append(((cx, body[3] + 1.6, None), (cx, body[3] + 4.0, None), 1))
        else:
            lr(full[2] + 1.27, "left", 2)
            lr(full[0] - 1.27, "right", 3)
            cands.append(((body[2], body[1] - 4.0, "right"), (body[2], body[1] - 1.6, "right"), 0))
            cands.append(((body[0], body[1] - 4.0, "left"), (body[0], body[1] - 1.6, "left"), 1))
            cands.append(((body[0], body[3] + 1.6, "left"), (body[0], body[3] + 4.0, "left"), 1))
            cands.append(((body[2], body[3] + 1.6, "right"), (body[2], body[3] + 4.0, "right"), 1))
            cands.append(((full[2] + 1.27, full[1] - 1.6, "left"), (full[2] + 1.27, full[1] + 0.9, "left"), 4))
            for xx, j in ((full[0] - 0.5, "right"), (full[2] + 0.5, "left")):
                cands.append(((xx, full[1] - 4.0, j), (xx, full[1] - 1.6, j), 5))
                cands.append(((xx, full[3] + 1.6, j), (xx, full[3] + 4.0, j), 5))
        return cands

    @staticmethod
    def spot_rect(spot, w):
        x, y, j = spot
        if j == "left":
            return (x, y - 0.75, x + w, y + 0.75)
        if j == "right":
            return (x - w, y - 0.75, x, y + 0.75)
        return (x - w / 2, y - 0.75, x + w / 2, y + 0.75)

    def place_fields(self, sym, area):
        c = sym["c"]
        hide_val = c.get("hide_value", False)
        best = None
        for rs, vs, pen in self.field_spots(sym):
            rr = self.spot_rect(rs, text_w(c["ref"]))
            vr = self.spot_rect(vs, text_w(c["value"]))
            cost = pen
            for fr in ([rr] if hide_val else [rr, vr]):
                for r, kind in self.obst:
                    cost += overlap_area(fr, r) * 6 + (8 if rects_overlap(fr, r) else 0)
                for other in self.symbols:
                    cost += overlap_area(fr, other["body"]) * 6 + (8 if rects_overlap(fr, other["body"]) else 0)
                near = (fr[0] - 0.4, fr[1] - 0.6, fr[2] + 0.4, fr[3] + 0.6)   # text too close to a wire reads badly
                for wn, a, b in self.wires:
                    if seg_rect_hit(a, b, near, 0.0):
                        cost += 25
                for r in self.fieldrects:
                    cost += overlap_area(fr, r) * 8 + (8 if rects_overlap(fr, r) else 0)
                for p, pn in self.points:
                    if fr[0] < p[0] < fr[2] and fr[1] < p[1] < fr[3]:
                        cost += 6
                if not (area[0] <= fr[0] and fr[2] <= area[2] and area[1] <= fr[1] and fr[3] <= area[3]):
                    cost += 15
            if best is None or cost < best[0]:
                best = (cost, rs, vs, rr, vr)
        if c.get("fields_at"):
            fa = c["fields_at"]
            rs = (c["x"] + fa[0], c["y"] + fa[1], fa[2])
            vs = (c["x"] + fa[0], c["y"] + fa[1] + 2.54, fa[2])
            best = (0, rs, vs, self.spot_rect(rs, text_w(c["ref"])), self.spot_rect(vs, text_w(c["value"])))
        _, rs, vs, rr, vr = best
        self.fieldrects += [rr] if hide_val else [rr, vr]
        return rs, vs

    # -------------------------------------------------------- build
    def build(self, all_blocks_of_net):
        sh = self.spec
        for bi, blk in enumerate(sh["blocks"]):
            ox, oy = blk["at"]
            w, h = blk["size"]
            desc = []
            for para in blk["desc"]:
                desc += textwrap.wrap(para, width=int((w - 5.0) / (1.5 * 0.88)))
            band = 7.5 + 3.0 * len(desc)
            area = (ox + 1.27, oy + band, ox + w - 1.27, oy + h - 1.27)
            self.out.append(box(ox, oy, ox + w, oy + h))
            self.out.append(text(blk["title"], ox + 2.54, oy + 5.2, size=2.0, bold=True))
            for i, line in enumerate(desc):
                self.out.append(text(line, ox + 2.54, oy + 9.4 + 3.0 * i, size=1.5, italic=True))
            self.obst.append(((ox, oy, ox + w, oy + band - 0.5), "band"))
            blk["_area"] = area
            # keep the parts clear of the title/description band (room for a symbol or label above the top pin)
            tops = []
            for c0 in blk["parts"]:
                full = self.geometry(dict(c0, x=ox + c0["x"], y=oy + c0["y"]))[3]
                tops.append(full[1] - 5.08)
            shift = 0.0
            if tops and min(tops) < oy + band + 1.27:
                shift = math.ceil((oy + band + 1.27 - min(tops)) / 2.54) * 2.54
                if max(self.geometry(dict(c0, x=ox + c0["x"], y=oy + c0["y"] + shift))[3][3] for c0 in blk["parts"]) > oy + h - 3:
                    self.warn.append(f"block {blk['title']}: content does not fit below the description")
            oy_parts = oy + shift
            for n in blk.get("notes", []):
                t, nx, ny = n[0], ox + n[1], oy_parts + n[2]
                size = n[3] if len(n) > 3 else 1.27
                lines = t.split("\n")
                for i, line in enumerate(lines):
                    self.out.append(text(line, nx, ny + i * size * 1.6, size=size, italic=True))
                wmax = max(text_w(l, size) for l in lines)
                self.obst.append(((nx, ny - size * 0.6, nx + wmax, ny + (len(lines) - 1) * size * 1.6 + size * 0.6), "note"))
            # place symbols
            for c0 in blk["parts"]:
                c = dict(c0, x=r2(ox + c0["x"]), y=r2(oy_parts + c0["y"]))
                if c["lib_id"] == "power:PWR_FLAG":
                    c["hide_value"] = True
                blkt, pins, body, full = self.geometry(c)
                nets = {str(k): v for k, v in c.get("nets", {}).items()}
                unknown = set(nets) - {p["num"] for p in pins}
                if unknown:
                    raise ValueError(f"{c['ref']}: pins {sorted(unknown)} not in symbol {c['lib_id']}")
                for p in pins:
                    p["net"] = nets.get(p["num"])
                    if p["net"] and not c["ref"].startswith("#"):
                        self.report.append((c["ref"], p["num"], p["net"]))
                sym = dict(c=c, pins=pins, body=body, full=full, block=bi)
                self.symbols.append(sym)
                if not c["lib_id"].startswith("power:"):
                    self.obst.append((full, "body"))
                for p in pins:
                    self.points.append(((p["px"], p["py"]), p["net"]))
            blk["_syms"] = [s for s in self.symbols if s["block"] == bi]

        # power symbols and flags, then wires, then labels
        for bi, blk in enumerate(sh["blocks"]):
            area = blk["_area"]
            for sym in blk["_syms"]:
                c = sym["c"]
                if c["lib_id"] == "power:PWR_FLAG":
                    net = sym["pins"][0]["net"]
                    p = (sym["pins"][0]["px"], sym["pins"][0]["py"])
                    if net == "GND":
                        q = (p[0], r2(p[1] + STUB))
                        self.add_wire(net, p, q)
                        self.power_symbol(net, q, (0, 1))
                    elif net in POWER_NETS:
                        q = (r2(p[0] + 5.08), p[1])
                        self.add_wire(net, p, q)
                        self.power_symbol(net, q, (0, -1))
                    continue
                self.place_power(sym, sym["pins"], area)
        for bi, blk in enumerate(sh["blocks"]):
            area = blk["_area"]
            nets = {}
            for sym in blk["_syms"]:
                for p in sym["pins"]:
                    n = p["net"]
                    if not n or n in POWER_NETS:
                        continue
                    key = (p["px"], p["py"])
                    lst = nets.setdefault(n, [])
                    if all(t["p"] != key for t in lst):
                        lst.append(dict(p=key, d=p["d"], ref=sym["c"]["ref"], num=p["num"]))
            order = sorted(nets, key=lambda n: (len(nets[n]), sum(abs(t["p"][0] - nets[n][0]["p"][0]) + abs(t["p"][1] - nets[n][0]["p"][1]) for t in nets[n])))
            blk["_groups"] = {}
            for n in order:
                terms = nets[n]
                if n in blk.get("label_nets", ()) or len(terms) == 1:
                    blk["_groups"][n] = [dict(terms=[t], segs=[]) for t in terms]
                else:
                    blk["_groups"][n] = self.route_net(n, terms, area)
        for bi, blk in enumerate(sh["blocks"]):
            area = blk["_area"]
            prefs = blk.get("label_at", {})
            for n, groups in blk["_groups"].items():
                external = all_blocks_of_net[n] - {(sh["file"], bi)}
                if len(groups) == 1 and not external and n not in blk.get("label_nets", ()):
                    continue
                for g in groups:
                    pref = None
                    for t in g["terms"]:
                        k = f"{t['ref']}.{t['num']}"
                        if k in prefs:
                            pref = (t["ref"], t["num"], prefs[k])
                    self.place_label(n, g, area, pref)
        # unconnected pins
        for sym in self.symbols:
            if sym["c"]["ref"].startswith("#"):
                continue
            for p in sym["pins"]:
                if p["net"] is None and p["etype"] != "no_connect":
                    self.out.append(no_connect((p["px"], p["py"])))
        # symbols with text placed last (they avoid wires, labels and each other)
        for sym in self.symbols:
            c = sym["c"]
            area = sh["blocks"][sym["block"]]["_area"]
            rs, vs = self.place_fields(sym, area)
            hide_ref = c["lib_id"] == "power:PWR_FLAG"
            self.out.append(symbol_instance(c, self.path, self.lib(c["lib_id"]), rs, vs, hide_ref=hide_ref,
                                            hide_val=c.get("hide_value", False)))
        # wires + junctions
        ends = {}
        for n, a, b in self.wires:
            self.out.append(wire(a, b))
            for q in (a, b):
                ends[q] = ends.get(q, 0) + 1
        pinpts = {}
        for p, n in self.points:
            pinpts[p] = pinpts.get(p, 0) + 1
        for q, k in ends.items():
            on_mid = any(on_seg(q, a, b) and q != a and q != b for n, a, b in self.wires)
            if k + pinpts.get(q, 0) + (2 if on_mid else 0) >= 3:
                self.out.append(junction(q))
        self.check_shorts()
        for t in sh.get("notes", []):
            self.out.append(text(*t))

    def check_shorts(self):
        for i, (n1, a, b) in enumerate(self.wires):
            for n2, c, d in self.wires[i + 1:]:
                if n1 != n2 and seg_relation(a, b, c, d) == "touch":
                    raise RuntimeError(f"wire short {n1} / {n2} at {a}-{b} vs {c}-{d}")
            for p, pn in self.points:
                if pn != n1 and on_seg(p, a, b):
                    raise RuntimeError(f"wire of {n1} touches pin/label of {pn} at {p}")

    def text_out(self, root_uuid, sheet_uuid):
        sh = self.spec
        libsec = "\n".join("\t\t" + b.replace("\n", "\n\t") for b in self.libs.values())
        return f'''(kicad_sch
	(version {VERSION})
	(generator "eeschema")
	(generator_version "10.0")
	(uuid "{sheet_uuid}")
	(paper "{sh.get('paper', 'A3')}")
	(title_block
		(title "{TITLE} - {sh['title']}")
		(date "{DATE}")
		(rev "{REV}")
		(company "RoboCore Zambia / Plastal-Bot Builders")
	)
	(lib_symbols
{libsec}
	)
{chr(10).join(self.out)}
)
'''


def build_root(root_uuid, sheets):
    blocks = []
    for i, sh in enumerate(sheets):
        x, y = 25.4 + (i % 2) * 127.0, 50.8 + (i // 2) * 76.2
        blocks.append(f'''	(sheet
		(at {x} {y})
		(size 101.6 25.4)
		(fields_autoplaced yes)
		(stroke (width 0.1524) (type solid))
		(fill (color 0 0 0 0.0000))
		(uuid "{sh['uuid']}")
		(property "Sheetname" "{sh['title']}" (at {x} {r2(y - 0.71)} 0) (effects (font (size 1.8 1.8) (bold yes)) (justify left bottom)))
		(property "Sheetfile" "{sh['file']}" (at {x} {r2(y + 26.0)} 0) (effects {font()} (justify left top)))
		(instances
			(project "{PROJECT}"
				(path "/{root_uuid}" (page "{i + 2}"))
			)
		)
	)''')
        for k, line in enumerate(sh.get("summary", [])):
            blocks.append(text(line, x + 2.54, y + 5.08 + 3.3 * k, size=1.5))
    notes = "\n".join(text(*t) for t in spec.ROOT_NOTES)
    return f'''(kicad_sch
	(version {VERSION})
	(generator "eeschema")
	(generator_version "10.0")
	(uuid "{root_uuid}")
	(paper "A4")
	(title_block
		(title "{TITLE}")
		(date "{DATE}")
		(rev "{REV}")
		(company "RoboCore Zambia / Plastal-Bot Builders")
	)
	(lib_symbols)
{chr(10).join(blocks)}
{notes}
	(sheet_instances
		(path "/" (page "1"))
	)
)
'''


def main():
    root_uuid = spec.ROOT_UUID
    where = {}
    for sh in spec.SHEETS:
        for bi, blk in enumerate(sh["blocks"]):
            for c in blk["parts"]:
                for n in c.get("nets", {}).values():
                    where.setdefault(n, set()).add((sh["file"], bi))
    report, warns, nsym = [], [], 0
    for si, sh in enumerate(spec.SHEETS):
        s = Sheet(sh, f"/{root_uuid}/{sh['uuid']}", (si + 1) * 1000)
        s.build(where)
        open(os.path.join(OUT, sh["file"]), "w").write(s.text_out(root_uuid, sh["uuid"]))
        report += s.report
        warns += [f"{sh['title']}: {w}" for w in s.warn]
        nsym += sum(1 for x in s.symbols if not x["c"]["ref"].startswith("#"))
    open(os.path.join(OUT, f"{PROJECT}.kicad_sch"), "w").write(build_root(root_uuid, spec.SHEETS))
    open(os.path.join(HERE if OUT == PROJ else OUT, "intended_nets.tsv"), "w").write("\n".join(f"{r}\t{p}\t{n}" for r, p, n in report) + "\n")
    print(f"wrote {len(spec.SHEETS)} sheets, {nsym} parts, {len(report)} pin connections")
    for w in warns:
        print("  warn:", w)

if __name__ == "__main__":
    main()
