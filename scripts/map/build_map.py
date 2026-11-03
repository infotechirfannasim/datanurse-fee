"""
Builds src/assets/maps/pakistan-official-map.json for the DataNurse public dashboard.

Sources (verified open datasets):
  * geoBoundaries gbOpen PAK ADM1 / ADM2  (provinces, territories, districts)
  * geoBoundaries gbOpen IND ADM1 / ADM2  (Jammu & Kashmir + Ladakh claim extent, Junagadh)
  * Natural Earth 10m admin-0 countries   (neighbours, Siachen, China-administered areas)
  * Natural Earth 10m rivers              (rivers)

Cartography follows the Government of Pakistan political map (Survey of Pakistan, 2020):
  * Gilgit-Baltistan and Azad Jammu & Kashmir shown as part of Pakistan
  * Siachen shown north of the Line of Control (NJ9842 -> Karakoram Pass)
  * Indian Illegally Occupied Jammu & Kashmir shown as disputed territory
  * Eastern frontier with China left undefined (fill fades, no boundary line)
  * Insets for Sir Creek and Junagadh & Manavadar
Projection: Lambert Conformal Conic (std parallels 25N / 35N, origin 30N 70E).
"""
import json, math, sys
from shapely.geometry import shape, box, mapping, Point, LineString, MultiLineString, Polygon, MultiPolygon, GeometryCollection
from shapely.ops import unary_union, transform

GEO = sys.argv[1]
OUT = sys.argv[2]

def load(name):
    return json.load(open(f"{GEO}/{name}"))

def g(f):
    return shape(f["geometry"]).buffer(0)

# ── Projection ────────────────────────────────────────────────────────────────
PHI1, PHI2, PHI0, LAM0 = map(math.radians, (25, 35, 30, 70))
N = math.log(math.cos(PHI1) / math.cos(PHI2)) / math.log(
    math.tan(math.pi / 4 + PHI2 / 2) / math.tan(math.pi / 4 + PHI1 / 2))
F = math.cos(PHI1) * math.tan(math.pi / 4 + PHI1 / 2) ** N / N
RHO0 = F / math.tan(math.pi / 4 + PHI0 / 2) ** N

def lcc(lon, lat):
    rho = F / math.tan(math.pi / 4 + math.radians(lat) / 2) ** N
    th = N * (math.radians(lon) - LAM0)
    return rho * math.sin(th), RHO0 - rho * math.cos(th)

EXT = (60.4, 22.5, 81.2, 37.4)         # lon/lat window of the main map
corners = [lcc(EXT[0], EXT[1]), lcc(EXT[2], EXT[1]), lcc(EXT[0], EXT[3]), lcc(EXT[2], EXT[3]),
           lcc((EXT[0] + EXT[2]) / 2, EXT[3])]
minx = min(c[0] for c in corners); maxx = max(c[0] for c in corners)
miny = min(c[1] for c in corners); maxy = max(c[1] for c in corners)
W = 1000.0
S = W / (maxx - minx)
H = round((maxy - miny) * S, 1)

def P(lon, lat):
    x, y = lcc(lon, lat)
    return (x - minx) * S, (maxy - y) * S

def proj(geom):
    return transform(_proj_xy, geom)

def _proj_xy(xs, ys):
    pts = [P(a, b) for a, b in zip(xs, ys)]
    return [p[0] for p in pts], [p[1] for p in pts]

VIEW = box(0, 0, W, H)

def fmt(v):
    s = f"{v:.1f}"
    return s[:-2] if s.endswith(".0") else s

def ring_path(coords):
    pts = list(coords)
    if len(pts) < 3:
        return ""
    out = [f"M{fmt(pts[0][0])} {fmt(pts[0][1])}"]
    px, py = pts[0]
    for x, y in pts[1:-1]:
        out.append(f"l{fmt(x - px)} {fmt(y - py)}")
        px, py = round(px + float(fmt(x - px)), 1), round(py + float(fmt(y - py)), 1)
    return "".join(out) + "Z"

def line_path(coords):
    pts = list(coords)
    if len(pts) < 2:
        return ""
    out = [f"M{fmt(pts[0][0])} {fmt(pts[0][1])}"]
    for x, y in pts[1:]:
        out.append(f"L{fmt(x)} {fmt(y)}")
    return "".join(out)

