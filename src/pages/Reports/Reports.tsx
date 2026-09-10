/**
 * OceanIntel — Reports Screen
 *
 * Investigation incident report generator, demo evidence ledger,
 * and multi-format export workstation.
 *
 * PROBLEM: SIH26143 — Satellite SAR Oil Spill Detection & AIS Vessel Correlation
 *
 * ABSOLUTE RULES:
 * - NO FABRICATION: Clearly marked as DEMO MODE · SIMULATED DATA
 * - Real functional export:
 *   - PRINT / SAVE AS PDF -> window.print()
 *   - EXPORT JSON -> Blob download of DEMO_INCIDENT
 *   - EXPORT GEOJSON -> Blob download of DEMO_INCIDENT GeoJSON geometry
 * - Demo Evidence Ledger: SIMULATED HASH · DEMO DATA · NOT CRYPTOGRAPHICALLY VERIFIED
 * - Explainable Response Priority (6-factor analysis)
 * - Mandatory Legal Disclaimer: "This report is an investigation-support output and does not constitute legal attribution."
 */

import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  FileCode,
  Printer,
  FileSpreadsheet,
  AlertTriangle,
  Info,
  Scale,
  Hash,
} from 'lucide-react';
import { DEMO_INCIDENT } from '../../data/demo/incident';
import { DataStatusBadge } from '../../components/common/DataStatusBadge';
import './Reports.css';

interface DemoLedgerItem {
  id: string;
  artifactType: string;
  sourceSystem: string;
  localHash: string;
  timestamp: string;
  dataQuality: string;
}

const DEMO_LEDGER_ITEMS: DemoLedgerItem[] = [
  {
    id: 'EV-SAR-001',
    artifactType: 'Sentinel-1A SAR Scene (VV Decibel)',
    sourceSystem: 'Automated SAR Ingestion Node',
    localHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    timestamp: '2026-09-07 06:12:04 UTC',
    dataQuality: '92% Confidence (Lee Filtered)',
  },
  {
    id: 'EV-AIS-002',
    artifactType: 'AIS Trajectory & Observation Gap Record',
    sourceSystem: 'Maritime AIS Ingestion Stream',
    localHash: 'f7c3bc1d808e04732adf679965ccc34ca7ae3441ca29e2351d3b4827d09a0614',
    timestamp: '2026-09-07 14:22:00 UTC',
    dataQuality: '4h 08m Gap Reconstructed',
  },
  {
    id: 'EV-DRF-003',
    artifactType: 'Hydrodynamic Backward Hindcast Corridor',
    sourceSystem: 'OpenDrift + CMEMS Hydro Service',
    localHash: '109a9668d2b9634e062b3ef008e7343e8d91f27481a5c6d042ea046522c0919a',
    timestamp: '2026-09-07 07:30:00 UTC',
    dataQuality: 'Origin Window 02:00–04:00Z',
  },
  {
    id: 'EV-RNK-004',
    artifactType: 'Candidate Multi-Factor Ranking Matrix',
    sourceSystem: 'Multi-Factor Correlation Engine',
    localHash: '4a7d1ed414474e4033ac29ccb8653d9b891e8432b112948cfba488210332810a',
    timestamp: '2026-09-07 09:00:00 UTC',
    dataQuality: 'Rank #1: HARBOR PIONEER (Score 87)',
  },
];

