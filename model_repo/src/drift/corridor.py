import numpy as np
from scipy.spatial import ConvexHull
from typing import List, Dict, Any
from shapely.geometry import Polygon
import shapely.ops as ops

from src.drift.schema import CorridorGeometry, GeoPolygon
from src.drift.particle import Particle

def generate_corridor_geometry(particles: List[Particle], density_quantile: float = 0.5) -> CorridorGeometry:
    """
    Generate the density and hull polygons from final particle positions.
    Density is calculated via a 2D histogram thresholding to isolate primary clusters.
    """
    valid = [p for p in particles if p.state != 'REJECTED']
    if len(valid) < 3:
        return CorridorGeometry(density_polygon=GeoPolygon(coordinates=[]), hull_polygon=None)
        
    lons = np.array([p.lon for p in valid])
    lats = np.array([p.lat for p in valid])
    
    # Optional Convex Hull
    points = np.column_stack((lons, lats))
    try:
        hull = ConvexHull(points)
        hull_coords = points[hull.vertices].tolist()
        hull_coords.append(hull_coords[0]) # Close the loop
        hull_polygon = GeoPolygon(coordinates=[hull_coords])
    except Exception:
        hull_polygon = None
        
    # Density Corridor (2D Histogram)
    try:
        bins = 20
        hist, xedges, yedges = np.histogram2d(lons, lats, bins=bins)
        
        # We want to keep bins that have density above the specified quantile of non-zero bins
        non_zero_bins = hist[hist > 0]
        if len(non_zero_bins) > 0:
            thresh = np.quantile(non_zero_bins, density_quantile)
            
            polys = []
            for i in range(bins):
                for j in range(bins):
                    if hist[i, j] >= thresh:
                        # Create a rectangle for this bin
                        x0, x1 = xedges[i], xedges[i+1]
                        y0, y1 = yedges[j], yedges[j+1]
                        poly = Polygon([(x0, y0), (x1, y0), (x1, y1), (x0, y1), (x0, y0)])
                        polys.append(poly)
            
            if polys:
                # Union them all together
                merged = ops.unary_union(polys)
                
                # Extract coordinates. merged can be Polygon or MultiPolygon
                density_coords = []
                if merged.geom_type == 'Polygon':
                    density_coords = [list(merged.exterior.coords)]
                elif merged.geom_type == 'MultiPolygon':
                    for geom in merged.geoms:
                        density_coords.append(list(geom.exterior.coords))
                
                density_polygon = GeoPolygon(coordinates=density_coords)
            else:
                density_polygon = GeoPolygon(coordinates=[])
        else:
            density_polygon = GeoPolygon(coordinates=[])
            
    except Exception:
        # Fallback empty if density generation fails
        density_polygon = GeoPolygon(coordinates=[])
        
    return CorridorGeometry(density_polygon=density_polygon, hull_polygon=hull_polygon)
