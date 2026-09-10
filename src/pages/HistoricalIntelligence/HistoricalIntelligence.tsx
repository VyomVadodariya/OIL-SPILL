/**
 * OceanIntel — Historical Intelligence Screen
 *
 * Map-first historical spill analysis, risk hotspot identification,
 * and temporal incident trend evaluation workstation.
 *
 * SCIENTIFIC INTEGRITY RULES:
 * - Status: HISTORICAL DEMONSTRATION MODE
 * - Shows: Historical Incidents, Risk Grid, Spatial Patterns, Temporal Patterns, Recurring Areas
 * - Does not invent fake real-world historic incident claims.
 */

import React, { useState } from 'react';
import { History, ShieldAlert, Layers, Activity, Calendar, Compass, Grid } from 'lucide-react';
import { HistoricalMap } from './HistoricalMap';
import { HISTORICAL_DEMO_DATA } from '../../data/demo/historical';
import { DataStatusBadge } from '../../components/common/DataStatusBadge';
import './HistoricalIntelligence.css';

export const HistoricalIntelligence: React.FC = () => {
  const [selectedIncId, setSelectedIncId] = useState<string>('h-01');
  const [showHotspots, setShowHotspots] = useState<boolean>(true);
  const [showDensityHeat, setShowDensityHeat] = useState<boolean>(true);

  const incidents = HISTORICAL_DEMO_DATA.incidents;
  const selectedInc = incidents.find((i) => i.id === selectedIncId) ?? incidents[0];

  return (
    <div className="hist-container" role="main" aria-label="OceanIntel Historical Intelligence Workstation">
      {/* Top Toolbar */}
      <div className="hist-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <History size={18} color="var(--accent-cyan)" />
          <div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              Historical Spill Incident Archive &amp; Spatial Risk Intelligence
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Longitudinal Spatial-Temporal Recurrence Patterns · SIH26143
            </div>
          </div>
          <button
            className={`btn btn-xs ${showHotspots ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ marginLeft: 8 }}
            onClick={() => setShowHotspots((h) => !h)}
          >
            <Layers size={11} style={{ marginRight: 4 }} />
            {showHotspots ? 'Hide Risk Grid' : 'Show Risk Grid'}
          </button>
          <button
            className={`btn btn-xs ${showDensityHeat ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ marginLeft: 8 }}
            onClick={() => setShowDensityHeat((d) => !d)}
          >
            <Activity size={11} style={{ marginRight: 4 }} />
            {showDensityHeat ? 'Hide Spatial Heatmap' : 'Show Spatial Heatmap'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <DataStatusBadge status="HISTORICAL DEMONSTRATION MODE" />
        </div>
      </div>

      {/* Mandatory Historical Demonstration Notice */}
      <div className="hist-demo-banner">
        <div className="hist-demo-title">
          <ShieldAlert size={13} style={{ color: 'var(--status-warning)' }} />
          <span>HISTORICAL DEMONSTRATION MODE · SIMULATED DATA · NOT HISTORICAL OPERATIONAL FEED</span>
        </div>
        <div className="hist-demo-desc">
          {HISTORICAL_DEMO_DATA.disclaimer}
        </div>
      </div>

      {/* Main Split */}
      <div className="hist-workspace">
        <HistoricalMap
          selectedIncidentId={selectedIncId}
          onSelectIncident={setSelectedIncId}
          showHotspots={showHotspots}
          showDensityHeat={showDensityHeat}
        />

        {/* Intelligence Panel */}
        <aside className="hist-intel-panel" aria-label="Historical Intelligence Panel">
          <div className="hist-panel-header">
            <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
              HISTORICAL RISK PATTERNS
            </span>
            <span className="badge badge-warning" style={{ fontSize: '9px' }}>DEMO ARCHIVE</span>
          </div>

          <div className="hist-panel-body">
            {/* Selected Incident Card */}
            <div className="hist-section">
              <div className="hist-section-header">
                <span className="hist-section-title">{selectedInc.name}</span>
                <span style={{ fontSize: '9px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                  {selectedInc.year} RECORD
                </span>
              </div>
              <div className="hist-section-body">
                <div className="hist-kv">
                  <span className="hist-kv-label">Spill Footprint Area</span>
                  <span className="hist-kv-val" style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                    {selectedInc.area}
                  </span>
                </div>
                <div className="hist-kv">
                  <span className="hist-kv-label">Estimated Volume</span>
                  <span className="hist-kv-val" style={{ fontFamily: 'var(--font-mono)' }}>
                    {selectedInc.volume}
                  </span>
                </div>
                <div className="hist-kv">
                  <span className="hist-kv-label">Investigation Correlation</span>
                  <span className="hist-kv-val">{selectedInc.attributed}</span>
                </div>
              </div>
            </div>

            {/* Spatial Patterns & Risk Grid */}
            <div className="hist-section">
              <div className="hist-section-header">
                <span className="hist-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Grid size={12} color="var(--accent-cyan)" />
                  Spatial Risk Grid (0.25° × 0.25°)
                </span>
              </div>
              <div className="hist-section-body">
                <div className="hist-kv">
                  <span className="hist-kv-label">High-Risk Grid Cell</span>
                  <span className="hist-kv-val" style={{ color: '#e8423a', fontFamily: 'var(--font-mono)' }}>
                    Sector PG-2651 (Central Gulf)
                  </span>
                </div>
                <div className="hist-kv">
                  <span className="hist-kv-label">Recurring Spills</span>
                  <span className="hist-kv-val" style={{ fontFamily: 'var(--font-mono)' }}>8 Incidents / 5 Years</span>
                </div>
                <div className="hist-kv">
                  <span className="hist-kv-label">Risk Density Category</span>
                  <span className="hist-kv-val" style={{ color: 'var(--status-critical)' }}>CRITICAL HOTSPOT</span>
                </div>
              </div>
            </div>

            {/* Temporal Patterns */}
            <div className="hist-section">
              <div className="hist-section-header">
                <span className="hist-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={12} color="var(--accent-cyan)" />
                  Temporal Patterns &amp; Seasonality
                </span>
              </div>
              <div className="hist-section-body">
                <div className="hist-kv">
                  <span className="hist-kv-label">Peak Incident Window</span>
                  <span className="hist-kv-val">Q3 Monsoon (Aug–Oct)</span>
                </div>
                <div className="hist-kv">
                  <span className="hist-kv-label">Shamal Wind Influence</span>
                  <span className="hist-kv-val">Accelerated NNW dispersion</span>
                </div>
                <div className="hist-kv">
                  <span className="hist-kv-label">Mean Attributed Time Window</span>
                  <span className="hist-kv-val" style={{ fontFamily: 'var(--font-mono)' }}>Nighttime Transit (22:00–04:00Z)</span>
                </div>
              </div>
            </div>

            {/* Recurring Areas */}
            <div className="hist-section">
              <div className="hist-section-header">
                <span className="hist-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Compass size={12} color="var(--accent-cyan)" />
                  Recurring Incident Corridors
                </span>
              </div>
              <div className="hist-section-body">
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ background: 'var(--surface-base)', padding: '6px 8px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-faint)' }}>
                    <strong style={{ color: '#e8423a' }}>1. Central Tanker Separation Scheme:</strong>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>
                      High tanker traffic bottleneck; 12 historical events recorded along transit lane.
                    </div>
                  </div>
                  <div style={{ background: 'var(--surface-base)', padding: '6px 8px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-faint)' }}>
                    <strong style={{ color: '#e5a020' }}>2. Ras Laffan Offshore Anchorage:</strong>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>
                      Deepwater holding area; 7 historical events correlated with ballast discharge.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom Disclaimer */}
      <div className="hist-bottom-strip">
        <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ShieldAlert size={12} color="var(--status-warning)" />
          <span>
            <strong>HISTORICAL DEMONSTRATION MODE</strong> — Historical incident records, spatial recurrence grids, and temporal patterns are simulated for UI workstation demonstration.
          </span>
        </div>
      </div>
    </div>
  );
};