def polys(geom):
    if geom.is_empty:
        return []
    if isinstance(geom, Polygon):
        return [geom]
    if isinstance(geom, (MultiPolygon, GeometryCollection)):
        r = []
        for x in geom.geoms:
            r += polys(x)
        return r
    return []

def lines(geom):
    if geom.is_empty:
        return []
    if isinstance(geom, LineString):
        return [geom]
    if hasattr(geom, "geoms"):
        r = []
        for x in geom.geoms:
            r += lines(x)
        return r
    return []

def area_path(geom, tol=0.5, min_area=1.0, clip=True):
    gp = proj(geom)
    if clip:
        gp = gp.intersection(VIEW)
    gp = gp.simplify(tol, preserve_topology=True)
    parts = []
    for p in polys(gp):
        if p.area < min_area:
            continue
        parts.append(ring_path(p.exterior.coords))
        for i in p.interiors:
            if Polygon(i).area >= min_area:
                parts.append(ring_path(i.coords))
    return "".join(parts)

def lines_path(geom, tol=0.4, min_len=2.0):
    gp = proj(geom).intersection(VIEW).simplify(tol)
    from shapely.ops import linemerge
    ls = lines(gp)
    if not ls:
        return ""
    merged = linemerge(ls)
    return "".join(line_path(l.coords) for l in lines(merged) if l.length >= min_len)

def label_pt(geom):
    c = proj(geom).representative_point()
    return round(c.x, 1), round(c.y, 1)

# ── Load data ─────────────────────────────────────────────────────────────────
pak1 = load("geoBoundaries-PAK-ADM1_simplified.geojson")["features"]
pak2 = load("geoBoundaries-PAK-ADM2_simplified.geojson")["features"]
ind1 = load("geoBoundaries-IND-ADM1_simplified.geojson")["features"]
ind2 = load("geoBoundaries-IND-ADM2_simplified.geojson")["features"]
ne = load("ne_10m_admin_0_countries.geojson")["features"]
rivers = load("ne_10m_rivers_lake_centerlines.geojson")["features"]

NE = {}
for f in ne:
    NE.setdefault(f["properties"]["ADM0_A3"], []).append(g(f))
NE = {k: unary_union(v) for k, v in NE.items()}

prov = {f["properties"]["shapeName"]: g(f) for f in pak1}
# Siachen (NJ9842 -> Karakoram Pass) shown within Gilgit-Baltistan, as on the official map
prov["Gilgit-Baltistan"] = unary_union([prov["Gilgit-Baltistan"], NE["KAS"]]).buffer(0)
pak_union = unary_union(list(prov.values())).buffer(0)

claim = unary_union([g(f) for f in ind1 if f["properties"]["shapeName"] in ("Jammu and Kashmīr", "Ladākh")])
iiojk = claim.difference(pak_union).difference(NE["CHN"]).difference(NE["AFG"])
iiojk_parts = sorted(polys(iiojk), key=lambda p: -p.area)
iiojk = iiojk_parts[0]
for p in iiojk_parts[1:]:
    if p.area > 0.05:
        iiojk = iiojk.union(p)

# ── Province metadata (cartographic only; LOV matching happens against DB names/codes) ──
# id, display name, official-map fill, label offset (lon/lat), label rotation, aliases
PROV_META = [
    ("PK-BA", "Balochistan", "#FDDDA6", (1.2, -0.6), -32, ["balochistan", "baluchistan"]),
    ("PK-SD", "Sindh", "#E4D7EC", (0.2, -0.4), 0, ["sindh", "sind"]),
    ("PK-PB", "Punjab", "#FBE0D5", (-0.3, 0.6), 0, ["punjab"]),
    ("PK-KP", "Khyber Pakhtunkhwa", "#F8CDD2", (-0.6, -0.4), -62,
     ["khyberpakhtunkhwa", "kpk", "kp", "nwfp", "northwestfrontierprovince", "fata", "khyberpakhtunkhwafata"]),
    ("PK-IS", "Islamabad Capital Territory", "#F4B8C0", (0, 0), 0,
     ["islamabadcapitalterritory", "islamabad", "ict", "federalcapital", "federalcapitalterritory"]),
    ("PK-GB", "Gilgit-Baltistan", "#CDE9CD", (0.9, 0.55), -14,
     ["gilgitbaltistan", "gb", "northernareas", "gilgit"]),
    ("PK-JK", "Azad Jammu & Kashmir", "#F3D3C6", (-0.05, 0.25), -72,
     ["azadkashmir", "azadjammukashmir", "azadjammuandkashmir", "ajk", "azadjammuandkashmirajk", "azadjk"]),
]
SRC_NAME = {
    "PK-BA": "Balochistan", "PK-SD": "Sindh", "PK-PB": "Punjab", "PK-KP": "Khyber Pakhtunkhwa",
    "PK-IS": "Islamabad Capital Territory", "PK-GB": "Gilgit-Baltistan", "PK-JK": "Azad Kashmir",
}
LABEL_TEXT = {
    "PK-BA": "BALOCHISTAN", "PK-SD": "SINDH", "PK-PB": "PUNJAB", "PK-KP": "KHYBER PAKHTUNKHWA",
    "PK-GB": "GILGIT-BALTISTAN", "PK-JK": "AJK*", "PK-IS": "",
}

