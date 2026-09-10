import math
from typing import List, Tuple
from pyproj import Transformer
from shapely.geometry import Point, LineString, Polygon, MultiPolygon
from src.ais.schema import VesselTrack, SpatialCompatibility
from src.drift.schema import GeoPolygon
from shapely.geometry import shape
from shapely.ops import transform

def _get_auto_local_epsg(lon: float, lat: float) -> int:
    """
    Calculates the appropriate UTM EPSG code for a given longitude and latitude.
    This provides an AOI-aware local projected CRS for accurate metric distances,
    avoiding the distortion of EPSG:3857 (Web Mercator).
    """
    utm_zone = math.floor((lon + 180) / 6) + 1
    if lat >= 0:
        return 32600 + utm_zone
    else:
        return 32700 + utm_zone

def _reproject_polygon(poly: Polygon | MultiPolygon, src_epsg: int, dst_epsg: int) -> Polygon | MultiPolygon:
    """Projects a Shapely polygon into a different coordinate system."""
    transformer = Transformer.from_crs(f"EPSG:{src_epsg}", f"EPSG:{dst_epsg}", always_xy=True)
    projected = transform(transformer.transform, poly)
    return projected

def _reproject_point(lon: float, lat: float, src_epsg: int, dst_epsg: int) -> Point:
    transformer = Transformer.from_crs(f"EPSG:{src_epsg}", f"EPSG:{dst_epsg}", always_xy=True)
    x, y = transformer.transform(lon, lat)
    return Point(x, y)

def calculate_spatial_compatibility(
    track: VesselTrack, 
    corridor: GeoPolygon,
    metric_crs_strategy: str = "auto_local"
) -> SpatialCompatibility:
    """
    Calculates spatial intersections and distances using a projected metric CRS.
    Supports auto_local to dynamically determine the best UTM zone.
    Public coordinates in the schema remain WGS84.
    """
    # 1. Convert GeoPolygon to Shapely object to find centroid
    corridor_shape = shape({"type": corridor.type, "coordinates": corridor.coordinates})
    
    if corridor_shape.is_empty:
        return SpatialCompatibility(min_distance_meters=float('inf'), corridor_intersections=0)
        
    centroid = corridor_shape.centroid
    
    # 2. Determine metric CRS
    if metric_crs_strategy == "auto_local":
        metric_crs_epsg = _get_auto_local_epsg(centroid.x, centroid.y)
    else:
        try:
            metric_crs_epsg = int(metric_crs_strategy)
        except ValueError:
            metric_crs_epsg = 3857 # Fallback
            
    # 3. Reproject corridor
    proj_corridor = _reproject_polygon(corridor_shape, 4326, metric_crs_epsg)
    
    min_dist_meters = float('inf')
    intersections = 0
    time_closest = None
    time_in_corridor = 0.0
    
    for segment in track.segments:
        if not segment.positions:
            continue
            
        # Reproject points to compute accurate track distances and intersections
        proj_points = []
        for p in segment.positions:
            pt = _reproject_point(p.longitude, p.latitude, 4326, metric_crs_epsg)
            proj_points.append(pt)
            
            dist = pt.distance(proj_corridor)
            if dist < min_dist_meters:
                min_dist_meters = dist
                time_closest = p.timestamp_utc
                
        # Check intersections by creating LineStrings for the segment path
        # Also compute time spent in corridor
        for i in range(1, len(proj_points)):
            p1 = proj_points[i-1]
            p2 = proj_points[i]
            if p1 == p2:
                continue
                
            line = LineString([p1, p2])
            
            if line.intersects(proj_corridor):
                intersections += 1
                # Estimate time spent based on proportion of line length in corridor
                intersection_geom = line.intersection(proj_corridor)
                if not intersection_geom.is_empty:
                    frac = intersection_geom.length / line.length if line.length > 0 else 0
                    t1 = segment.positions[i-1].timestamp_utc
                    t2 = segment.positions[i].timestamp_utc
                    dt = (t2 - t1).total_seconds()
                    time_in_corridor += dt * frac

    return SpatialCompatibility(
        min_distance_meters=min_dist_meters,
        corridor_intersections=intersections,
        time_of_closest_approach=time_closest,
        time_spent_in_corridor_seconds=time_in_corridor
    )
