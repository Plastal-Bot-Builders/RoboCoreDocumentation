"""Project symbols and footprints for the sensor boards (idempotent: replaces its own entries on every run).

  python3 tools/make_parts.py

Symbols (lib/RoboCoreV2.kicad_sym):
  TCRT5000     Vishay reflective sensor. Pad numbers follow KiCad's OptoDevice:Vishay_TCRT5000 footprint, matched to the
               datasheet top view by geometry: pads 3/4 sit at the chamfered (emitter) end -> 1 C, 2 E, 3 K, 4 A.
  CS100A       ultrasonic ranging chip, SOP-16 (CS100A manual V2.0, table 1).
  LM339_QUAD   quad comparator as one unit (standard LM339 pinout: OUT1 2, OUT2 1, OUT3 14, OUT4 13, V+ 3, GND 12).
  US_TRANSDUCER 40 kHz open ultrasonic transducer, pin 1 = "+" (marked on the part).
Footprint (lib/RoboCoreV2.pretty):
  Ultrasonic_Transducer_D16.0mm_P10.00mm   HYDZ HY40A16T12-1 / R12-1: 16 mm body, pins 10 mm apart. Origin = pin 1,
  like KiCad's buzzer footprints, whose 12 mm buzzer model (scaled) stands in for the transducer in 3D.
"""
import os, re

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
SYMLIB = os.path.join(PROJ, "lib", "RoboCoreV2.kicad_sym")
FPLIB = os.path.join(PROJ, "lib", "RoboCoreV2.pretty")


def _font(size=1.27):
    return f"(effects (font (size {size} {size})))"


def _prop(name, value, x, y, hide=False):
    h = " (hide yes)" if hide else ""
    return f'\t\t(property "{name}" "{value}" (at {x} {y} 0) (show_name no) (do_not_autoplace no){h} {_font()})\n'


def symbol(name, ref, value, footprint, datasheet, desc, half_w, half_h, pins, keywords="", pin_names=True):
    """pins: (electrical type, name, number, side L/R/T/B, offset along the side)."""
    out = [f'\t(symbol "{name}"\n']
    out.append("\t\t(pin_names (offset 1.016))\n" if pin_names else "\t\t(pin_names (offset 1.016) (hide yes))\n")
    out.append("\t\t(exclude_from_sim no) (in_bom yes) (on_board yes) (in_pos_files yes) (duplicate_pin_numbers_are_jumpers no)\n")
    out.append(_prop("Reference", ref, -half_w, half_h + 1.27))
    out.append(_prop("Value", value, -half_w, -half_h - 1.27))
    out.append(_prop("Footprint", footprint, 0, -half_h - 3.81, True))
    out.append(_prop("Datasheet", datasheet, 0, -half_h - 6.35, True))
    out.append(_prop("Description", desc, 0, 0, True))
    if keywords:
        out.append(_prop("ki_keywords", keywords, 0, 0, True))
    out.append(f'\t\t(symbol "{name}_0_1"\n\t\t\t(rectangle (start {-half_w} {half_h}) (end {half_w} {-half_h}) '
               f'(stroke (width 0.254) (type default)) (fill (type background)))\n\t\t)\n')
    out.append(f'\t\t(symbol "{name}_1_1"\n')
    for etype, pname, num, side, off in pins:
        x, y, ang = {"L": (-half_w - 2.54, off, 0), "R": (half_w + 2.54, off, 180),
                     "T": (off, half_h + 2.54, 270), "B": (off, -half_h - 2.54, 90)}[side]
        out.append(f'\t\t\t(pin {etype} line (at {x} {y} {ang}) (length 2.54) (name "{pname}" {_font()}) (number "{num}" {_font()}))\n')
    out.append("\t\t)\n\t\t(embedded_fonts no)\n\t)\n")
    return "".join(out)


