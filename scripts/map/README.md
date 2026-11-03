# Pakistan official map asset

`build_map.py` regenerates `src/assets/maps/pakistan-official-map.json` (SVG paths, Lambert conformal conic).

Inputs (download into one folder):
- geoBoundaries gbOpen `PAK/ADM1`, `PAK/ADM2`, `IND/ADM1`, `IND/ADM2` (`*_simplified.geojson`)
- Natural Earth 10m `ne_10m_admin_0_countries.geojson`, `ne_10m_rivers_lake_centerlines.geojson`

```
pip install shapely
python3 build_map.py <data-folder> ../../src/assets/maps/pakistan-official-map.json
```

If Survey of Pakistan shapefiles become available, replace the geoBoundaries inputs and rerun; the dashboard needs no code change.
