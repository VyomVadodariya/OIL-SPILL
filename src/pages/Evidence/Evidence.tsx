/**
 * OceanIntel — Evidence Investigation Screen
 *
 * Investigation evidence workstation for evaluating candidate vessels against
 * physical observations, drift models, and AIS signal continuity.
 *
 * SCIENTIFIC INTEGRITY & TERMINOLOGY RULES:
 * - Clear evidence chain: SAR Evidence → Spill Geometry → Temporal Evidence →
 *   Environmental Drift → AIS Evidence → Candidate Vessel → Supporting/Contradicting → Investigation Assessment.
 * - Each item displays: Source, Timestamp, Data Quality, Supporting/Contradicting, Uncertainty.
 * - Mandatory phrasing: "Evidence is compatible with investigation hypothesis."
 * - Strictly excludes legal determination or premature attribution.
 * - DEMO MODE · SIMULATED DATA.
 */

import React, { useState } from 'react';
import {
  FileSearch,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
  MapPin,
  Clock,
  Wind,
  Radio,
  UserCheck,
  Satellite,
  Ship,
} from 'lucide-react';

import { EvidenceTimeline, type TimelineNode } from './EvidenceTimeline';
import { DEMO_INCIDENT } from '../../data/demo/incident';
import { DataStatusBadge } from '../../components/common/DataStatusBadge';
import './Evidence.css';