SYMBOLS = [
    symbol("TCRT5000", "U", "TCRT5000", "OptoDevice:Vishay_TCRT5000", "https://www.vishay.com/docs/83760/tcrt5000.pdf",
           "Reflective optical sensor, IR LED + phototransistor, 2.5 mm peak distance (1 C, 2 E, 3 K, 4 A)",
           5.08, 3.81, [("passive", "A", "4", "L", 2.54), ("passive", "K", "3", "L", -2.54),
                        ("passive", "C", "1", "R", 2.54), ("passive", "E", "2", "R", -2.54)], "line follower reflective IR"),
    symbol("CS100A", "U", "CS100A", "Package_SO:SOIC-16_3.9x9.9mm_P1.27mm", "https://www.100sensor.com",
           "Ultrasonic ranging chip, 40 kHz, HC-SR04 TRIG/ECHO timing, 3-5.5 V, 8 MHz crystal (SOP-16)",
           10.16, 10.16, [("input", "TRIG", "8", "L", 5.08), ("output", "ECHO", "7", "L", 2.54), ("input", "PD", "16", "L", -0.0),
                         ("input", "BLIND2", "15", "L", -2.54), ("output", "TEST1", "5", "L", -5.08), ("output", "COMP0", "6", "L", -7.62),
                         ("output", "TP", "10", "R", 7.62), ("output", "TN", "11", "R", 5.08), ("input", "RP", "2", "R", 0.0),
                         ("input", "RN", "1", "R", -2.54), ("input", "XI", "13", "R", -5.08), ("output", "XO", "14", "R", -7.62),
                         ("power_in", "AVDD", "4", "T", -2.54), ("power_in", "DVDD", "9", "T", 2.54),
                         ("power_in", "AVSS", "3", "B", -2.54), ("power_in", "DVSS", "12", "B", 2.54)], "ultrasonic ranging"),
    symbol("LM339_QUAD", "U", "LM339", "Package_SO:SOIC-14_3.9x8.7mm_P1.27mm", "https://www.ti.com/lit/ds/symlink/lm339.pdf",
           "Quad comparator, open-collector outputs, all four in one unit",
           8.89, 11.43, [("input", "IN1+", "5", "L", 8.89), ("input", "IN1-", "4", "L", 6.35), ("input", "IN2+", "7", "L", 3.81),
                         ("input", "IN2-", "6", "L", 1.27), ("input", "IN3+", "9", "L", -1.27), ("input", "IN3-", "8", "L", -3.81),
                         ("input", "IN4+", "11", "L", -6.35), ("input", "IN4-", "10", "L", -8.89),
                         ("open_collector", "OUT1", "2", "R", 7.62), ("open_collector", "OUT2", "1", "R", 2.54),
                         ("open_collector", "OUT3", "14", "R", -2.54), ("open_collector", "OUT4", "13", "R", -7.62),
                         ("power_in", "V+", "3", "T", 0), ("power_in", "GND", "12", "B", 0)], "comparator quad"),
    symbol("US_TRANSDUCER", "LS", "40kHz", "RoboCoreV2:Ultrasonic_Transducer_D16.0mm_P10.00mm", "",
           "40 kHz open-type ultrasonic transducer (transmitter or receiver), pin 1 = +",
           2.54, 2.54, [("passive", "+", "1", "L", 0), ("passive", "-", "2", "R", 0)], "ultrasonic transducer 40kHz"),
]


def update_symbols():
    s = open(SYMLIB).read()
    for blk in SYMBOLS:
        name = re.match(r'\t\(symbol "([^"]+)"', blk).group(1)
        m = re.search(r'\n\t\(symbol "%s"\n' % re.escape(name), s)
        if m:                                           # replace our previous version
            start = m.start() + 1
            depth, i = 0, start
            while True:
                if s[i] == "(":
                    depth += 1
                elif s[i] == ")":
                    depth -= 1
                    if depth == 0:
                        break
                i += 1
            s = s[:start] + blk.rstrip("\n") + s[i + 1:]
        else:
            s = s.rstrip().rstrip(")").rstrip() + "\n" + blk + ")\n"
    open(SYMLIB, "w").write(s)


TRANSDUCER = '''(footprint "Ultrasonic_Transducer_D16.0mm_P10.00mm"
	(version 20241229)
	(generator "make_parts.py")
	(layer "F.Cu")
	(descr "40 kHz open ultrasonic transducer, 16 mm body, 12 mm tall, pins 10 mm apart (HYDZ HY40A16T12-1 / HY40A16R12-1). Pad 1 = +")
	(tags "ultrasonic transducer 40kHz 16mm")
	(property "Reference" "REF**" (at 5 -9.3 0) (layer "F.SilkS") (effects (font (size 1 1) (thickness 0.15))))
	(property "Value" "40kHz" (at 5 9.3 0) (layer "F.Fab") (effects (font (size 1 1) (thickness 0.15))))
	(attr through_hole)
	(fp_circle (center 5 0) (end 13.1 0) (stroke (width 0.12) (type solid)) (fill no) (layer "F.SilkS"))
	(fp_circle (center 5 0) (end 13 0) (stroke (width 0.1) (type solid)) (fill no) (layer "F.Fab"))
	(fp_circle (center 5 0) (end 13.35 0) (stroke (width 0.05) (type solid)) (fill no) (layer "F.CrtYd"))
	(fp_line (start -0.5 -2.4) (end 0.5 -2.4) (stroke (width 0.15) (type solid)) (layer "F.SilkS"))
	(fp_line (start 0 -2.9) (end 0 -1.9) (stroke (width 0.15) (type solid)) (layer "F.SilkS"))
	(fp_text user "${REFERENCE}" (at 5 0 0) (layer "F.Fab") (effects (font (size 1 1) (thickness 0.15))))
	(pad "1" thru_hole roundrect (at 0 0) (size 2 2) (drill 1.1) (layers "*.Cu" "*.Mask") (roundrect_rratio 0.25))
	(pad "2" thru_hole circle (at 10 0) (size 2 2) (drill 1.1) (layers "*.Cu" "*.Mask"))
	(model "${KICAD10_3DMODEL_DIR}/Buzzer_Beeper.3dshapes/Buzzer_12x9.5RM7.6.step"
		(offset (xyz 0 0 0)) (scale (xyz 1.316 1.316 1.263)) (rotate (xyz 0 0 0)))
)
'''


def update_footprints():
    open(os.path.join(FPLIB, "Ultrasonic_Transducer_D16.0mm_P10.00mm.kicad_mod"), "w").write(TRANSDUCER)


if __name__ == "__main__":
    update_symbols()
    update_footprints()
    print("symbols:", ", ".join(re.match(r'\t\(symbol "([^"]+)"', b).group(1) for b in SYMBOLS), "+ transducer footprint")
