import json, math, random, os

SEED = 42
rng = random.Random(SEED)
ORIGIN_LON = 79.0900
ORIGIN_LAT = 21.1400
LAT_PER_M = 1.0 / 111320.0
LON_PER_M = 1.0 / (111320.0 * math.cos(math.radians(ORIGIN_LAT)))

def m2d(dx, dy):
    return dx * LON_PER_M, dy * LAT_PER_M

def rect_poly(ox, oy, w, h):
    dx, dy = m2d(ox, oy)
    dw, dh = m2d(w, h)
    l0 = ORIGIN_LON + dx
    la0 = ORIGIN_LAT + dy
    c = [[l0, la0], [l0+dw, la0], [l0+dw, la0+dh], [l0, la0+dh], [l0, la0]]
    return {"type": "Polygon", "coordinates": [c]}

def ar(w, h):
    return round(w * h, 1)

CW, CH = 25.0, 20.0

def cell_origin(col, row):
    return col * CW, row * CH

SPECS = [
    dict(cad_id="P101",mun_id="M-101",bld_id="B-101",cad_owner="Ravi Kumar",mun_owner="Ravi Kumar",col=0,row=0,cad_w=CW,cad_h=CH,mun_offset_x=0.0,mun_offset_y=0.0,mun_w=CW,mun_h=CH,bld_inset=3.0),
    dict(cad_id="P102",mun_id="M-102",bld_id=None,cad_owner="Priya Sharma",mun_owner="P. Sharma",col=1,row=0,cad_w=CW,cad_h=CH,mun_offset_x=0.3,mun_offset_y=0.3,mun_w=CW,mun_h=CH,bld_inset=None),
    dict(cad_id="P103",mun_id="M-103",bld_id=None,cad_owner="Ravi Kumar",mun_owner="Amit Singh",col=2,row=0,cad_w=CW,cad_h=CH,mun_offset_x=0.2,mun_offset_y=0.2,mun_w=CW,mun_h=CH,bld_inset=None),
    dict(cad_id="P104",mun_id="M-104",bld_id="B-102",cad_owner="Sunita Patel",mun_owner="Sunita Patel",col=3,row=0,cad_w=CW,cad_h=CH,mun_offset_x=0.1,mun_offset_y=0.1,mun_w=CW+2.2,mun_h=CH+2.2,bld_inset=3.0),
    dict(cad_id="P105",mun_id="M-105",bld_id="B-103",cad_owner="Mohan Das",mun_owner="Mohan Das",col=4,row=0,cad_w=CW,cad_h=CH,mun_offset_x=5.0,mun_offset_y=4.0,mun_w=CW,mun_h=CH,bld_inset=3.0),
    dict(cad_id="P106",mun_id=None,bld_id="B-104",cad_owner="Lakshmi Naidu",col=5,row=0,cad_w=CW,cad_h=CH,bld_inset=3.0),
    dict(cad_id="P107",mun_id="M-106",bld_id=None,cad_owner="Deepak Verma",mun_owner="D. Verma Sharma",col=0,row=1,cad_w=CW,cad_h=CH,mun_offset_x=6.0,mun_offset_y=5.0,mun_w=CW-3.0,mun_h=CH-3.0,bld_inset=None),
]

OWNERS = ["Anjali Mehta","Suresh Yadav","Kavita Joshi","Rajesh Tiwari","Pooja Gupta","Vikram Reddy","Nandini Rao","Arun Chaudhary","Sneha Kulkarni","Harish Pandey","Meera Desai","Sanjay Bose","Geeta Iyer","Prakash Nair","Uma Krishnan","Ritesh Saxena","Deepa Aggarwal","Manoj Singh","Kamala Devi","Sunil Bajaj","Renu Malhotra","Ashok Bhatt"]

pos = [(c, r) for r in range(5) for c in range(6) if r != 0 and not (r == 1 and c == 0)]
for i, ow in enumerate(OWNERS):
    if i >= len(pos):
        break
    c, r = pos[i]
    dw = rng.uniform(-2, 2)
    dh = rng.uniform(-1.5, 1.5)
    w = CW + dw
    h = CH + dh
    mx = rng.uniform(0, 0.5)
    my = rng.uniform(0, 0.5)
    hb = rng.random() < 0.60
    SPECS.append(dict(
        cad_id="P%d" % (108 + i),
        mun_id="M-%d" % (107 + i),
        bld_id="B-%d" % (105 + i) if hb else None,
        cad_owner=ow, mun_owner=ow,
        col=c, row=r,
        cad_w=w, cad_h=h,
        mun_offset_x=mx, mun_offset_y=my,
        mun_w=w, mun_h=h,
        bld_inset=3.0 if hb else None,
    ))

META = {
    "dataset": "SIH26013 Synthetic Demo Dataset",
    "description": "SYNTHETIC DATA ONLY. Generated for the SIH26013 prototype. Does not represent any real land records, government data, or actual geography.",
    "study_area": "Synthetic Vastu Nagar ward (fictional urban block)",
    "crs": "EPSG:4326 (WGS 84)",
    "seed": SEED,
    "generator": "generate_demo_data.py",
}

def gc(features):
    return {
        "type": "FeatureCollection",
        "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
        "metadata": META,
        "features": [f for f in features if f],
    }

cad = []
mun = []
bld = []

for s in SPECS:
    ox, oy = cell_origin(s["col"], s["row"])
    cad.append({
        "type": "Feature",
        "geometry": rect_poly(ox, oy, s["cad_w"], s["cad_h"]),
        "properties": {
            "parcel_id": s["cad_id"],
            "owner_name": s["cad_owner"],
            "area": ar(s["cad_w"], s["cad_h"]),
            "land_area": ar(s["cad_w"], s["cad_h"]),
            "survey_no": "SY/%s/2024" % s["cad_id"],
            "note": "SYNTHETIC DATA -- demo only",
        },
    })
    if s.get("mun_id"):
        mw = s.get("mun_w", s["cad_w"])
        mh = s.get("mun_h", s["cad_h"])
        mx = s.get("mun_offset_x", 0.0)
        my_off = s.get("mun_offset_y", 0.0)
        mun.append({
            "type": "Feature",
            "geometry": rect_poly(ox + mx, oy + my_off, mw, mh),
            "properties": {
                "property_id": s["mun_id"],
                "holder_name": s["mun_owner"],
                "plot_area": ar(mw, mh),
                "ward": "Vastu Nagar",
                "note": "SYNTHETIC DATA -- demo only",
            },
        })
    if s.get("bld_id") and s.get("bld_inset"):
        ins = s["bld_inset"]
        bw = s["cad_w"] - 2 * ins
        bh = s["cad_h"] - 2 * ins
        if bw > 0 and bh > 0:
            bld.append({
                "type": "Feature",
                "geometry": rect_poly(ox + ins, oy + ins, bw, bh),
                "properties": {
                    "building_id": s["bld_id"],
                    "building_area": ar(bw, bh),
                    "floors": rng.randint(1, 3),
                    "note": "SYNTHETIC DATA -- demo only",
                },
            })

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "")
for name, fc in [("cadastral.geojson", gc(cad)), ("municipal.geojson", gc(mun)), ("buildings.geojson", gc(bld))]:
    p = os.path.join("c:\\Users\\hp\\Desktop\\SIH26013\\sample-data", name)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(fc, f, indent=2)
    print("Wrote %s  (%d features)" % (p, len(fc["features"])))

print("Done")