export const Evidence: React.FC = () => {
  const [selectedCandidate, setSelectedCandidate] = useState<string>('harbor-pioneer');
  const [, setSelectedTimelineNode] = useState<TimelineNode | null>(null);

  const currentCandidate =
    DEMO_INCIDENT.candidates.find((c) => c.id === selectedCandidate) ?? DEMO_INCIDENT.candidates[0];

  return (
    <div className="ev-container" role="main" aria-label="OceanIntel Evidence Investigation Workstation">
      {/* Top Toolbar */}
      <div className="ev-toolbar">
        <div className="ev-toolbar-left">
          <div className="ev-toolbar-title">
            <FileSearch size={16} color="var(--accent-cyan)" aria-hidden="true" />
            Investigation Evidence Chain &amp; Synthesis Workstation
          </div>

            {/* Candidate Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Evaluating:</span>
            <select
              className="ev-candidate-select"
              value={selectedCandidate}
              onChange={(e) => setSelectedCandidate(e.target.value)}
              aria-label="Select Candidate Vessel for Evidence Analysis"
            >
              {DEMO_INCIDENT.candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (Rank #{c.rank} · Investigation Score {c.investigationScore})
                </option>
              ))}
            </select>
          </div>

          {/* Evidence Compatibility Meter */}
          <div className="ev-strength-meter" title="Aggregated multi-factor evidence compatibility metric">
            <span style={{ color: 'var(--text-muted)' }}>Evidence Compatibility:</span>
            <div className="ev-strength-bar">
              <div
                className="ev-strength-fill"
                style={{ width: `${currentCandidate.investigationScore}%` }}
              />
            </div>
            <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
              {currentCandidate.investigationScore >= 75
                ? `HIGH (${currentCandidate.investigationScore}%)`
                : currentCandidate.investigationScore >= 50
                ? `MODERATE (${currentCandidate.investigationScore}%)`
                : `LOW (${currentCandidate.investigationScore}%)`}
            </strong>
          </div>
        </div>

        {/* Status Badge */}
        <DataStatusBadge status="DEMO MODE · SIMULATED DATA" />
      </div>

      {/* Connected Evidence Timeline Flow Diagram */}
      <EvidenceTimeline onNodeClick={setSelectedTimelineNode} />

      {/* Main Split Workspace */}
      <div className="ev-workspace">
        {/* Left Pane (~55%): Evidence Chain Items */}
        <div className="ev-left-pane">
          {/* 1. SAR EVIDENCE */}
          <div className="ev-section">
            <div className="ev-section-header">
              <span className="ev-section-title">
                <Satellite size={13} color="var(--accent-cyan)" aria-hidden="true" />
                1. Satellite SAR Evidence
              </span>
              <span style={{ fontSize: '10px', color: '#2ece7a', fontWeight: 600 }}>SUPPORTING EVIDENCE</span>
            </div>
            <div className="ev-section-body">
              <div className="ev-kv-grid">
                <div className="ev-kv">
                  <span className="ev-kv-label">Sensor Source</span>
                  <span className="ev-kv-val">Sentinel-1A C-SAR (VV Polarization)</span>
                </div>
                <div className="ev-kv">
                  <span className="ev-kv-label">Acquisition Timestamp</span>
                  <span className="ev-kv-val ev-kv-val--mono">2026-09-07 06:12:04 UTC</span>
                </div>
                <div className="ev-kv">
                  <span className="ev-kv-label">Data Quality</span>
                  <span className="ev-kv-val ev-kv-val--cyan">92% Confidence (Lee Filtered)</span>
                </div>
                <div className="ev-kv">
                  <span className="ev-kv-label">Uncertainty Bound</span>
                  <span className="ev-kv-val ev-kv-val--mono">±8.0% speckle intensity noise</span>
                </div>
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Single-channel VV copolarized microwave backscatter depression (-24.6 dB NRCS) isolates mineral oil slick dampening from open ocean background clutter.
              </div>
            </div>
          </div>

          {/* 2. SPILL GEOMETRY */}
          <div className="ev-section">
            <div className="ev-section-header">
              <span className="ev-section-title">
                <MapPin size={13} color="var(--accent-cyan)" aria-hidden="true" />
                2. Spill Geometry &amp; Spatial Proximity
              </span>
              <span style={{ fontSize: '10px', color: '#2ece7a', fontWeight: 600 }}>SUPPORTING EVIDENCE</span>
            </div>
            <div className="ev-section-body">
              <div className="ev-kv-grid">
                <div className="ev-kv">
                  <span className="ev-kv-label">Spill Footprint Area</span>
                  <span className="ev-kv-val ev-kv-val--cyan">42.7 km² (4,270 ha)</span>
                </div>
                <div className="ev-kv">
                  <span className="ev-kv-label">Centroid Coordinates</span>
                  <span className="ev-kv-val ev-kv-val--mono">26°09′N · 051°48′E</span>
                </div>
                <div className="ev-kv">
                  <span className="ev-kv-label">Centroid Proximity to Track</span>
                  <span className="ev-kv-val ev-kv-val--cyan">0.8 NM (1.5 km)</span>
                </div>
                <div className="ev-kv">
                  <span className="ev-kv-label">Spatial Uncertainty</span>
                  <span className="ev-kv-val ev-kv-val--mono">±0.4 km boundary resolution</span>
                </div>
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Reconstructed vessel track intersects the core 28.0 km² release envelope within 0.8 NM of the detected oil slick centroid.
              </div>
            </div>
          </div>

          {/* 3. TEMPORAL EVIDENCE */}
          <div className="ev-section">
            <div className="ev-section-header">
              <span className="ev-section-title">
                <Clock size={13} color="var(--accent-cyan)" aria-hidden="true" />
                3. Temporal Release Window Coincidence
              </span>
              <span style={{ fontSize: '10px', color: '#2ece7a', fontWeight: 600 }}>SUPPORTING EVIDENCE</span>
            </div>
            <div className="ev-section-body">
              <div className="ev-kv-grid">
                <div className="ev-kv">
                  <span className="ev-kv-label">Estimated Release Window</span>
                  <span className="ev-kv-val ev-kv-val--mono">02:00Z – 04:00Z (±1.0h)</span>
                </div>
                <div className="ev-kv">
                  <span className="ev-kv-label">SAR Overpass Fix</span>
                  <span className="ev-kv-val ev-kv-val--mono">2026-09-07 06:12:04 UTC</span>
                </div>
                <div className="ev-kv">
                  <span className="ev-kv-label">Temporal Compatibility</span>
                  <span className="ev-kv-val ev-kv-val--cyan">92% Window Coincidence</span>
                </div>
                <div className="ev-kv">
                  <span className="ev-kv-label">Temporal Uncertainty</span>
                  <span className="ev-kv-val ev-kv-val--mono">±1.0 hour dispersion margin</span>
                </div>
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Estimated release timeframe directly coincides with candidate vessel transit through the backward drift origin corridor.
              </div>
            </div>
          </div>

          {/* 4. ENVIRONMENTAL DRIFT */}
          <div className="ev-section">
            <div className="ev-section-header">
              <span className="ev-section-title">
                <Wind size={13} color="var(--accent-cyan)" aria-hidden="true" />
                4. Environmental Drift Trajectory Compatibility
              </span>
              <span style={{ fontSize: '10px', color: '#2ece7a', fontWeight: 600 }}>SUPPORTING EVIDENCE</span>
            </div>
            <div className="ev-section-body">
              <div className="ev-kv-grid">
                <div className="ev-kv">
                  <span className="ev-kv-label">Current &amp; Wind Forcing</span>
                  <span className="ev-kv-val ev-kv-val--mono">1.4 kn @ 148° / 14.2 kn @ 328°</span>
                </div>
                <div className="ev-kv">
                  <span className="ev-kv-label">Backward Particle Overlap</span>
                  <span className="ev-kv-val ev-kv-val--cyan">82% Trajectory Intersection</span>
                </div>
                <div className="ev-kv">
                  <span className="ev-kv-label">Data Sources</span>
                  <span className="ev-kv-val">OpenDrift / CMEMS + ECMWF ERA5</span>
                </div>
                <div className="ev-kv">
                  <span className="ev-kv-label">Model Uncertainty</span>
                  <span className="ev-kv-val ev-kv-val--mono">±1.2 km spatial dispersal margin</span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. AIS EVIDENCE */}
          <div className="ev-section">
            <div className="ev-section-header">
              <span className="ev-section-title">
                <Radio size={13} color="var(--accent-cyan)" aria-hidden="true" />
                5. AIS Telemetry &amp; Signal Continuity
              </span>
              <span style={{ fontSize: '10px', color: '#e5a020', fontWeight: 600 }}>OBSERVATION GAP DETECTED</span>
            </div>
            <div className="ev-section-body">
              <div className="ev-kv-grid">
                <div className="ev-kv">
                  <span className="ev-kv-label">AIS Observation Gap</span>
                  <span className="ev-kv-val ev-kv-val--primary">4h 08m Duration</span>
                </div>
                <div className="ev-kv">
                  <span className="ev-kv-label">Last Transmission Fix</span>
                  <span className="ev-kv-val ev-kv-val--mono">2026-09-07 14:22 UTC</span>
                </div>
                <div className="ev-kv">
                  <span className="ev-kv-label">Pre-Gap Speed Over Ground</span>
                  <span className="ev-kv-val ev-kv-val--mono">0.5 knots</span>
                </div>
                <div className="ev-kv">
                  <span className="ev-kv-label">Telemetry Uncertainty</span>
                  <span className="ev-kv-val ev-kv-val--mono">Interpolated dead reckoning margin</span>
                </div>
              </div>
            </div>
          </div>

          {/* 6. CANDIDATE VESSEL */}
          <div className="ev-section">
            <div className="ev-section-header">
              <span className="ev-section-title">
                <Ship size={13} color="var(--accent-cyan)" aria-hidden="true" />
                6. Investigation Candidate Profile
              </span>
              <span className="badge badge-warning">
                {currentCandidate.status === 'highest-ranked' ? 'HIGHEST-RANKED CANDIDATE' : currentCandidate.status.toUpperCase()}
              </span>
            </div>
            <div className="ev-section-body">
              <div className="ev-kv-grid">
                <div className="ev-kv">
                  <span className="ev-kv-label">Candidate Name</span>
                  <span className="ev-kv-val" style={{ fontWeight: 700 }}>{currentCandidate.name}</span>
                </div>
                <div className="ev-kv">
                  <span className="ev-kv-label">MMSI</span>
                  <span className="ev-kv-val ev-kv-val--mono">{currentCandidate.mmsi}</span>
                </div>
                <div className="ev-kv">
                  <span className="ev-kv-label">Vessel Type / Flag</span>
                  <span className="ev-kv-val">{currentCandidate.type} ({currentCandidate.flagName})</span>
                </div>
                <div className="ev-kv">
                  <span className="ev-kv-label">Investigation Score</span>
                  <span className="ev-kv-val ev-kv-val--cyan">
                    {currentCandidate.investigationScore} / 100 ({currentCandidate.rank === 1 ? 'Highest-Ranked' : `Rank #${currentCandidate.rank}`})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Pane (~45%): Supporting/Contradicting & Assessment */}
        <div className="ev-right-pane">
          {/* 7. SUPPORTING VS. CONTRADICTORY EVIDENCE */}
          <div className="ev-section">
            <div className="ev-section-header">
              <span className="ev-section-title">7. Supporting vs. Contradictory Evidence</span>
            </div>
            <div className="ev-section-body">
              {/* Supporting Items */}
              <div className="ev-support-card">
                <CheckCircle2 size={14} color="#2ece7a" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
                <div>
                  <strong style={{ color: '#2ece7a' }}>Supporting: </strong>
                  SAR detection window coincides with 4h 08m AIS observation gap. Reconstructed track directly intersects backward drift source corridor.
                </div>
              </div>

              <div className="ev-support-card">
                <CheckCircle2 size={14} color="#2ece7a" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
                <div>
                  <strong style={{ color: '#2ece7a' }}>Supporting: </strong>
                  Vessel heading 142° (SE) aligns with the observed spill elongation vector orientation.
                </div>
              </div>

              {/* Contradictory / Limitation Items */}
              <div className="ev-contradict-card">
                <AlertCircle size={14} color="#f5564e" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
                <div>
                  <strong style={{ color: '#f5564e' }}>Data Limitation: </strong>
                  Optical satellite coverage unavailable due to 35% localized cloud cover. Direct physical slick chemical fingerprint lab test pending.
                </div>
              </div>

              <div className="ev-contradict-card">
                <AlertCircle size={14} color="#f5564e" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
                <div>
                  <strong style={{ color: '#f5564e' }}>Uncertainty Factor: </strong>
                  Secondary candidate vessel (DELTA STAR) was stationary 2.4 NM from centroid during overlapping temporal window.
                </div>
              </div>
            </div>
          </div>

          {/* Model Uncertainty & Data Quality */}
          <div className="ev-section">
            <div className="ev-section-header">
              <span className="ev-section-title">
                <HelpCircle size={13} color="var(--accent-cyan)" aria-hidden="true" />
                Model Uncertainty &amp; Data Quality
              </span>
            </div>
            <div className="ev-section-body">
              <div className="ev-quality-row">
                <span className="ev-quality-label">Sentinel-1A SAR Quality</span>
                <div className="ev-quality-track">
                  <div className="ev-quality-fill" style={{ width: '94%' }} />
                </div>
                <span className="ev-quality-pct">94%</span>
              </div>

              <div className="ev-quality-row">
                <span className="ev-quality-label">ECMWF ERA5 Wind Data</span>
                <div className="ev-quality-track">
                  <div className="ev-quality-fill" style={{ width: '88%' }} />
                </div>
                <span className="ev-quality-pct">88%</span>
              </div>

              <div className="ev-quality-row">
                <span className="ev-quality-label">Coastal / Satellite AIS Feed</span>
                <div className="ev-quality-track">
                  <div className="ev-quality-fill" style={{ width: '76%' }} />
                </div>
                <span className="ev-quality-pct">76%</span>
              </div>

              <div className="ev-quality-row">
                <span className="ev-quality-label">CMEMS Ocean Currents</span>
                <div className="ev-quality-track">
                  <div className="ev-quality-fill" style={{ width: '82%' }} />
                </div>
                <span className="ev-quality-pct">82%</span>
              </div>
            </div>
          </div>

          {/* 8. INVESTIGATION ASSESSMENT — MANDATORY PHRASING RULE */}
          <div className="ev-phrasing-box" role="note">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <UserCheck size={14} color="var(--accent-cyan)" aria-hidden="true" />
              <strong style={{ color: 'var(--accent-cyan)' }}>8. Investigation Assessment Summary:</strong>
            </div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>
              Evidence is compatible with investigation hypothesis.
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.45 }}>
              Multi-source correlation of SAR geometry, hydrodynamic drift particle modeling, and AIS telemetry supports further formal Port State Control inspection. No legal determination has been made and no certainty of guilt is claimed.
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Strip — Disclaimer */}
      <div className="ev-bottom-strip" role="region" aria-label="Workstation disclaimer">
        <div className="ev-disclaimer">
          <ShieldAlert size={12} color="var(--status-warning)" aria-hidden="true" />
          <span>
            <strong>DEMO MODE · SIMULATED DATA</strong> — Evidence synthesis metrics are simulated for UI workstation demonstration. Terms such as "Guilt" or "Legal Certainty" are strictly excluded from scientific attribution workflows.
          </span>
        </div>
      </div>
    </div>
  );
};
