/**
 * OceanIntel — Real Geographic Basemap Component (MapLibre GL JS)
 *
 * Replaces fixed SVG background with an interactive vector-tile basemap.
 * Dynamically renders GeoJSON layers for oil spills, drift corridors,
 * AIS tracks, and vessel markers in real-world geographic coordinates (lon, lat).
 *
 * Basemap Style: OpenFreeMap Liberty (High Visibility Maritime Aesthetic)
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapControls, type BasemapTheme } from './MapControls';
import {
  DEMO_SPILL_GEOJSON,
  DEMO_DRIFT_GEOJSON,
  DEMO_LOOKALIKE_GEOJSON,
  DEMO_EXCLUSION_GEOJSON,
  buildAisTrackGeoJSON,
} from '../../utils/geoAdapter';
import './MapLibreMap.css';

export interface MapVessel {
  id: string;
  name: string;
  status: 'highest-ranked' | 'under-review' | 'monitored' | 'cleared';
  lat: number;
  lon: number;
  heading: number;
  speed: number;
  aisGap: boolean;
  aisGapDuration?: string;
  mmsi: string;
  trackPath: string;
  investigationScore?: number;
}

interface MapLibreMapProps {
  vessels: MapVessel[];
  selectedId: string | null;
  activeLayers: Set<string>;
  onVesselClick: (id: string) => void;
  onVesselEnter: (id: string, clientX: number, clientY: number) => void;
  onVesselLeave: () => void;
}

const BASEMAP_STYLES: Record<BasemapTheme, string> = {
  liberty: 'https://tiles.openfreemap.org/styles/liberty',
  bright: 'https://tiles.openfreemap.org/styles/bright',
  dark: 'https://tiles.openfreemap.org/styles/dark',
};

const DEFAULT_CENTER: [number, number] = [51.80, 26.15]; // Persian Gulf Offshore [lon, lat]
const DEFAULT_ZOOM = 8.5;

const setupGeoJsonLayers = (map: maplibregl.Map, vesselData: MapVessel[]) => {
  if (!map.getSource('spill-src')) {
    map.addSource('spill-src', { type: 'geojson', data: DEMO_SPILL_GEOJSON });
  }
  if (!map.getSource('drift-src')) {
    map.addSource('drift-src', { type: 'geojson', data: DEMO_DRIFT_GEOJSON });
  }
  if (!map.getSource('lookalike-src')) {
    map.addSource('lookalike-src', { type: 'geojson', data: DEMO_LOOKALIKE_GEOJSON });
  }
  if (!map.getSource('exclusion-src')) {
    map.addSource('exclusion-src', { type: 'geojson', data: DEMO_EXCLUSION_GEOJSON });
  }
  if (!map.getSource('ais-tracks-src')) {
    map.addSource('ais-tracks-src', { type: 'geojson', data: buildAisTrackGeoJSON(vesselData) });
  }

  if (!map.getLayer('exclusion-layer')) {
    map.addLayer({
      id: 'exclusion-layer',
      type: 'line',
      source: 'exclusion-src',
      paint: {
        'line-color': '#e5a020',
        'line-width': 1.5,
        'line-dasharray': [6, 4],
        'line-opacity': 0.65,
      },
    });
  }

  if (!map.getLayer('lookalike-layer')) {
    map.addLayer({
      id: 'lookalike-layer',
      type: 'fill',
      source: 'lookalike-src',
      paint: {
        'fill-color': '#e5a020',
        'fill-opacity': 0.20,
      },
    });
  }
  if (!map.getLayer('lookalike-outline-layer')) {
    map.addLayer({
      id: 'lookalike-outline-layer',
      type: 'line',
      source: 'lookalike-src',
      paint: {
        'line-color': '#e5a020',
        'line-width': 1.2,
        'line-opacity': 0.5,
      },
    });
  }

  if (!map.getLayer('drift-layer')) {
    map.addLayer({
      id: 'drift-layer',
      type: 'fill',
      source: 'drift-src',
      paint: {
        'fill-color': [
          'match',
          ['get', 'type'],
          'backward', 'rgba(245, 158, 11, 0.28)',
          'forward', 'rgba(6, 182, 212, 0.28)',
          'rgba(6, 182, 212, 0.28)',
        ],
      },
    });
  }
  if (!map.getLayer('drift-outline-layer')) {
    map.addLayer({
      id: 'drift-outline-layer',
      type: 'line',
      source: 'drift-src',
      paint: {
        'line-color': [
          'match',
          ['get', 'type'],
          'backward', '#f59e0b',
          'forward', '#06b6d4',
          '#06b6d4',
        ],
        'line-width': 2,
        'line-dasharray': [5, 3],
      },
    });
  }

  if (!map.getLayer('spill-glow-layer')) {
    map.addLayer({
      id: 'spill-glow-layer',
      type: 'line',
      source: 'spill-src',
      paint: {
        'line-color': '#fb923c',
        'line-width': 8,
        'line-opacity': 0.45,
        'line-blur': 4,
      },
    });
  }

  if (!map.getLayer('spill-layer')) {
    map.addLayer({
      id: 'spill-layer',
      type: 'fill',
      source: 'spill-src',
      paint: {
        'fill-color': 'rgba(249, 115, 22, 0.65)',
        'fill-outline-color': '#ea580c',
      },
    });
  }

  if (!map.getLayer('spill-outline-layer')) {
    map.addLayer({
      id: 'spill-outline-layer',
      type: 'line',
      source: 'spill-src',
      paint: {
        'line-color': '#ea580c',
        'line-width': 3,
        'line-opacity': 0.95,
      },
    });
  }

  if (!map.getLayer('ais-tracks-layer')) {
    map.addLayer({
      id: 'ais-tracks-layer',
      type: 'line',
      source: 'ais-tracks-src',
      paint: {
        'line-color': '#3b82f6',
        'line-width': 2,
        'line-opacity': 0.85,
        'line-dasharray': [4, 3],
      },
    });
  }
};

export const MapLibreMap: React.FC<MapLibreMapProps> = ({
  vessels,
  selectedId,
  activeLayers,
  onVesselClick,
  onVesselEnter,
  onVesselLeave,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const vesselsRef = useRef<MapVessel[]>(vessels);
  useEffect(() => {
    vesselsRef.current = vessels;
  }, [vessels]);

  const [zoomLevel, setZoomLevel] = useState<number>(DEFAULT_ZOOM);
  const [currentTheme, setCurrentTheme] = useState<BasemapTheme>('liberty');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  /* Initialize MapLibre GL JS Map */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP_STYLES.liberty,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      minZoom: 4,
      maxZoom: 16,
      attributionControl: false, // Customized attribution added manually below
    });

    // Add Attribution Control
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: 'OpenFreeMap © <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
      }),
      'bottom-right'
    );

    map.on('load', () => {
      setIsLoaded(true);
      setupGeoJsonLayers(map, vesselsRef.current);
    });

    map.on('zoom', () => {
      setZoomLevel(map.getZoom());
    });

    // ResizeObserver to trigger map.resize() on container size changes
    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserver.observe(containerRef.current);

    mapRef.current = map;

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  /* Handle Dynamic Theme Change */
  const handleThemeChange = useCallback((newTheme: BasemapTheme) => {
    setCurrentTheme(newTheme);
    const map = mapRef.current;
    if (!map) return;

    const onStyleData = () => {
      setupGeoJsonLayers(map, vessels);
      const setVisibility = (layerId: string, visible: boolean) => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
        }
      };
      setVisibility('spill-glow-layer', activeLayers.has('spill'));
      setVisibility('spill-layer', activeLayers.has('spill'));
      setVisibility('spill-outline-layer', activeLayers.has('spill'));
      setVisibility('drift-layer', activeLayers.has('drift'));
      setVisibility('drift-outline-layer', activeLayers.has('drift'));
      setVisibility('lookalike-layer', activeLayers.has('lookalike'));
      setVisibility('lookalike-outline-layer', activeLayers.has('lookalike'));
      setVisibility('exclusion-layer', activeLayers.has('exclusion'));
      setVisibility('ais-tracks-layer', activeLayers.has('tracks'));
    };

    map.once('style.load', onStyleData);
    map.setStyle(BASEMAP_STYLES[newTheme]);
  }, [vessels, activeLayers]);

  /* Update Layer Visibility based on activeLayers Set */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;

    const setVisibility = (layerId: string, visible: boolean) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
      }
    };

    setVisibility('spill-glow-layer', activeLayers.has('spill'));
    setVisibility('spill-layer', activeLayers.has('spill'));
    setVisibility('spill-outline-layer', activeLayers.has('spill'));
    setVisibility('drift-layer', activeLayers.has('drift'));
    setVisibility('drift-outline-layer', activeLayers.has('drift'));
    setVisibility('lookalike-layer', activeLayers.has('lookalike'));
    setVisibility('lookalike-outline-layer', activeLayers.has('lookalike'));
    setVisibility('exclusion-layer', activeLayers.has('exclusion'));
    setVisibility('ais-tracks-layer', activeLayers.has('tracks'));

    /* Update AIS track GeoJSON data if vessels update */
    const aisSource = map.getSource('ais-tracks-src') as maplibregl.GeoJSONSource | undefined;
    if (aisSource) {
      aisSource.setData(buildAisTrackGeoJSON(vessels));
    }
  }, [activeLayers, vessels, isLoaded]);

  /* Render & Update HTML Vessel Markers */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;

    // Remove stale markers
    const currentIds = new Set(vessels.map(v => v.id));
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add or update markers
    vessels.forEach(vessel => {
      const isSelected = vessel.id === selectedId;
      const isVisible = activeLayers.has('vessels');

      let marker = markersRef.current.get(vessel.id);

      if (!marker) {
        const el = document.createElement('div');
        el.className = 'ml-vessel-marker-container';

        marker = new maplibregl.Marker({ element: el })
          .setLngLat([vessel.lon, vessel.lat])
          .addTo(map);

        markersRef.current.set(vessel.id, marker);
      } else {
        marker.setLngLat([vessel.lon, vessel.lat]);
      }

      // Update HTML content
      const el = marker.getElement();
      el.style.display = isVisible ? 'block' : 'none';

      const color =
        vessel.status === 'highest-ranked' || vessel.status === 'under-review' ? '#e8423a' :
        vessel.status === 'monitored' ? '#e5a020' : '#2ece7a';

      el.innerHTML = `
        <div class="ml-vessel-marker ${isSelected ? 'ml-vessel-marker--selected' : ''}" style="--v-color: ${color}; transform: rotate(${vessel.heading}deg)">
          ${vessel.status === 'highest-ranked' || vessel.status === 'under-review' ? `<div class="ml-vessel-pulse"></div>` : ''}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">
            <polygon points="12 2 19 21 12 17 5 21 12 2" fill="${color}" fill-opacity="0.35"/>
          </svg>
        </div>
        <div class="ml-vessel-label ${isSelected ? 'ml-vessel-label--selected' : ''}" style="color: ${color}">
          ${vessel.name}
          ${vessel.aisGap ? `<span class="ml-ais-gap-dot" title="AIS Gap Detected">!</span>` : ''}
        </div>
      `;

      // Event listeners
      el.onclick = (e: MouseEvent) => {
        e.stopPropagation();
        onVesselClick(vessel.id);
      };

      el.onmouseenter = (e: MouseEvent) => {
        onVesselEnter(vessel.id, e.clientX, e.clientY);
      };

      el.onmouseleave = () => {
        onVesselLeave();
      };
    });
  }, [vessels, selectedId, activeLayers, isLoaded, onVesselClick, onVesselEnter, onVesselLeave]);

  /* Map Control Handlers */
  const handleZoomIn = useCallback(() => {
    mapRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    mapRef.current?.zoomOut();
  }, []);

  const handleReset = useCallback(() => {
    mapRef.current?.flyTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, pitch: 0, bearing: 0 });
  }, []);

  return (
    <div className="ml-map-wrapper">
      <MapControls
        zoom={Number((zoomLevel / DEFAULT_ZOOM).toFixed(2))}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
      />
      <div ref={containerRef} className="ml-map-container" />
    </div>
  );
};
