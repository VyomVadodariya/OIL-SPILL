from typing import List, Dict, Optional
import pandas as pd
from datetime import datetime
from src.ais.provider import AISProvider, ProviderCapabilities

class OfflineAISProvider(AISProvider):
    """
    Offline deterministic provider for testing and deterministic CSV data.
    """
    def __init__(self, data_source: List[Dict] = None):
        self._data = data_source or []
        
    @property
    def capabilities(self) -> ProviderCapabilities:
        return ProviderCapabilities(
            historical_positions=True,
            vessel_identity=True,
            vessel_presence=False,
            events=False,
            live_stream=False,
            bulk_download=True
        )

    @property
    def provider_name(self) -> str:
        return "OFFLINE_CSV"

    def load_from_csv(self, file_path: str):
        df = pd.read_csv(file_path)
        self._data = df.to_dict(orient='records')
        
    def get_historical_positions(self, min_lon, min_lat, max_lon, max_lat, start_time: datetime, end_time: datetime) -> List[Dict]:
        results = []
        for row in self._data:
            ts = row.get("timestamp")
            if isinstance(ts, str):
                ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            elif isinstance(ts, pd.Timestamp):
                ts = ts.to_pydatetime()
            
            lon = row.get("longitude")
            lat = row.get("latitude")
            
            if lon is None or lat is None or ts is None:
                continue
                
            if start_time <= ts <= end_time and min_lon <= lon <= max_lon and min_lat <= lat <= max_lat:
                # copy row and normalize timestamp to standard string or just keep dict raw for normalization layer
                new_row = row.copy()
                new_row['timestamp'] = ts
                results.append(new_row)
        return results

    def get_vessel_identity(self, mmsi: str) -> Optional[Dict]:
        # Attempt to extract static info from the first occurrence of MMSI in offline data
        for row in self._data:
            if str(row.get("mmsi")) == str(mmsi):
                return {
                    "mmsi": str(row.get("mmsi")),
                    "imo": str(row.get("imo")) if pd.notna(row.get("imo")) else None,
                    "ship_name": str(row.get("ship_name")) if pd.notna(row.get("ship_name")) else None,
                    "callsign": str(row.get("callsign")) if pd.notna(row.get("callsign")) else None,
                    "ship_type": str(row.get("ship_type")) if pd.notna(row.get("ship_type")) else None,
                    "length": float(row.get("length")) if pd.notna(row.get("length")) else None,
                    "width": float(row.get("width")) if pd.notna(row.get("width")) else None,
                }
        return None
