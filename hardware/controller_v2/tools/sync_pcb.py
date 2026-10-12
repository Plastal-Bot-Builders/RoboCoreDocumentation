"""Update an existing board from its schematic without touching the routing or hand edits (KiCad's Python):
copies every part's fields (MF, MP, LCSC, ALT, Description, Datasheet) onto its footprint and swaps footprints whose
library footprint changed (same position, rotation and side). Then refills the pours.

  <KiCad python> tools/sync_pcb.py .                    RoboCore_V2           # main board
  <KiCad python> tools/sync_pcb.py sensors/ultrasonic   RoboCore_Ultrasonic
"""
import os, shutil, subprocess, sys, xml.etree.ElementTree as ET
import pcbnew

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
sys.path.insert(0, HERE)
CLI = "/Applications/KiCad.app/Contents/MacOS/kicad-cli"
FPLIB = "/Applications/KiCad.app/Contents/SharedSupport/footprints"
FIELDS = ("MF", "MP", "LCSC", "ALT", "Description")


def netlist(folder, name):
    out = os.path.join(os.environ.get("TMPDIR", "/tmp"), f"{name}_sync_net.xml")
    subprocess.run([CLI, "sch", "export", "netlist", "--format", "kicadxml", "-o", out, f"{name}.kicad_sch"],
                   cwd=folder, check=True, capture_output=True)
    comps = {}
    for c in ET.parse(out).getroot().iter("comp"):
        f = {x.get("name"): (x.text or "") for x in c.iter("field") if x.get("name") in FIELDS}
        ds = c.findtext("datasheet") or ""
        comps[c.get("ref")] = dict(footprint=c.findtext("footprint"), value=c.findtext("value"), fields=f,
                                   datasheet="" if ds == "~" else ds)
    return comps


def fp_path(lib):
    return os.path.join(PROJ, "lib", "RoboCoreV2.pretty") if lib == "RoboCoreV2" else os.path.join(FPLIB, f"{lib}.pretty")


def swap(board, old, fpid):
    lib, name = fpid.split(":")
    new = pcbnew.FootprintLoad(fp_path(lib), name)
    new.SetFPID(pcbnew.LIB_ID(lib, name))
    new.SetReference(old.GetReference()); new.SetValue(old.GetValue())
    new.SetPath(old.GetPath()); new.SetSheetname(old.GetSheetname())
    nets = {p.GetNumber(): p.GetNetCode() for p in old.Pads()}
    pos, rot, flipped, refvis = old.GetPosition(), old.GetOrientationDegrees(), old.IsFlipped(), old.Reference().IsVisible()
    board.Delete(old)
    new.SetPosition(pcbnew.VECTOR2I(pos.x, pos.y))
    board.Add(new)
    if flipped:
        new.Flip(new.GetPosition(), pcbnew.FLIP_DIRECTION_LEFT_RIGHT)
    new.SetOrientationDegrees(rot)
    new.Reference().SetVisible(refvis)
    for p in new.Pads():
        if p.GetNumber() in nets:
            p.SetNetCode(nets[p.GetNumber()])
    return new


def main():
    folder = os.path.join(PROJ, sys.argv[1])
    name = sys.argv[2]
    comps = netlist(folder, name)
    work = os.path.join(os.environ.get("TMPDIR", "/tmp"), f"sync_{name}")
    os.makedirs(work, exist_ok=True)
    for f in (f"{name}.kicad_pcb", f"{name}.kicad_pro", "fp-lib-table"):
        if os.path.exists(os.path.join(folder, f)):
            shutil.copy(os.path.join(folder, f), os.path.join(work, f))
    if name == "RoboCore_V2":
        import route_pcb
        route_pcb.write_netclasses(os.path.join(work, f"{name}.kicad_pro"))
    path = os.path.join(work, f"{name}.kicad_pcb")
    board = pcbnew.LoadBoard(path)
    swapped, changed = [], 0
    for fp in list(board.GetFootprints()):
        c = comps.get(fp.GetReference())
        if not c:
            continue
        if c["footprint"] and c["footprint"] != fp.GetFPIDAsString():
            fp = swap(board, fp, c["footprint"])
            swapped.append(fp.GetReference())
        have = {f.GetName(): f.GetText() for f in fp.GetFields()}
        for k, v in list(c["fields"].items()) + [("Datasheet", c["datasheet"])]:
            if have.get(k) != v:
                fp.SetField(k, v)
                changed += 1
                for f in fp.GetFields():
                    if f.GetName() == k and k != "Datasheet":
                        f.SetVisible(False)
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    pcbnew.SaveBoard(path, board)
    shutil.copy(path, os.path.join(folder, f"{name}.kicad_pcb"))
    if name == "RoboCore_V2":
        route_pcb.write_netclasses(os.path.join(folder, f"{name}.kicad_pro"))
    print(f"{name}: footprints swapped {swapped}, {changed} field values updated")


if __name__ == "__main__":
    main()
