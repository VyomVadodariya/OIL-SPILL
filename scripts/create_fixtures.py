import os
import json
import pandas as pd
from pathlib import Path
from pyproj import Transformer

def create_environment_fixture():
    out_dir = Path("data/demo_case/environmental")
    out_dir.mkdir(parents=True, exist_ok=True)
    
    # Deterministic forcing pushing spills roughly North-East
    forcing = {
        "status": "DEMO ENVIRONMENTAL FORCING",
        "provenance": "Synthetic Golden Demo Fixture",
        "timestamp": "2019-10-15T00:00:00Z",
        "wind": {
            "u_comp": 2.5, # m/s East
            "v_comp": 3.0, # m/s North
            "units": "m/s"
        },
        "current": {
            "u_comp": 0.2, # m/s East
            "v_comp": 0.3, # m/s North
            "units": "m/s"
        },
        "spatial_extent": "EPSG:32616 (UTM Zone 16N)"
    }
    
    with open(out_dir / "forcing.json", "w") as f:
        json.dump(forcing, f, indent=4)
    print("Environment fixture created.")

def create_ais_fixture():
    out_dir = Path("data/demo_case/ais")
    out_dir.mkdir(parents=True, exist_ok=True)
    
    # Transform EPSG:32616 to WGS84 (Lat/Lon) to get reasonable coordinates
    # Center of image: X=289000, Y=3195000
    transformer = Transformer.from_crs("EPSG:32616", "EPSG:4326", always_xy=True)
    lon_center, lat_center = transformer.transform(289000, 3195000)
    
    records = []
    
    # Base timestamp 6 hours before the image
    base_time = pd.Timestamp("2019-10-14T18:00:00Z")
    
    # Vessel 1
    for i in range(10):
        t = base_time + pd.Timedelta(minutes=i*30)
        records.append({
            "mmsi": "111111111",
            "ship_name": "DEMO_VESSEL_001",
            "timestamp": t.isoformat(),
            "latitude": lat_center - 0.05 + (i * 0.005),
            "longitude": lon_center - 0.05 + (i * 0.005),
            "speed": 12.5,
            "heading": 45.0
        })
        
    # Vessel 2
    for i in range(10):
        t = base_time - pd.Timedelta(hours=24) + pd.Timedelta(minutes=i*30)
        records.append({
            "mmsi": "222222222",
            "ship_name": "DEMO_VESSEL_002",
            "timestamp": t.isoformat(),
            "latitude": lat_center - 0.02 + (i * 0.002),
            "longitude": lon_center + 0.02 - (i * 0.002),
            "speed": 10.0,
            "heading": 315.0
        })
        
    # Vessel 3
    for i in range(10):
        t = base_time + pd.Timedelta(days=2) + pd.Timedelta(minutes=i*30)
        records.append({
            "mmsi": "333333333",
            "ship_name": "DEMO_VESSEL_003",
            "timestamp": t.isoformat(),
            "latitude": lat_center,
            "longitude": lon_center,
            "speed": 15.0,
            "heading": 90.0
        })
        
    df = pd.DataFrame(records)
    df.to_csv(out_dir / "fixture.csv", index=False)
    print("AIS fixture created.")

if __name__ == "__main__":
    create_environment_fixture()
    create_ais_fixture()