# Case-count marker anchors (lon/lat), placed clear of the province names
BUBBLE_AT = {
    "PK-BA": (64.7, 29.0), "PK-SD": (68.9, 26.5), "PK-PB": (72.1, 30.2), "PK-KP": (70.35, 33.75),
    "PK-IS": (73.95, 33.05), "PK-GB": (75.3, 35.55), "PK-JK": (73.72, 33.45),
}

provinces = []
for pid, name, fill, (dlon, dlat), rot, aliases in PROV_META:
    geom = prov[SRC_NAME[pid]]
    rp = geom.representative_point()
    lx, ly = P(rp.x + dlon, rp.y + dlat)
    minb = proj(geom).bounds
    blon, blat = BUBBLE_AT[pid]
    cx, cy = P(blon, blat)
    provinces.append({
        "cx": round(cx, 1), "cy": round(cy, 1), "leader": list(label_pt(geom)) if pid == "PK-IS" else None,
        "id": pid, "name": name, "aliases": aliases, "fill": fill,
        "path": area_path(geom, tol=0.45, min_area=0.6),
        "label": LABEL_TEXT[pid], "lx": round(lx, 1), "ly": round(ly, 1), "rot": rot,
        "bbox": [round(v, 1) for v in minb],
    })

# ── Districts (ADM2) with parent province by largest overlap ─────────────────
DIST_ALIASES = {
    "Nawabshah": ["shaheedbenazirabad", "shahidbenazirabad", "benazirabad"],
    "Kachhi": ["bolan", "kachhibolan"],
    "Qilla Abdullah": ["killaabdullah", "qillaabdullah", "chaman"],
    "Qilla Saifullah": ["killasaifullah"],
    "Karachi": ["karachicentral", "karachieast", "karachiwest", "karachisouth", "korangi", "malir", "keamari", "kemari", "karachi"],
    "Dera Ghazi Khan": ["dgkhan", "deraghazikhan"],
    "Dera Ismail Khan": ["dikhan", "deraismailkhan"],
    "Toba Tek Singh": ["tobateksingh", "tts"],
    "Mandi Bahauddin": ["mandibahauddin", "mandibahaudin"],
    "Naushehro Feroze": ["naushahroferoze", "nausheroferoz", "naushahroferoz"],
    "Qambar Shahdadkot": ["qambarshahdadkot", "kambarshahdadkot", "kamber"],
    "Lower Dir": ["dirlower", "lowerdir"], "Upper Dir": ["dirupper", "upperdir"],
    "Islamabad Capital Territory": ["islamabad", "ict"],
    "Azad Kashmir": ["azadkashmir", "ajk", "muzaffarabad", "mirpur"],
    "Kech": ["kech", "turbat"], "Lasbela": ["lasbela", "hub"],
}
districts = []
for f in pak2:
    nm = f["properties"]["shapeName"]
    geom = g(f)
    best, ov = None, 0
    for pid, *_ in PROV_META:
        a = geom.intersection(prov[SRC_NAME[pid]]).area
        if a > ov:
            best, ov = pid, a
    cx, cy = label_pt(geom)
    districts.append({
        "id": "D-" + "".join(ch for ch in nm.upper() if ch.isalnum()),
        "name": nm, "province": best,
        "aliases": sorted(set(DIST_ALIASES.get(nm, []) + ["".join(ch for ch in nm.lower() if ch.isalnum())])),
        "path": area_path(geom, tol=0.35, min_area=0.3), "cx": cx, "cy": cy,
    })

