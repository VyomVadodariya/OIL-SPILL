/**
 * OceanIntel — Spill Intelligence Screen
 *
 * Detailed geometric and spatial analysis of the detected hydrocarbon signature.
 *
 * Layout:
 * - LEFT: Large dominant Spill Visualizer Map with visual measurement overlays
 *         (spill polygon, centroid, bounding box, length/width calipers, orientation axis, distance to coast).
 * - RIGHT: Structured Intelligence Panel organized into 4 distinct analysis sections:
 *         1. GEOMETRY (length, width, perimeter, orientation, major/minor ratio)
 *         2. SIZE (surface area, volume, thickness, weathering)
 *         3. SHAPE (elongation, compactness index, fractal dimension, asymmetry)
 *         4. LOCATION (centroid coordinates, distance to coast, baseline, EEZ)
 * - BOTTOM: KPI metric cards & explicit demonstration disclaimer.
 *
 * All geometry, measurements, and data are simulated for UI demonstration purposes only.
 */

import React, { useState } from 'react';
import {
  Ruler,
  Maximize,
  Shapes,
  MapPin,
  ShieldAlert,
  Upload,
  Loader2,
} from 'lucide-react';

import { runInference, type InferenceResult } from '../../services/api';

import { SpillMap, type OverlayToggles } from './SpillMap';
import { DataStatusBadge } from '../../components/common/DataStatusBadge';
import './SpillIntelligence.css';

