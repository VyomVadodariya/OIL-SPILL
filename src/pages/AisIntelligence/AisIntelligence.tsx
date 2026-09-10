/**
 * OceanIntel — AIS Intelligence Screen
 *
 * Satellite & Terrestrial AIS correlated vessel tracking workstation.
 * Language rules strictly enforced:
 * - Uses "Investigation Candidate", "Under Review", "Monitored", "Cleared".
 * - Mandatory phrasing: "AIS observation gap detected (Duration: 4h 08m)".
 * - Uses proper empty state: "NO AIS OBSERVATION".
 * - All data is DEMO MODE · SIMULATED DATA.
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  Layers,
  Radio,
  AlertTriangle,
  Clock,
  Navigation,
  ShieldAlert,
  Ship,
} from 'lucide-react';

import { AisMap, type AisVessel } from './AisMap';
import { DEMO_CANDIDATES } from '../../data/demo/incident';
import { DataStatusBadge } from '../../components/common/DataStatusBadge';
import './AisIntelligence.css';

/* ============================================================
   CANONICAL AIS CANDIDATES (Imported from DEMO_INCIDENT)
   ============================================================ */

const SIMULATED_VESSELS: AisVessel[] = DEMO_CANDIDATES as unknown as AisVessel[];

export const AisIntelligence: React.FC = () => {
  const [selectedVesselId, setSelectedVesselId] = useState<string>('harbor-pioneer');
  const [hoveredVesselId, setHoveredVesselId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'under_review' | 'monitored' | 'cleared' | 'gap'>('all');

  // Layer toggles
  const [showHistoricTracks, setShowHistoricTracks] = useState<boolean>(true);
  const [showSourceCorridor, setShowSourceCorridor] = useState<boolean>(true);
  const [showSpillPolygon, setShowSpillPolygon] = useState<boolean>(true);

  /* Filtered vessel list */
  const filteredVessels = useMemo(() => {
    return SIMULATED_VESSELS.filter((v) => {
      const matchesSearch =
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.mmsi.includes(searchQuery) ||
        v.type.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'all') return true;
      if (statusFilter === 'gap') return v.aisGap;
      if (statusFilter === 'under_review') return v.status === 'highest-ranked' || v.status === 'under-review';
      return v.status === statusFilter;
    });
  }, [searchQuery, statusFilter]);

  const selectedVessel = SIMULATED_VESSELS.find((v) => v.id === selectedVesselId) ?? SIMULATED_VESSELS[0];

  return (
    <div className="ais-intel-container" role="main" aria-label="OceanIntel AIS Intelligence Workstation">
      {/* Top Search & Filter Toolbar */}
      <div className="ais-filter-bar">
        <div className="ais-filter-left">
          {/* Search box */}
          <div className="ais-search-wrapper">
            <Search size={13} className="ais-search-icon" aria-hidden="true" />
            <input
              type="text"
              className="ais-search-input"
              placeholder="Search by vessel name, MMSI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter status buttons — strictly using non-accusatory terminology */}
          <div className="ais-filter-btn-group" role="group" aria-label="Filter vessels by status">
            <button
              className={`ais-filter-btn ${statusFilter === 'all' ? 'ais-filter-btn--active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All ({SIMULATED_VESSELS.length})
            </button>
            <button
              className={`ais-filter-btn ${statusFilter === 'under_review' ? 'ais-filter-btn--active' : ''}`}
              onClick={() => setStatusFilter('under_review')}
            >
              Under Review ({SIMULATED_VESSELS.filter((v) => v.status === 'highest-ranked' || v.status === 'under-review').length})
            </button>
            <button
              className={`ais-filter-btn ${statusFilter === 'gap' ? 'ais-filter-btn--active' : ''}`}
              onClick={() => setStatusFilter('gap')}
            >
              AIS Gap ({SIMULATED_VESSELS.filter((v) => v.aisGap).length})
            </button>
            <button
              className={`ais-filter-btn ${statusFilter === 'monitored' ? 'ais-filter-btn--active' : ''}`}
              onClick={() => setStatusFilter('monitored')}
            >
              Monitored ({SIMULATED_VESSELS.filter((v) => v.status === 'monitored').length})
            </button>
            <button
              className={`ais-filter-btn ${statusFilter === 'cleared' ? 'ais-filter-btn--active' : ''}`}
              onClick={() => setStatusFilter('cleared')}
            >
              Cleared ({SIMULATED_VESSELS.filter((v) => v.status === 'cleared').length})
            </button>
          </div>
        </div>

        {/* Layer Toggles & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="ais-layer-toggles">
            <button
              className={`ais-toggle-chip ${showHistoricTracks ? 'ais-toggle-chip--active' : ''}`}
              onClick={() => setShowHistoricTracks((h) => !h)}
            >
              <Navigation size={11} />
              Historic Tracks
            </button>
            <button
              className={`ais-toggle-chip ${showSourceCorridor ? 'ais-toggle-chip--active' : ''}`}
              onClick={() => setShowSourceCorridor((c) => !c)}
            >
              <Layers size={11} />
              Source Corridor
            </button>
            <button
              className={`ais-toggle-chip ${showSpillPolygon ? 'ais-toggle-chip--active' : ''}`}
              onClick={() => setShowSpillPolygon((s) => !s)}
            >
              <Radio size={11} />
              Spill Area
            </button>
          </div>

          <DataStatusBadge status="DEMO MODE · SIMULATED DATA" />
        </div>
      </div>

      {/* Main Workspace — Map (Left ~68%) & Vessel Panel (Right ~32%) */}
      <div className="ais-workspace">
        {/* Map Viewer or Empty State */}
        <div style={{ flex: 1, position: 'relative', height: '100%' }}>
          <AisMap
            vessels={filteredVessels}
            selectedVesselId={selectedVesselId}
            onSelectVessel={setSelectedVesselId}
            showHistoricTracks={showHistoricTracks}
            showSourceCorridor={showSourceCorridor}
            showSpillPolygon={showSpillPolygon}
            hoveredVesselId={hoveredVesselId}
            onHoverVessel={setHoveredVesselId}
          />

          {filteredVessels.length === 0 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(5, 8, 16, 0.85)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                color: 'var(--text-primary)',
                zIndex: 20,
              }}
              role="status"
            >
              <AlertTriangle size={32} color="var(--status-warning)" />
              <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '0.05em' }}>
                NO AIS OBSERVATION
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: 360, textAlign: 'center' }}>
                No transiting vessels match the active filter criteria within the observation window. Try resetting filters.
              </div>
              <button
                className="btn btn-secondary btn-xs"
                style={{ marginTop: 6 }}
                onClick={() => {
                  setStatusFilter('all');
                  setSearchQuery('');
                }}
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>

        {/* Right Vessel Information Panel */}
        <aside className="ais-vessel-panel" aria-label="Vessel Telemetry Intelligence Panel">
          <div className="ais-panel-header">
            <span className="ais-panel-title">VESSEL TELEMETRY INTELLIGENCE</span>
            <span className="badge badge-warning" style={{ fontSize: '9px' }}>SIMULATED AIS</span>
          </div>

          <div className="ais-panel-body">
            {/* Vessel Identity Card */}
            <div className="ais-section">
              <div className="ais-section-body">
                <div className="ais-vessel-hero">
                  <div className="ais-vessel-name-lg">{selectedVessel.name}</div>
                  <div className="ais-vessel-sub">
                    <span>{selectedVessel.type}</span>
                    <span>·</span>
                    <span>{selectedVessel.flag} ({selectedVessel.flagName})</span>
                  </div>
                  <div style={{ marginTop: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span className="badge badge-warning">
                      {selectedVessel.status === 'highest-ranked' ? 'HIGHEST-RANKED CANDIDATE' :
                       selectedVessel.status === 'under-review' ? 'UNDER REVIEW' : selectedVessel.status.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      MMSI {selectedVessel.mmsi}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* AIS Observation Gap Alert Box — MANDATORY REQUIRED LANGUAGE */}
            {selectedVessel.aisGap && (
              <div className="ais-gap-alert-box" role="alert">
                <AlertTriangle size={16} color="var(--status-critical)" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                <div className="ais-gap-alert-text">
                  <div className="ais-gap-alert-title">AIS observation gap detected.</div>
                  <div style={{ fontSize: '11px', marginTop: 2 }}>
                    Observation Gap Duration: <strong>{selectedVessel.aisGapDuration}</strong>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 2 }}>
                    Last Observed Position: <strong>{selectedVessel.lat.toFixed(4)}°N, {selectedVessel.lon.toFixed(4)}°E</strong>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 1 }}>
                    Gap Window: {selectedVessel.aisGapWindow}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: 4, fontStyle: 'italic' }}>
                    Data Source: Terrestrial / Satellite AIS Reconstructed Trajectory (Uncertainty ±1.5 NM). An observation gap does not imply intentional shutdown.
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 1: Vessel Parameters */}
            <div className="ais-section">
              <div className="ais-section-header">
                <span className="ais-section-title">Kinematics &amp; Telemetry</span>
                <Clock size={12} color="var(--accent-cyan)" aria-hidden="true" />
              </div>
              <div className="ais-section-body">
                <div className="ais-kv">
                  <span className="ais-kv-label">Speed Over Ground (SOG)</span>
                  <span className="ais-kv-val ais-kv-val--mono">{selectedVessel.speed.toFixed(1)} knots</span>
                </div>

                <div className="ais-kv">
                  <span className="ais-kv-label">Course Over Ground (COG)</span>
                  <span className="ais-kv-val ais-kv-val--mono">{selectedVessel.heading}°</span>
                </div>

                <div className="ais-kv">
                  <span className="ais-kv-label">Last AIS Observation</span>
                  <span className="ais-kv-val ais-kv-val--mono">{selectedVessel.lastObs}</span>
                </div>

                <div className="ais-kv">
                  <span className="ais-kv-label">Distance to Spill Centroid</span>
                  <span className="ais-kv-val ais-kv-val--gold">{selectedVessel.distToSpill}</span>
                </div>

                <div className="ais-kv">
                  <span className="ais-kv-label">Position Coordinates</span>
                  <span className="ais-kv-val ais-kv-val--mono">
                    {selectedVessel.lat.toFixed(4)}°N, {selectedVessel.lon.toFixed(4)}°E
                  </span>
                </div>

                {selectedVessel.dwt && (
                  <div className="ais-kv">
                    <span className="ais-kv-label">Deadweight Tonnage</span>
                    <span className="ais-kv-val">{selectedVessel.dwt}</span>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 2: Compatibility & Continuity */}
            <div className="ais-section">
              <div className="ais-section-header">
                <span className="ais-section-title">Investigation Compatibility</span>
                <Radio size={12} color="var(--accent-cyan)" aria-hidden="true" />
              </div>
              <div className="ais-section-body">
                <div className="ais-kv">
                  <span className="ais-kv-label">Temporal Compatibility</span>
                  <span className="ais-kv-val ais-kv-val--cyan" style={{ fontSize: '13px' }}>
                    {selectedVessel.temporalComp}%
                  </span>
                </div>

                <div className="ais-kv">
                  <span className="ais-kv-label">AIS Signal Continuity</span>
                  <span className="badge badge-neutral">
                    {selectedVessel.aisContinuity.toUpperCase()}
                  </span>
                </div>

                <div className="ais-kv">
                  <span className="ais-kv-label">Corridor Intersection</span>
                  <span className="ais-kv-val" style={{ color: (selectedVessel.status === 'highest-ranked' || selectedVessel.status === 'under-review') ? '#e8423a' : 'var(--text-primary)' }}>
                    {(selectedVessel.status === 'highest-ranked' || selectedVessel.status === 'under-review') ? 'YES (Source Window)' : 'NO'}
                  </span>
                </div>

                <div style={{ marginTop: 6, fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Candidate analysis indicates vessel movement history is compatible with modelled spill source parameters. Findings support further investigation; no legal determination has been made.
                </div>
              </div>
            </div>

            {/* SECTION 3: Historic Waypoints List */}
            <div className="ais-section">
              <div className="ais-section-header">
                <span className="ais-section-title">Track History (Last 5 Fixes)</span>
              </div>
              <div className="ais-section-body">
                {selectedVessel.waypoints.map((wp, i) => (
                  <div key={i} className="ais-kv">
                    <span className="ais-kv-label" style={{ fontFamily: 'var(--font-mono)' }}>{wp.time}</span>
                    <span className="ais-kv-val ais-kv-val--mono">{wp.speed} kn</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom Strip — Quick Vessel Selector & Disclaimer */}
      <div className="ais-bottom-strip" role="region" aria-label="Quick vessel selector">
        <div className="ais-vessel-selector-list">
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wider)' }}>
            Candidates:
          </span>
          {SIMULATED_VESSELS.map((v) => (
            <button
              key={v.id}
              className={`ais-vessel-pill ${v.id === selectedVesselId ? 'ais-vessel-pill--active' : ''}`}
              onClick={() => setSelectedVesselId(v.id)}
            >
              <Ship size={11} color={v.status === 'highest-ranked' || v.status === 'under-review' ? '#e8423a' : v.status === 'monitored' ? '#e5a020' : '#2ece7a'} />
              <span>{v.name}</span>
            </button>
          ))}
        </div>

        {/* Mandatory Disclaimer */}
        <div className="ais-disclaimer">
          <ShieldAlert size={12} color="var(--status-warning)" aria-hidden="true" />
          <span>
            <strong>DEMO MODE · SIMULATED DATA</strong> — AIS tracks and observation gaps are simulated for UI demonstration. Findings support decision making; attribution is not legally established.
          </span>
        </div>
      </div>
    </div>
  );
};