# ── Lines ────────────────────────────────────────────────────────────────────
EPS = 0.02
pak_outline = pak_union.boundary
international = pak_outline.difference(iiojk.buffer(EPS))
ajk_gb = unary_union([prov["Azad Kashmir"], prov["Gilgit-Baltistan"]])
loc = ajk_gb.boundary.intersection(iiojk.buffer(EPS))
working = prov["Punjab"].boundary.intersection(iiojk.buffer(EPS))
iiojk_india = iiojk.boundary.difference(pak_union.buffer(EPS)).difference(NE["CHN"].buffer(0.12))
provincial = unary_union([v.boundary for v in prov.values()]).difference(pak_outline.buffer(EPS))

# ── Neighbours ───────────────────────────────────────────────────────────────
ext_box = box(EXT[0] - 3, EXT[1] - 3, EXT[2] + 3, EXT[3] + 3)
NB = [("AFG", "AFGHANISTAN"), ("IRN", "IRAN"), ("CHN", "CHINA"), ("IND", "INDIA"), ("TJK", "TAJIKISTAN"),
      ("TKM", "TURKMENISTAN"), ("NPL", "NEPAL"), ("OMN", "OMAN"), ("UZB", "UZBEKISTAN"), ("KGZ", "KYRGYZSTAN")]
neighbours = []
for code, nm in NB:
    if code not in NE:
        continue
    geom = NE[code].intersection(ext_box)
    if code == "IND":
        geom = geom.difference(iiojk).difference(pak_union)
    if code == "CHN":
        geom = geom.difference(pak_union)
    if geom.is_empty:
        continue
    neighbours.append({"code": code, "name": nm, "path": area_path(geom, tol=0.6, min_area=2)})

# Neighbour and sea labels (cartographic positions, lon/lat)
NB_LABELS = [
    ("AFGHANISTAN", 65.6, 33.2, -38, 16), ("IRAN", 61.2, 27.0, -82, 16), ("INDIA", 73.6, 27.4, -64, 16),
    ("CHINA", 79.6, 36.1, -12, 14), ("TAJIKISTAN", 71.6, 37.15, 0, 9),
    ("ARABIAN SEA", 64.6, 23.75, 0, 15),
]
labels = []
for t, lon, lat, rot, size in NB_LABELS:
    x, y = P(lon, lat)
    labels.append({"text": t, "x": round(x, 1), "y": round(y, 1), "rot": rot, "size": size})

# ── Rivers (inside Pakistan and the disputed territory, as on the official map) ──
riv_lines = []
clip_area = unary_union([pak_union, iiojk])
for f in rivers:
    geom = shape(f["geometry"])
    if geom.intersects(clip_area):
        riv_lines.append(geom.intersection(clip_area))
rivers_path = lines_path(unary_union(riv_lines), tol=0.5, min_len=6)

# ── Graticule (2 degree) ─────────────────────────────────────────────────────
grat = []
for lon in range(58, 84, 2):
    grat.append(LineString([(lon, lat / 4) for lat in range(int(21 * 4), int(39 * 4) + 1)]))
for lat in range(22, 40, 2):
    grat.append(LineString([(lon / 4, lat) for lon in range(int(56 * 4), int(84 * 4) + 1)]))
graticule_path = lines_path(MultiLineString(grat), tol=0.3, min_len=1)

# ── Cities (federal & provincial capitals as on the official legend) ─────────
CITIES = [("Islamabad", 73.05, 33.69, "capital"), ("Lahore", 74.34, 31.55, "hq"), ("Karachi", 67.01, 24.86, "hq"),
          ("Quetta", 66.99, 30.18, "hq"), ("Peshawar", 71.58, 34.01, "hq"), ("Gilgit", 74.31, 35.92, "hq"),
          ("Muzaffarabad", 73.47, 34.37, "hq"), ("Srinagar", 74.80, 34.08, "other"), ("Jammu", 74.86, 32.73, "other")]
cities = []
for nm, lon, lat, kind in CITIES:
    x, y = P(lon, lat)
    cities.append({"name": nm, "x": round(x, 1), "y": round(y, 1), "kind": kind})