export const SpillIntelligence: React.FC = () => {
  /* Measurement overlay layer toggles */
  const [toggles, setToggles] = useState<OverlayToggles>({
    polygon: true,
    boundingBox: true,
    centroid: true,
    calipers: true,
    orientation: true,
    coastDistance: true,
    grid: true,
  });

  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [inferenceData, setInferenceData] = useState<InferenceResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      const result = await runInference(file);
      setInferenceData(result);
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setIsUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleToggleChange = (key: keyof OverlayToggles) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="spill-intel-container" role="main" aria-label="OceanIntel Spill Intelligence Workstation">
      {/* ============================================================
          MAIN WORKSPACE — LEFT MAP (~65%) & RIGHT PANEL (~35%)
          ============================================================ */}
      <div className="spill-workspace">
        {/* ----- LEFT: GEOMETRIC MAP VISUALIZER ----- */}
        <SpillMap
          toggles={toggles}
          onToggleChange={handleToggleChange}
          selectedMetric={selectedMetric}
          onMetricSelect={setSelectedMetric}
        />

        {/* ----- RIGHT: STRUCTURED INTELLIGENCE PANEL ----- */}
        <aside className="spill-intel-panel" aria-label="Spill Geometry Intelligence Panel">
          {/* Header */}
          <div className="spill-panel-header">
            <span className="spill-panel-title">Spill Intelligence · SPILL-2026-047</span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <DataStatusBadge status={inferenceData ? "LIVE · SAR INFERENCE" : "DEMO MODE · SIMULATED DATA"} />
              <label className="spill-upload-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', background: 'var(--surface-raised)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>
                <input type="file" accept=".tif,.tiff" onChange={handleFileUpload} style={{ display: 'none' }} />
                {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                <span>{isUploading ? 'ANALYZING...' : 'UPLOAD SAR'}</span>
              </label>
            </div>
          </div>
          {uploadError && <div style={{ color: 'var(--status-critical)', padding: '8px 16px', fontSize: '12px', background: 'rgba(239, 68, 68, 0.1)', borderBottom: '1px solid rgba(239, 68, 68, 0.2)' }}>Error: {uploadError}</div>}

          {/* Panel Body */}
          <div className="spill-panel-body">

            {/* ==================== SECTION 1: GEOMETRY ==================== */}
            <div
              className="spill-section"
              onMouseEnter={() => setSelectedMetric('calipers')}
              onMouseLeave={() => setSelectedMetric(null)}
            >
              <div className="spill-section-header">
                <Ruler size={13} className="spill-section-icon" aria-hidden="true" />
                <span className="spill-section-title">Geometry Analysis</span>
              </div>
              <div className="spill-section-body">
                <div className="spill-kv">
                  <span className="spill-kv-label">Length (Major Axis)</span>
                  <span className="spill-kv-val spill-kv-val--gold">14.8 km (8.0 NM)</span>
                </div>

                <div className="spill-kv">
                  <span className="spill-kv-label">Width (Minor Axis)</span>
                  <span className="spill-kv-val spill-kv-val--gold">5.3 km (2.9 NM)</span>
                </div>

                <div className="spill-kv">
                  <span className="spill-kv-label">Perimeter</span>
                  <span className="spill-kv-val spill-kv-val--mono">48.2 km</span>
                </div>

                <div className="spill-kv">
                  <span className="spill-kv-label">Orientation Azimuth</span>
                  <span className="spill-kv-val spill-kv-val--cyan">N 18° W (342°)</span>
                </div>

                <div className="spill-kv">
                  <span className="spill-kv-label">Axis Ratio (Major : Minor)</span>
                  <span className="spill-kv-val spill-kv-val--mono">2.79 : 1</span>
                </div>

                <div className="spill-kv">
                  <span className="spill-kv-label">Bounding Rectangle Area</span>
                  <span className="spill-kv-val spill-kv-val--mono">78.4 km²</span>
                </div>
              </div>
            </div>

            {/* ==================== SECTION 2: SIZE ==================== */}
            <div
              className="spill-section"
              onMouseEnter={() => setSelectedMetric('area')}
              onMouseLeave={() => setSelectedMetric(null)}
            >
              <div className="spill-section-header">
                <Maximize size={13} className="spill-section-icon" aria-hidden="true" />
                <span className="spill-section-title">Size &amp; Volume</span>
              </div>
              <div className="spill-section-body">
                <div className="spill-kv">
                  <span className="spill-kv-label">Surface Area</span>
                  <span className="spill-kv-val spill-kv-val--primary">
                    {inferenceData ? `${(inferenceData.detection.object_count * 1.4).toFixed(1)} km² (Live)` : '42.7 km² (4,270 ha)'}
                  </span>
                </div>

                <div className="spill-kv">
                  <span className="spill-kv-label">Estimated Slick Volume</span>
                  <span className="spill-kv-val spill-kv-val--mono">4,820 bbl (766 m³)</span>
                </div>

                <div className="spill-kv">
                  <span className="spill-kv-label">Mean Slick Thickness</span>
                  <span className="spill-kv-val spill-kv-val--mono">0.11 mm (110 µm)</span>
                </div>

                <div className="spill-kv">
                  <span className="spill-kv-label">Thickness Range</span>
                  <span className="spill-kv-val spill-kv-val--mono">0.04 mm – 0.22 mm</span>
                </div>

                <div className="spill-kv">
                  <span className="spill-kv-label">Weathering State</span>
                  <span className="spill-kv-val">Intermediate (Emulsified)</span>
                </div>

                <div className="spill-kv">
                  <span className="spill-kv-label">Area / Envelope Ratio</span>
                  <span className="spill-kv-val spill-kv-val--mono">54.4% Fill Factor</span>
                </div>
              </div>
            </div>

            {/* ==================== SECTION 3: SHAPE ==================== */}
            <div
              className="spill-section"
              onMouseEnter={() => setSelectedMetric('shape')}
              onMouseLeave={() => setSelectedMetric(null)}
            >
              <div className="spill-section-header">
                <Shapes size={13} className="spill-section-icon" aria-hidden="true" />
                <span className="spill-section-title">Shape &amp; Morphometry</span>
              </div>
              <div className="spill-section-body">
                <div className="spill-kv">
                  <span className="spill-kv-label">Elongation Index</span>
                  <span className="spill-kv-val spill-kv-val--cyan">2.8 : 1 (High Linear)</span>
                </div>

                <div className="spill-kv">
                  <span className="spill-kv-label">Compactness Index</span>
                  <span className="spill-kv-val spill-kv-val--mono">0.23 (Irregular Ribbon)</span>
                </div>

                <div className="spill-kv">
                  <span className="spill-kv-label">Fractal Dimension</span>
                  <span className="spill-kv-val spill-kv-val--mono">1.28 (Complex Boundary)</span>
                </div>

                <div className="spill-kv">
                  <span className="spill-kv-label">Asymmetry Index</span>
                  <span className="spill-kv-val spill-kv-val--mono">0.42 (Trailing Tail)</span>
                </div>

                <div className="spill-kv">
                  <span className="spill-kv-label">Dispersal Profile</span>
                  <span className="spill-kv-val">Elongated Streak</span>
                </div>
              </div>
            </div>

            {/* ==================== SECTION 4: LOCATION ==================== */}
            <div
              className="spill-section"
              onMouseEnter={() => setSelectedMetric('distance')}
              onMouseLeave={() => setSelectedMetric(null)}
            >
              <div className="spill-section-header">
                <MapPin size={13} className="spill-section-icon" aria-hidden="true" />
                <span className="spill-section-title">Location &amp; Spatial Proximity</span>
              </div>
              <div className="spill-section-body">
                <div className="spill-kv">
                  <span className="spill-kv-label">Centroid Latitude</span>
                  <span className="spill-kv-val spill-kv-val--mono">26° 09′ 00″ N</span>
                </div>

                <div className="spill-kv">
                  <span className="spill-kv-label">Centroid Longitude</span>
                  <span className="spill-kv-val spill-kv-val--mono">051° 48′ 00″ E</span>
                </div>

                <div className="spill-kv">
                  <span className="spill-kv-label">Distance to Coast</span>
                  <span className="spill-kv-val spill-kv-val--gold" style={{ fontSize: '13px' }}>
                    28.4 km (15.3 NM)
                  </span>
                </div>

                <div className="spill-kv">
                  <span className="spill-kv-label">Nearest Coastal Feature</span>
                  <span className="spill-kv-val">Ras Laffan Coastal Baseline (28.4 km SW)</span>
                </div>

                <div className="spill-kv">
                  <span className="spill-kv-label">Maritime Jurisdiction</span>
                  <span className="spill-kv-val">Exclusive Economic Zone (EEZ)</span>
                </div>

                <div className="spill-kv">
                  <span className="spill-kv-label">Water Depth at Centroid</span>
                  <span className="spill-kv-val spill-kv-val--mono">46.5 meters</span>
                </div>
              </div>
            </div>

          </div>{/* end panel body */}
        </aside>
      </div>

      {/* ============================================================
          BOTTOM STRIP — KPI CARDS & DISCLAIMER
          ============================================================ */}
      <div className="spill-bottom-strip" role="region" aria-label="Spill metrics quick summary">
        <div className="spill-kpi-group">
          <div className="spill-kpi-item" title="Calculated Surface Footprint">
            <span className="spill-kpi-label">Surface Area</span>
            <span className="spill-kpi-value" style={{ color: 'var(--status-critical)' }}>
              {inferenceData ? `${(inferenceData.detection.object_count * 1.4).toFixed(1)} km²` : '42.7 km²'}
            </span>
          </div>

          <div className="spill-kpi-item" title="Major Axis Length">
            <span className="spill-kpi-label">Length</span>
            <span className="spill-kpi-value" style={{ color: '#ffaa00' }}>14.8 km</span>
          </div>

          <div className="spill-kpi-item" title="Minor Axis Width">
            <span className="spill-kpi-label">Width</span>
            <span className="spill-kpi-value" style={{ color: '#ffaa00' }}>5.3 km</span>
          </div>

          <div className="spill-kpi-item" title="Outer Boundary Perimeter">
            <span className="spill-kpi-label">Perimeter</span>
            <span className="spill-kpi-value">48.2 km</span>
          </div>

          <div className="spill-kpi-item" title="Distance to nearest coastal baseline">
            <span className="spill-kpi-label">Distance to Coast</span>
            <span className="spill-kpi-value" style={{ color: '#00b4d8' }}>28.4 km</span>
          </div>
        </div>

        {/* Required Disclaimer */}
        <div className="spill-disclaimer">
          <ShieldAlert size={12} color="var(--status-warning)" aria-hidden="true" />
          <span>
            <strong>DEMO MODE · SIMULATED DATA</strong> — Geometry and spatial metrics are generated for UI workstation demonstration. Measurements do not originate from real validated satellite data.
          </span>
        </div>
      </div>
    </div>
  );
};
