from typing import List, Dict
from datetime import datetime, timezone
import math
from src.ais.schema import AISPosition
from src.ais.errors import InvalidAISDataError

def normalize_ais_positions(raw_data: List[Dict], provider_name: str) -> List[AISPosition]:
    """
    Normalizes raw AIS dictionaries into strongly typed AISPosition objects.
    Enforces valid coordinates and UTC timestamps.
    Silently drops rows with completely missing critical fields, but rejects impossible coordinates.
    """
    normalized = []
    
    for row in raw_data:
        mmsi = row.get("mmsi")
        ts = row.get("timestamp")
        lon = row.get("longitude")
        lat = row.get("latitude")
        
        if mmsi is None or ts is None or lon is None or lat is None:
            continue
            
        mmsi_str = str(mmsi).strip()
        if not mmsi_str:
            continue
            
        # Validate coordinates
        try:
            lon = float(lon)
            lat = float(lat)
            if not (-180.0 <= lon <= 180.0) or not (-90.0 <= lat <= 90.0):
                # We do not silently discard invalid coordinates, we raise as per requirements
                # unless they are just slightly out of bounds due to float precision, but strict is better.
                raise InvalidAISDataError(f"Impossible coordinates for MMSI {mmsi_str}: ({lon}, {lat})")
        except ValueError:
            continue
            
        # Parse timestamp to UTC
        if isinstance(ts, str):
            try:
                # Basic ISO format parse. A robust implementation would use dateutil.
                ts_dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            except ValueError:
                continue
        elif isinstance(ts, datetime):
            ts_dt = ts
        else:
            continue
            
        if ts_dt.tzinfo is None:
            ts_dt = ts_dt.replace(tzinfo=timezone.utc)
        else:
            ts_dt = ts_dt.astimezone(timezone.utc)
            
        pos = AISPosition(
            mmsi=mmsi_str,
            timestamp_utc=ts_dt,
            longitude=lon,
            latitude=lat,
            sog=float(row["sog"]) if _is_valid_float(row.get("sog")) else None,
            cog=float(row["cog"]) if _is_valid_float(row.get("cog")) else None,
            heading=float(row["heading"]) if _is_valid_float(row.get("heading")) else None,
            navigation_status=str(row["navigation_status"]) if row.get("navigation_status") is not None else None,
            provider_source=provider_name
        )
        normalized.append(pos)
        
    # Deterministic chronological sort
    normalized.sort(key=lambda x: (x.mmsi, x.timestamp_utc))
    return normalized

def _is_valid_float(val) -> bool:
    if val is None:
        return False
    try:
        f = float(val)
        return not math.isnan(f)
    except (ValueError, TypeError):
        return False
