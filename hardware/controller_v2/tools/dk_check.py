"""Compact Digi-Key availability check for RoboCore V2 part numbers.

Uses the KiCad MCP server's Digi-Key client (credentials stay in ~/code/KiCAD-MCP-Server/.env and are never printed).
usage: ~/code/KiCAD-MCP-Server/venv/bin/python tools/dk_check.py [MPN ...]
"""
import os, sys

sys.path.insert(0, os.path.expanduser("~/code/KiCAD-MCP-Server/python"))
from commands.digikey import DigiKeyClient, normalize_product  # noqa: E402

PARTS = [
    # ICs / modules
    "ESP32-S3-WROOM-1-N8R2", "DRV8411ARTER", "TPS63001DRCR", "TPS61089RNRR", "MCP73871-2CCI/ML", "LSM6DSOXTR",
    "USBLC6-2SC6", "WS2812B-2020", "AO3401A", "AO3400A", "1N4148W-7-F",
    # connectors / electromechanical
    "TYPE-C-31-M-12", "XT30UPB-M", "BM06B-SRSS-TB", "BM04B-SRSS-TB", "SKQGADE010", "PCM12SMTR", "CMT-8504-100-SMT-TR",
    # passives with specific part numbers
    "XAL5030-222MEC", "SRN4018-2R2M", "MF-MSMF150/24X-2", "LTST-C191KRKT", "LTST-C191KGKT", "LTST-C191TBKT",
]


def check(client, mpn):
    try:
        res = client.search_keyword(mpn, limit=8)
    except Exception as e:   # noqa: BLE001
        return f"{mpn:28s} ERROR {str(e)[:80]}"
    prods = [normalize_product(p) for p in res.get("Products", [])]
    exact = [p for p in prods if p["mpn"].upper() == mpn.upper()] or \
            [p for p in prods if p["mpn"].upper().startswith(mpn.upper())]
    if not exact:
        alt = ", ".join(p["mpn"] for p in prods[:3])
        return f"{mpn:28s} NOT FOUND (closest: {alt})"
    p = max(exact, key=lambda q: q["quantityAvailable"] or 0)
    price = p.get("unitPrice")
    return (f"{mpn:28s} {p['status'][:14]:14s} stock {p['quantityAvailable'] or 0:>8} "
            f"${price if price is not None else '-':<7} {p['manufacturer'][:22]:22s} {p['description'][:44]}")


def main():
    parts = sys.argv[1:] or PARTS
    client = DigiKeyClient()
    if not client.has_credentials():
        sys.exit("Digi-Key credentials not configured")
    for mpn in parts:
        print(check(client, mpn), flush=True)


if __name__ == "__main__":
    main()