# IIOJK label + fade gradient anchor (frontier undefined to the east)
ix, iy = P(77.1, 33.55)
fx0, _ = P(77.6, 34.5)
fx1, _ = P(79.9, 34.5)
fu_x, fu_y = P(80.35, 33.4)

# ── Insets ───────────────────────────────────────────────────────────────────
def inset(window, size, polys_spec):
    """Project a lon/lat window with simple equirectangular (cos-lat) into a size[0] x size[1] box."""
    lon0, lat0, lon1, lat1 = window
    k = math.cos(math.radians((lat0 + lat1) / 2))
    sx = size[0] / ((lon1 - lon0) * k)
    sy = size[1] / (lat1 - lat0)
    s = min(sx, sy)
    def q(xs, ys):
        return [((a - lon0) * k * s) for a in xs], [((lat1 - b) * s) for b in ys]
    vb = box(0, 0, size[0], size[1])
    out = []
    for key, geom, extra in polys_spec:
        gp = transform(q, geom.intersection(box(lon0 - 1, lat0 - 1, lon1 + 1, lat1 + 1))).intersection(vb).simplify(0.4)
        d = "".join(ring_path(p.exterior.coords) for p in polys(gp) if p.area > 0.5)
        out.append({"key": key, "path": d, **extra})
    return out, (lambda lon, lat: (round((lon - lon0) * k * s, 1), round((lat1 - lat) * s, 1)))

ind_all = NE["IND"]
jun = unary_union([g(f) for f in ind2 if f["properties"]["shapeName"] in ("Junagadh", "Gir Somnath")])
jun_layers, jq = inset((68.6, 20.4, 72.6, 23.4), (260, 190), [
    ("land", ind_all, {}),
    ("junagadh", jun, {}),
])
mx, my = jq(70.13, 21.50)
jx, jy = jq(70.55, 21.15)

sir_layers, sq = inset((67.7, 23.3, 69.6, 24.6), (190, 150), [
    ("land", ind_all, {}),
    ("pakistan", prov["Sindh"], {}),
])
scx, scy = sq(68.75, 23.75)

data = {
    "meta": {
        "title": "Pakistan — Political",
        "projection": "Lambert Conformal Conic (25N/35N, 30N 70E)",
        "sources": [
            "geoBoundaries gbOpen PAK ADM1/ADM2 (CC BY 4.0)",
            "geoBoundaries gbOpen IND ADM1/ADM2 (disputed-territory extent, Junagadh)",
            "Natural Earth 10m admin-0 countries and rivers (public domain)",
        ],
        "reference": "Government of Pakistan political map (Survey of Pakistan, 4 Aug 2020)",
    },
    "width": W, "height": H,
    "provinces": provinces,
    "districts": districts,
    "disputed": {
        "id": "IIOJK",
        "name": "Indian Illegally Occupied Jammu & Kashmir",
        "path": area_path(iiojk, tol=0.45, min_area=0.6),
        "lx": round(ix, 1), "ly": round(iy, 1),
        "fadeX0": round(fx0, 1), "fadeX1": round(fx1, 1),
        "frontierX": round(fu_x, 1), "frontierY": round(fu_y, 1),
    },
    "lines": {
        "international": lines_path(international, tol=0.35),
        "provincial": lines_path(provincial, tol=0.35),
        "loc": lines_path(loc, tol=0.35),
        "working": lines_path(working, tol=0.35),
        "iiojkIndia": lines_path(iiojk_india, tol=0.35, min_len=4),
    },
    "neighbours": neighbours,
    "labels": labels,
    "rivers": rivers_path,
    "graticule": graticule_path,
    "cities": cities,
    "insets": {
        "junagadh": {"w": 260, "h": 190, "layers": jun_layers, "manavadar": [mx, my], "label": [jx, jy]},
        "sirCreek": {"w": 190, "h": 150, "layers": sir_layers, "creek": [scx, scy]},
    },
}
json.dump(data, open(OUT, "w"), separators=(",", ":"), ensure_ascii=False)
print("written", OUT, "size", len(json.dumps(data, separators=(",", ":"))), "W,H", W, H)
for p in provinces:
    print(p["id"], len(p["path"]))
print("districts", len(districts), sum(len(d["path"]) for d in districts))
print("unassigned districts", [d["name"] for d in districts if not d["province"]])