export const Reports: React.FC = () => {
  const [downloadNotification, setDownloadNotification] = useState<string | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleExportJson = () => {
    const exportPayload = {
      system: 'OceanIntel Maritime Oil Spill Investigation Intelligence Workstation',
      version: 'SIH26143-DEMO',
      exportTimestamp: new Date().toISOString(),
      disclaimer: 'This report is an investigation-support output and does not constitute legal attribution. DEMO MODE · SIMULATED DATA.',
      incident: DEMO_INCIDENT,
      responsePriorityAnalysis: {
        priority: 'HIGH',
        evaluatedFactors: {
          spillSize: '42.7 km² (High Severity)',
          transportSpeed: '1.6 knots (Moderate Dispersal Rate)',
          environmentalSensitivity: 'Ras Laffan Marine Reserve & Mangrove Inlets (High Exposure)',
          coastalExposureProximity: '22.4 km / 12.1 NM offshore (Imminent)',
          detectionQuality: '92% Confidence Sentinel-1A SAR (High Reliability)',
          uncertaintyMargin: '±1.2 km spatial / ±1.0 h temporal (Bound)',
        },
      },
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OceanIntel_INC-2026-047_Investigation_Dossier.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadNotification(`Exported OceanIntel_INC-2026-047_Investigation_Dossier.json (${(blob.size / 1024).toFixed(1)} KB)`);
    setTimeout(() => setDownloadNotification(null), 5000);
  };

  const handleExportGeoJson = () => {
    const geoJsonPayload = {
      type: 'FeatureCollection',
      name: 'OceanIntel_INC-2026-047_SpillGeometry',
      crs: {
        type: 'name',
        properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' },
      },
      features: [
        ...DEMO_INCIDENT.geoJson.spill.features,
        ...DEMO_INCIDENT.geoJson.drift.features,
        {
          type: 'Feature',
          properties: {
            id: 'incident-centroid',
            name: 'Spill Detection Centroid',
            coordinatesText: DEMO_INCIDENT.centroid.text,
            sensor: DEMO_INCIDENT.detection.sensor,
            detectionTime: DEMO_INCIDENT.detection.timestamp,
            areaKm2: DEMO_INCIDENT.detection.areaKm2,
          },
          geometry: {
            type: 'Point',
            coordinates: [DEMO_INCIDENT.centroid.lon, DEMO_INCIDENT.centroid.lat],
          },
        },
        ...DEMO_INCIDENT.candidates.map((c) => ({
          type: 'Feature',
          properties: {
            vesselId: c.id,
            name: c.name,
            mmsi: c.mmsi,
            type: c.type,
            rank: c.rank,
            investigationScore: c.investigationScore,
            status: c.status,
            aisGap: c.aisGap,
            aisGapDuration: c.aisGapDuration ?? 'None',
          },
          geometry: {
            type: 'Point',
            coordinates: [c.lon, c.lat],
          },
        })),
      ],
    };

    const blob = new Blob([JSON.stringify(geoJsonPayload, null, 2)], {
      type: 'application/geo+json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OceanIntel_INC-2026-047_Geometry.geojson`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadNotification(`Exported OceanIntel_INC-2026-047_Geometry.geojson (${(blob.size / 1024).toFixed(1)} KB)`);
    setTimeout(() => setDownloadNotification(null), 5000);
  };

  return (
    <div className="rep-container" role="main" aria-label="OceanIntel Reports Workstation">
      {/* Top Toolbar */}
      <div className="rep-toolbar no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FileText size={18} color="var(--accent-cyan)" />
          <div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              Investigation Incident Dossier &amp; Export Workstation
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Investigation-Support Reporting Engine · SIH26143
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <DataStatusBadge status="DEMO MODE · SIMULATED DATA" />

          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn btn-primary btn-xs"
              onClick={handlePrint}
              title="Print document or generate PDF using system print dialogue"
            >
              <Printer size={12} style={{ marginRight: 4 }} />
              PRINT / SAVE AS PDF
            </button>

            <button
              className="btn btn-secondary btn-xs"
              onClick={handleExportJson}
              title="Download structured JSON incident dossier blob"
            >
              <FileSpreadsheet size={12} style={{ marginRight: 4 }} />
              EXPORT JSON
            </button>

            <button
              className="btn btn-secondary btn-xs"
              onClick={handleExportGeoJson}
              title="Download standard GeoJSON geometry collection blob"
            >
              <FileCode size={12} style={{ marginRight: 4 }} />
              EXPORT GEOJSON
            </button>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {downloadNotification && (
        <div className="rep-notification-banner no-print" role="status">
          <CheckCircle2 size={14} color="#10b981" />
          <span>{downloadNotification}</span>
        </div>
      )}

      {/* Main Split */}
      <div className="rep-workspace">
        {/* Left Pane: Report Dossier Document */}
        <div className="rep-left-pane">
          <div className="rep-card print-target">
            <div className="rep-card-header no-print">
              <span className="rep-card-title">
                Incident Dossier Preview — {DEMO_INCIDENT.id}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Target Export: Multi-Agency Briefing
              </span>
            </div>

            <div className="rep-card-body rep-dossier-body">
              {/* Document Header */}
              <div className="rep-doc-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--accent-cyan)', paddingBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <img
                      src="/oceanintel-logo.png"
                      alt="OceanIntel Official Emblem"
                      style={{
                        width: 54,
                        height: 54,
                        objectFit: 'contain',
                        borderRadius: 'var(--radius-sm)',
                        background: '#ffffff',
                        padding: 3,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        border: '1px solid var(--border-subtle)',
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
                        OceanIntel Maritime Intelligence System · SEE | TRACE | UNDERSTAND
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
                        MARITIME OIL SPILL INVESTIGATION REPORT
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 2 }}>
                        INCIDENT DOSSIER: <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{DEMO_INCIDENT.id}</strong> · {DEMO_INCIDENT.region} · SIH26143
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <div>DATE: {DEMO_INCIDENT.openedDate}</div>
                    <div>STATUS: ACTIVE INVESTIGATION</div>
                    <div style={{ color: 'var(--status-warning)', fontWeight: 600, marginTop: 4 }}>
                      DEMO MODE · SIMULATED DATA
                    </div>
                  </div>
                </div>

                {/* MANDATORY LEGAL ATTRIBUTION DISCLAIMER */}
                <div className="rep-disclaimer-banner" role="note">
                  <AlertTriangle size={14} style={{ color: 'var(--status-warning)', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong style={{ color: 'var(--status-warning)' }}>Notice: </strong>
                    This report is an investigation-support output and does not constitute legal attribution.
                    All findings reflect multi-factor algorithmic correlation of satellite SAR observations,
                    hydrodynamic particle drift backtracking, and AIS vessel telemetry.
                  </div>
                </div>
              </div>

              {/* Dossier Sections */}
              <div className="rep-doc-content">
                {/* 1. Incident Overview */}
                <section className="rep-section">
                  <h3 className="rep-heading">1. Incident Overview</h3>
                  <div className="rep-table-wrap">
                    <table className="rep-meta-table">
                      <tbody>
                        <tr>
                          <th>Incident Identifier</th>
                          <td>{DEMO_INCIDENT.id}</td>
                          <th>Investigation State</th>
                          <td><span className="badge badge-success">ACTIVE MONITORING</span></td>
                        </tr>
                        <tr>
                          <th>Detection Centroid</th>
                          <td>{DEMO_INCIDENT.centroid.text} ({DEMO_INCIDENT.centroid.dmsLat}, {DEMO_INCIDENT.centroid.dmsLon})</td>
                          <th>Offshore Distance</th>
                          <td>{DEMO_INCIDENT.distanceToNearestCoast.km} km ({DEMO_INCIDENT.distanceToNearestCoast.nm} NM) to {DEMO_INCIDENT.distanceToNearestCoast.coastlineName}</td>
                        </tr>
                        <tr>
                          <th>Detection Timestamp</th>
                          <td>{DEMO_INCIDENT.detection.timestamp}</td>
                          <th>Estimated Spill Origin Window</th>
                          <td>2026-09-07 02:00Z – 04:00Z (T-4h backtracking)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* 2. Detection & SAR Observation */}
                <section className="rep-section">
                  <h3 className="rep-heading">2. Satellite SAR Detection &amp; Sensor Observation</h3>
                  <p>
                    On 2026-09-07 at 06:12:04 UTC, a Sentinel-1A C-band Synthetic Aperture Radar (SAR) acquisition in Interferometric Wide (IW) swath mode captured a pronounced surface backscatter depression in the central Persian Gulf. The slick signature was segmented using the U-Net + ResNet34 pipeline architecture.
                  </p>
                  <div className="rep-grid-3col">
                    <div className="rep-stat-box">
                      <span className="rep-stat-lbl">Satellite Sensor</span>
                      <span className="rep-stat-val">{DEMO_INCIDENT.detection.sensor}</span>
                      <span className="rep-stat-sub">Mode: {DEMO_INCIDENT.detection.mode}</span>
                    </div>
                    <div className="rep-stat-box">
                      <span className="rep-stat-lbl">Polarization</span>
                      <span className="rep-stat-val">{DEMO_INCIDENT.detection.polarization}</span>
                      <span className="rep-stat-sub">Single-channel Copolarized</span>
                    </div>
                    <div className="rep-stat-box">
                      <span className="rep-stat-lbl">Detection Quality</span>
                      <span className="rep-stat-val" style={{ color: 'var(--accent-cyan)' }}>{DEMO_INCIDENT.detection.confidence}%</span>
                      <span className="rep-stat-sub">High Quality Index</span>
                    </div>
                  </div>
                </section>

                {/* 3. Spill Characterization */}
                <section className="rep-section">
                  <h3 className="rep-heading">3. Spill Characterization &amp; Morphology</h3>
                  <div className="rep-grid-3col">
                    <div className="rep-stat-box">
                      <span className="rep-stat-lbl">Total Slick Area</span>
                      <span className="rep-stat-val">{DEMO_INCIDENT.detection.areaKm2} km²</span>
                      <span className="rep-stat-sub">Core plume: 36.8 km²</span>
                    </div>
                    <div className="rep-stat-box">
                      <span className="rep-stat-lbl">Estimated Volume</span>
                      <span className="rep-stat-val">{DEMO_INCIDENT.detection.volumeBbl.toLocaleString()} bbl</span>
                      <span className="rep-stat-sub">~{DEMO_INCIDENT.detection.volumeM3} m³ heavy crude</span>
                    </div>
                    <div className="rep-stat-box">
                      <span className="rep-stat-lbl">Plume Elongation &amp; Axis</span>
                      <span className="rep-stat-val">{DEMO_INCIDENT.detection.elongationRatio}</span>
                      <span className="rep-stat-sub">Orientation: {DEMO_INCIDENT.detection.orientationAngle}</span>
                    </div>
                  </div>
                  <p style={{ marginTop: 8 }}>
                    Morphological analysis indicates an elongated surface slick with significant directional shearing aligned with local hydrodynamic transport (surface currents 1.4 kn @ 148° and prevailing winds 14.2 kn @ 328°).
                  </p>
                </section>

                {/* 4. AIS Evidence & Observation Gaps */}
                <section className="rep-section">
                  <h3 className="rep-heading">4. AIS Evidence &amp; Observation Gap Detection</h3>
                  <p>
                    Reconstruction of terrestrial and satellite AIS telemetry for all commercial vessels transiting within a 25 NM radius during the ±12h incident envelope identified 5 vessel tracks.
                  </p>
                  <div className="rep-info-box">
                    <Info size={14} style={{ color: 'var(--accent-cyan)', flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <strong>AIS Observation Gap Detected: </strong>
                      Candidate vessel <strong>HARBOR PIONEER (MMSI 538009842)</strong> experienced an AIS observation gap of <strong>4 hours 08 minutes</strong> (between 10:14 UTC and 14:22 UTC on 2026-09-07).
                      An AIS observation gap detected does not imply deliberate transmitter shutdown; signal loss may be caused by satellite reception masking, high antenna traffic, or propagation attenuation.
                    </div>
                  </div>
                </section>

                {/* 5. Hydrodynamic Drift Analysis */}
                <section className="rep-section">
                  <h3 className="rep-heading">5. Hydrodynamic Drift Analysis (Hindcast &amp; Forecast)</h3>
                  <p>
                    Drift modeling with backward trajectory particle tracking constrained the probable release window between 02:00Z and 04:00Z.
                    A 72-hour forward forecast projects dispersal toward the coastal boundary.
                  </p>
                  <div className="rep-quote-box">
                    "Modelled trajectory indicates potential exposure, subject to environmental and model uncertainty."
                  </div>
                  <div className="rep-grid-2col" style={{ marginTop: 8 }}>
                    <div className="rep-stat-box">
                      <span className="rep-stat-lbl">Backward Drift Corridor (Origin Envelope)</span>
                      <span className="rep-stat-val" style={{ color: 'var(--accent-cyan)' }}>28.0 km²</span>
                      <span className="rep-stat-sub">Hindcast duration: 4.0h · Source Centroid: 26°11′N 051°45′E</span>
                    </div>
                    <div className="rep-stat-box">
                      <span className="rep-stat-lbl">Forward 72h Dispersal Footprint</span>
                      <span className="rep-stat-val" style={{ color: '#e5a020' }}>145.0 km²</span>
                      <span className="rep-stat-sub">Forecast speed: 1.6 kn (NNW) · ETA Coastal: T+18h ± 3h</span>
                    </div>
                  </div>
                </section>

                {/* 6. Candidate Vessel Ranking */}
                <section className="rep-section">
                  <h3 className="rep-heading">6. Candidate Vessel Ranking &amp; Investigation Scores</h3>
                  <p>
                    Candidate ranking is calculated across 7 transparent compatibility criteria: spatial proximity, temporal release window coincidence, backward drift corridor intersection, heading vector alignment, speed consistency, AIS continuity, and SAR-AIS consistency.
                  </p>
                  <div className="rep-table-wrap">
                    <table className="rep-data-table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Candidate Vessel</th>
                          <th>MMSI</th>
                          <th>Vessel Type</th>
                          <th>Investigation Score</th>
                          <th>Spatial</th>
                          <th>Temporal</th>
                          <th>Drift</th>
                          <th>AIS Gap</th>
                          <th>Investigation Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {DEMO_INCIDENT.candidates.map((c) => (
                          <tr key={c.id} style={{ background: c.rank === 1 ? 'rgba(6,182,212,0.06)' : undefined }}>
                            <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>#{c.rank}</td>
                            <td style={{ fontWeight: 700 }}>{c.name}</td>
                            <td style={{ fontFamily: 'var(--font-mono)' }}>{c.mmsi}</td>
                            <td>{c.type}</td>
                            <td>
                              <span style={{ fontWeight: 700, color: c.rank === 1 ? 'var(--accent-cyan)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                                {c.investigationScore}/100
                              </span>
                              <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block' }}>DEMO SCORE · SIMULATED</span>
                            </td>
                            <td style={{ fontFamily: 'var(--font-mono)' }}>{c.spatialScore}%</td>
                            <td style={{ fontFamily: 'var(--font-mono)' }}>{c.temporalScore}%</td>
                            <td style={{ fontFamily: 'var(--font-mono)' }}>{c.driftScore}%</td>
                            <td>
                              {c.aisGap ? (
                                <span style={{ color: 'var(--status-critical)', fontWeight: 600 }}>{c.aisGapDuration}</span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>None</span>
                              )}
                            </td>
                            <td>
                              <span className={`badge ${c.rank === 1 ? 'badge-warning' : c.rank <= 3 ? 'badge-neutral' : 'badge-success'}`}>
                                {c.rank === 1 ? 'UNDER REVIEW (HIGHEST-RANKED)' : c.rank <= 3 ? 'MONITORED' : 'CLEARED'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* 7. Environmental Exposure */}
                <section className="rep-section">
                  <h3 className="rep-heading">7. Environmental &amp; Ecological Exposure Assessment</h3>
                  <p>
                    Trajectory projections indicate potential exposure vectors toward sensitive regional shorelines and marine biological sanctuaries:
                  </p>
                  <ul>
                    <li>
                      <strong>Ras Laffan Coastal &amp; Coral Reserve:</strong> 22.4 km (12.1 NM) southwest of spill centroid. Potential exposure ETA: T+18h ± 3h. Sensitivity Index: HIGH.
                    </li>
                    <li>
                      <strong>Halul Shoal &amp; Marine Habitat:</strong> 34.0 km (18.4 NM) east. Potential exposure ETA: T+32h ± 4h. Sensitivity Index: HIGH.
                    </li>
                    <li>
                      <strong>Coastal Mangrove Inlets (Al Thakhira):</strong> 44.5 km (24.0 NM) west-southwest. Potential exposure ETA: T+48h ± 6h. Sensitivity Index: CRITICAL / ESI 10A.
                    </li>
                  </ul>
                </section>

                {/* 8. Explainable Response Priority (6-Factor Analysis) */}
                <section className="rep-section">
                  <h3 className="rep-heading">8. Explainable Response Priority Assessment</h3>
                  <div className="rep-priority-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Scale size={18} style={{ color: '#e8423a' }} />
                        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          ASSIGNED INCIDENT RESPONSE PRIORITY:
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 800,
                          color: '#fff',
                          background: '#e8423a',
                          padding: '4px 12px',
                          borderRadius: 'var(--radius-xs)',
                          letterSpacing: '0.05em',
                        }}
                      >
                        HIGH PRIORITY
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: 10 }}>
                      Response priority is not a black-box score; it is derived from 6 explicit operational criteria:
                    </div>

                    <div className="rep-grid-2col">
                      <div className="rep-factor-row">
                        <strong>1. Spill Size:</strong>
                        <span>42.7 km² area &gt; 30 km² threshold (High Volume / Heavy Slick)</span>
                      </div>
                      <div className="rep-factor-row">
                        <strong>2. Transport Speed:</strong>
                        <span>1.6 kn drift velocity towards coastal perimeter (Active Dispersal)</span>
                      </div>
                      <div className="rep-factor-row">
                        <strong>3. Environmental Sensitivity:</strong>
                        <span>Coral habitats and ESI 10A mangrove inlets in forecast corridor</span>
                      </div>
                      <div className="rep-factor-row">
                        <strong>4. Coastal Exposure:</strong>
                        <span>22.4 km distance with T+18h potential coastal contact window</span>
                      </div>
                      <div className="rep-factor-row">
                        <strong>5. Detection Quality:</strong>
                        <span>92% Sentinel-1A SAR confidence with confirmed VV backscatter drop</span>
                      </div>
                      <div className="rep-factor-row">
                        <strong>6. Uncertainty Bounds:</strong>
                        <span>Controlled spatial margin (±1.2 km) and temporal window (±1.0 h)</span>
                      </div>
                    </div>

                    <div style={{ marginTop: 10, fontSize: '11px', color: 'var(--text-muted)' }}>
                      <strong>Why HIGH priority was assigned:</strong> The combination of large detected surface area (42.7 km²), near-shore trajectory (22.4 km), and sensitive coral/mangrove ecosystems in the path of the 72h forecast cone mandates Tier-2/Tier-3 response mobilization.
                    </div>
                  </div>
                </section>

                {/* 9. Model Uncertainty & Limitations */}
                <section className="rep-section">
                  <h3 className="rep-heading">9. Scientific Uncertainty &amp; Technical Limitations</h3>
                  <div className="rep-table-wrap">
                    <table className="rep-meta-table">
                      <tbody>
                        <tr>
                          <th>Drift Spatial Uncertainty</th>
                          <td>± 1.2 km boundary margin (OpenDrift hydrodynamic particle diffusion)</td>
                        </tr>
                        <tr>
                          <th>Temporal Origin Uncertainty</th>
                          <td>± 1.0 hour temporal release margin (02:00Z – 04:00Z estimated release window)</td>
                        </tr>
                        <tr>
                          <th>SAR Resolution &amp; Speckle</th>
                          <td>Sentinel-1 IW mode 20m spatial resolution with ±8.0% speckle intensity noise</td>
                        </tr>
                        <tr>
                          <th>Telemetry Limitation</th>
                          <td>AIS gaps can occur naturally from VHF range drop; does not establish deliberate disabling</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* 10. Data Sources */}
                <section className="rep-section">
                  <h3 className="rep-heading">10. Data Sources &amp; Ingestion Catalog</h3>
                  <ul style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <li><strong>SAR Imagery:</strong> Sentinel-1A C-SAR (Copernicus / ESA open hub access)</li>
                    <li><strong>Ocean Hydrodynamics:</strong> CMEMS Global Ocean Physics Analysis &amp; Forecast</li>
                    <li><strong>Atmospheric Wind:</strong> ECMWF ERA5 Reanalysis ($U_{10}$ 10m Neutral Wind)</li>
                    <li><strong>Vessel Telemetry:</strong> Coastal VHF Terrestrial &amp; Satellite AIS Stream (Simulated Demonstration)</li>
                  </ul>
                </section>

                {/* Concluding Attribution Disclaimer */}
                <div className="rep-final-disclaimer">
                  <p>
                    <strong>LEGAL DISCLAIMER:</strong> This report is an investigation-support output and does not constitute legal attribution.
                    All information provided herein is generated for decision support under SIH 2026 problem statement SIH26143.
                    Formal maritime enforcement actions require verified physical slick sampling, Port State Control inspections, and authenticated ship logbook reconciliation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Pane: Demo Evidence Ledger */}
        <div className="rep-right-pane no-print">
          <div className="rep-card">
            <div className="rep-card-header">
              <span className="rep-card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Hash size={14} color="var(--accent-cyan)" />
                DEMO EVIDENCE LEDGER
              </span>
              <span className="badge badge-warning" style={{ fontSize: '9px' }}>SIMULATED HASH</span>
            </div>

            <div className="rep-card-body" style={{ gap: 10 }}>
              <div
                style={{
                  background: 'rgba(229,160,32,0.08)',
                  border: '1px solid rgba(229,160,32,0.25)',
                  borderRadius: 'var(--radius-xs)',
                  padding: '8px 10px',
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.4,
                }}
              >
                <strong style={{ color: 'var(--status-warning)' }}>DEMO HASH · GENERATED LOCALLY</strong>
                <br />
                Hashes are generated for workstation demonstration only.
                <br />
                <span style={{ color: 'var(--text-muted)' }}>NOT CRYPTOGRAPHICALLY VERIFIED · NOT A LEGAL CHAIN-OF-CUSTODY</span>
              </div>

              {DEMO_LEDGER_ITEMS.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '10px',
                    background: 'var(--surface-base)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-xs)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                      {item.id}
                    </span>
                    <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--status-warning)', background: 'rgba(229,160,32,0.1)', padding: '1px 5px', borderRadius: 'var(--radius-xs)' }}>
                      SIMULATED DATA
                    </span>
                  </div>

                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {item.artifactType}
                  </div>

                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all', background: 'var(--surface-overlay)', padding: '4px 6px', borderRadius: 'var(--radius-xs)' }}>
                    SHA-256: {item.localHash}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)', marginTop: 2 }}>
                    <span>Source: {item.sourceSystem}</span>
                    <span>{item.timestamp}</span>
                  </div>

                  <div style={{ fontSize: '10px', color: 'var(--accent-cyan)', marginTop: 1 }}>
                    Quality: {item.dataQuality}
                  </div>
                </div>
              ))}

              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: 8,
                  lineHeight: 1.4,
                }}
              >
                In a full operational system, this ledger logs verification records across participating maritime authority nodes.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Status Strip */}
      <div className="rep-bottom-strip no-print">
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertTriangle size={13} color="var(--status-warning)" />
          <span>
            <strong>DEMO MODE · SIMULATED DATA</strong> — Generated reports and local demo ledger hashes are strictly designed for SIH26143 UI workstation evaluation.
          </span>
        </div>

        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          SIH26143 · INVESTIGATION SUPPORT DOSSIER
        </div>
      </div>
    </div>
  );
};
