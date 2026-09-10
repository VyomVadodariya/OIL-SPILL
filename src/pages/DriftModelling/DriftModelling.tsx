/**
 * OceanIntel — Drift Modelling Screen
 *
 * Oceanographic particle drift simulation workstation:
 * - BACKWARD DRIFT (Hindcast particle origin reconstruction)
 * - FORWARD DRIFT (Forecast 72h trajectory outlook & coastal exposure)
 *
 * SCIENTIFIC INTEGRITY RULES:
 * - Planned Engine: OpenDrift + CMEMS
 * - Particle Simulation: Demonstration only (Do not claim live CMEMS results)
 * - Notice: MODELED TRAJECTORY — SUBJECT TO ENVIRONMENTAL AND MODEL UNCERTAINTY
 * - Playback speed support: 1×, 2×, 5×
 */

import React, { useState, useEffect } from 'react';
import {
  Waves,
  Wind,
  Play,
  Pause,
  RotateCcw,
  ShieldAlert,
  Sliders,
  Gauge,
} from 'lucide-react';
import { DriftMap, type DriftViewMode } from './DriftMap';
import { DataStatusBadge } from '../../components/common/DataStatusBadge';
import './DriftModelling.css';

export const DriftModelling: React.FC = () => {
  const [mode, setMode] = useState<DriftViewMode>('both');
  const [timeOffsetHours, setTimeOffsetHours] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 5>(1);

  // Overlay layer toggles
  const [showCurrents, setShowCurrents] = useState<boolean>(true);
  const [showWind, setShowWind] = useState<boolean>(true);
  const [showParticles, setShowParticles] = useState<boolean>(true);

  /* Animation playback loop with speed support: 1×, 2×, 5× */
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isPlaying) {
      const intervalMs = playbackSpeed === 5 ? 70 : playbackSpeed === 2 ? 150 : 320;
      timer = setInterval(() => {
        setTimeOffsetHours((prev) => {
          if (prev >= 72) return -12;
          return prev + 2;
        });
      }, intervalMs);
    }
    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed]);

  return (
    <div className="drift-container" role="main" aria-label="OceanIntel Drift Modelling Workstation">
      {/* Top Toolbar & Playback Scrubber */}
      <div className="drift-toolbar">
        <div className="drift-toolbar-left">
          {/* Mode Switcher */}
          <div className="drift-mode-tabs" role="tablist" aria-label="Drift Mode Selection">
            <button
              id="drift-mode-bwd"
              className={`drift-mode-btn ${mode === 'backward' ? 'drift-mode-btn--active-bwd' : ''}`}
              onClick={() => setMode('backward')}
              role="tab"
              aria-selected={mode === 'backward'}
            >
              Backward Drift (Hindcast)
            </button>
            <button
              id="drift-mode-fwd"
              className={`drift-mode-btn ${mode === 'forward' ? 'drift-mode-btn--active-fwd' : ''}`}
              onClick={() => setMode('forward')}
              role="tab"
              aria-selected={mode === 'forward'}
            >
              Forward Drift (Forecast)
            </button>
            <button
              id="drift-mode-both"
              className={`drift-mode-btn ${mode === 'both' ? 'drift-mode-btn--active-both' : ''}`}
              onClick={() => setMode('both')}
              role="tab"
              aria-selected={mode === 'both'}
            >
              Dual Trajectory View
            </button>
          </div>

          {/* Time Scrubber */}
          <div className="drift-scrubber-group" role="group" aria-label="Simulation Time Control">
            <button
              className="drift-play-btn"
              onClick={() => setIsPlaying((p) => !p)}
              aria-label={isPlaying ? 'Pause simulation' : 'Play simulation'}
              title={isPlaying ? 'Pause simulation' : 'Play simulation'}
            >
              {isPlaying ? <Pause size={13} /> : <Play size={13} style={{ marginLeft: 2 }} />}
            </button>

            <button
              className="btn btn-ghost btn-xs btn-icon"
              onClick={() => {
                setTimeOffsetHours(0);
                setIsPlaying(false);
              }}
              title="Reset to T0 (Detection Timestamp)"
              aria-label="Reset Time"
            >
              <RotateCcw size={12} />
            </button>

            {/* Playback Speed Controls: 1x, 2x, 5x */}
            <div style={{ display: 'flex', gap: 2, background: 'var(--surface-overlay)', padding: 2, borderRadius: 'var(--radius-xs)', alignItems: 'center' }}>
              <Gauge size={11} style={{ color: 'var(--text-muted)', marginLeft: 4, marginRight: 2 }} />
              <button
                className={`btn btn-xs ${playbackSpeed === 1 ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '1px 6px', fontSize: '10px' }}
                onClick={() => setPlaybackSpeed(1)}
              >
                1×
              </button>
              <button
                className={`btn btn-xs ${playbackSpeed === 2 ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '1px 6px', fontSize: '10px' }}
                onClick={() => setPlaybackSpeed(2)}
              >
                2×
              </button>
              <button
                className={`btn btn-xs ${playbackSpeed === 5 ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '1px 6px', fontSize: '10px' }}
                onClick={() => setPlaybackSpeed(5)}
              >
                5×
              </button>
            </div>

            <input
              type="range"
              min="-12"
              max="72"
              step="1"
              value={timeOffsetHours}
              onChange={(e) => {
                setTimeOffsetHours(Number(e.target.value));
                setIsPlaying(false);
              }}
              className="drift-scrubber-slider"
              aria-label="Simulation Time Offset Slider (Hours)"
            />

            <span className="drift-scrubber-val">
              {timeOffsetHours === 0 ? 'T0 (Now)' : timeOffsetHours > 0 ? `T+${timeOffsetHours}h` : `T${timeOffsetHours}h`}
            </span>
          </div>
        </div>

        {/* Status Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <DataStatusBadge status="MODEL PREVIEW" />
          <DataStatusBadge status="DEMO MODE · SIMULATED DATA" />
        </div>
      </div>

      {/* Main Split Workspace */}
      <div className="drift-workspace">
        {/* Left: Drift Map Viewer */}
        <DriftMap
          mode={mode}
          timeOffsetHours={timeOffsetHours}
          showCurrentVectors={showCurrents}
          showWindVectors={showWind}
          showParticles={showParticles}
        />

        {/* Right: Drift Intelligence Panel */}
        <aside className="drift-intel-panel" aria-label="Drift Intelligence Control Panel">
          <div className="drift-panel-header">
            <span className="drift-panel-title">DRIFT MODELLING INTELLIGENCE</span>
            <span className="badge badge-warning" style={{ fontSize: '9px' }}>DEMO SIMULATION</span>
          </div>

          <div className="drift-panel-body">
            {/* Scientific Modeling Notice */}
            <div
              style={{
                background: 'rgba(229,160,32,0.08)',
                border: '1px solid rgba(229,160,32,0.25)',
                borderRadius: 'var(--radius-xs)',
                padding: '8px 10px',
                fontSize: '11px',
                lineHeight: 1.45,
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--status-warning)', marginBottom: 2 }}>
                MODELED TRAJECTORY
              </div>
              SUBJECT TO ENVIRONMENTAL AND MODEL UNCERTAINTY.
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 4 }}>
                Planned Engine: <strong>OpenDrift + CMEMS</strong>
                <br />
                Particle Simulation: <strong>Demonstration only</strong>
              </div>
            </div>

            {/* SECTION 1: Backward Drift Hindcast Analysis */}
            <div className="drift-section">
              <div className="drift-section-header">
                <span className="drift-section-title">
                  <RotateCcw size={13} color="#e5a020" aria-hidden="true" />
                  Backward Drift (Hindcast Origin)
                </span>
                <span style={{ fontSize: '10px', color: '#e5a020', fontWeight: 700 }}>HINDCAST</span>
              </div>
              <div className="drift-section-body">
                <div className="drift-kv">
                  <span className="drift-kv-label">Reconstructed Release Window</span>
                  <span className="drift-kv-val drift-kv-val--gold">2026-09-07 02:00–04:00Z</span>
                </div>

                <div className="drift-kv">
                  <span className="drift-kv-label">Source Corridor Area</span>
                  <span className="drift-kv-val drift-kv-val--mono">28.0 km²</span>
                </div>

                <div className="drift-kv">
                  <span className="drift-kv-label">Estimated Release Centroid</span>
                  <span className="drift-kv-val drift-kv-val--mono">26°11′N · 051°45′E</span>
                </div>

                <div className="drift-kv">
                  <span className="drift-kv-label">Backward Particle Compatibility</span>
                  <span className="drift-kv-val drift-kv-val--cyan">82/100 Index</span>
                </div>

                <div className="drift-kv">
                  <span className="drift-kv-label">Hindcast Duration</span>
                  <span className="drift-kv-val drift-kv-val--mono">4.0 hours</span>
                </div>
              </div>
            </div>

            {/* SECTION 2: Forward Drift Forecast Outlook */}
            <div className="drift-section">
              <div className="drift-section-header">
                <span className="drift-section-title">
                  <Waves size={13} color="var(--text-cyan)" aria-hidden="true" />
                  Forward Drift (72h Forecast Outlook)
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-cyan)', fontWeight: 700 }}>FORECAST</span>
              </div>
              <div className="drift-section-body">
                <div className="drift-kv">
                  <span className="drift-kv-label">Potential Coastal Contact ETA (Modelled)</span>
                  <span className="drift-kv-val drift-kv-val--red">T+18h ± 3h</span>
                </div>

                <div className="drift-kv">
                  <span className="drift-kv-label">Potentially Exposed Coastline</span>
                  <span className="drift-kv-val">Ras Laffan Coastal &amp; Coral Reserve (Qatar)</span>
                </div>

                <div className="drift-kv">
                  <span className="drift-kv-label">Modelled Coastal Exposure Risk</span>
                  <span className="drift-kv-val drift-kv-val--red">84/100 Index</span>
                </div>

                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--status-warning)',
                    background: 'rgba(245,158,11,0.1)',
                    border: '1px solid rgba(245,158,11,0.25)',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-xs)',
                    marginTop: 4,
                  }}
                >
                  Modelled trajectory indicates potential exposure, subject to uncertainty.
                </div>

                <div className="drift-kv">
                  <span className="drift-kv-label">Forecast Speed</span>
                  <span className="drift-kv-val drift-kv-val--mono">1.6 knots (NNW)</span>
                </div>

                <div className="drift-kv">
                  <span className="drift-kv-label">72h Dispersal Footprint</span>
                  <span className="drift-kv-val drift-kv-val--mono">145.0 km²</span>
                </div>
              </div>
            </div>

            {/* SECTION 3: Hydrodynamic Forcing Parameters */}
            <div className="drift-section">
              <div className="drift-section-header">
                <span className="drift-section-title">
                  <Wind size={13} color="var(--text-cyan)" aria-hidden="true" />
                  Hydrodynamic Forcing Parameters (Simulated)
                </span>
              </div>
              <div className="drift-section-body">
                <div className="drift-kv">
                  <span className="drift-kv-label">CMEMS Surface Current</span>
                  <span className="drift-kv-val drift-kv-val--cyan">1.4 kn @ 148° (SE)</span>
                </div>

                <div className="drift-kv">
                  <span className="drift-kv-label">ECMWF ERA5 Wind</span>
                  <span className="drift-kv-val drift-kv-val--gold">14.2 kn @ 328° (NNW)</span>
                </div>

                <div className="drift-kv">
                  <span className="drift-kv-label">Stokes Wave Drift</span>
                  <span className="drift-kv-val drift-kv-val--mono">0.3 kn @ 335°</span>
                </div>

                <div className="drift-kv">
                  <span className="drift-kv-label">Sea Surface Temperature</span>
                  <span className="drift-kv-val drift-kv-val--mono">29.4 °C</span>
                </div>

                <div className="drift-kv">
                  <span className="drift-kv-label">Water Salinity</span>
                  <span className="drift-kv-val drift-kv-val--mono">39.2 PSU</span>
                </div>
              </div>
            </div>

            {/* SECTION 4: Model Configuration & Layer Toggles */}
            <div className="drift-section">
              <div className="drift-section-header">
                <span className="drift-section-title">
                  <Sliders size={13} color="var(--text-cyan)" aria-hidden="true" />
                  Simulation Settings &amp; Layers
                </span>
              </div>
              <div className="drift-section-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={showCurrents} onChange={(e) => setShowCurrents(e.target.checked)} />
                    Show Surface Current Vectors (CMEMS)
                  </label>
                  <label style={{ fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={showWind} onChange={(e) => setShowWind(e.target.checked)} />
                    Show ERA5 Wind Forcing Vectors
                  </label>
                  <label style={{ fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={showParticles} onChange={(e) => setShowParticles(e.target.checked)} />
                    Show Monte Carlo Drift Particles (N=5,000)
                  </label>
                </div>

                <div className="drift-kv" style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border-faint)' }}>
                  <span className="drift-kv-label">Planned Engine</span>
                  <span className="drift-kv-val" style={{ color: 'var(--accent-cyan)' }}>OpenDrift + CMEMS (Planned)</span>
                </div>
                <div className="drift-kv">
                  <span className="drift-kv-label">Particle Simulation</span>
                  <span className="drift-kv-val" style={{ color: 'var(--status-warning)' }}>Demonstration only</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom Status Strip */}
      <div className="drift-bottom-strip" role="region" aria-label="Workstation disclaimer">
        <div className="drift-disclaimer">
          <ShieldAlert size={12} color="var(--status-warning)" aria-hidden="true" />
          <span>
            <strong>DRIFT MODELLING · DEMO MODE · SIMULATED DATA</strong> — Planned Engine: OpenDrift + CMEMS. Particle simulation is demonstration only; operational deployment requires live Copernicus Marine telemetry.
          </span>
        </div>
      </div>
    </div>
  );
};
