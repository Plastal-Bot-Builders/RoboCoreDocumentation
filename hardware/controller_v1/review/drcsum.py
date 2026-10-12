import json,sys,collections
d=json.load(open(sys.argv[1]))
c=collections.Counter((v["severity"],v["type"]) for v in d["violations"])
print("errors:",{k[1]:n for k,n in c.items() if k[0]=="error"},"| warnings:",{k[1]:n for k,n in c.items() if k[0]=="warning"},"| unconnected:",len(d["unconnected_items"]),"| parity:",len(d.get("schematic_parity",[])))
for v in d["unconnected_items"]: print("  UNCONN "+" | ".join(f'{i["description"][:60]} @({i["pos"]["x"]:.2f},{i["pos"]["y"]:.2f})' for i in v["items"]))
for v in d["violations"]:
    if v["severity"]=="error" or v["type"] in ("track_dangling","via_dangling"): print(f'  [{v["type"]}] '+" | ".join(f'{i["description"][:60]} @({i["pos"]["x"]:.2f},{i["pos"]["y"]:.2f})' for i in v["items"]))
for v in d.get("schematic_parity",[]): print("  PARITY",v["description"][:100])
