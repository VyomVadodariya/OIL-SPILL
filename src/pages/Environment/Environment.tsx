/**
 * OceanIntel — Environment Screen
 *
 * Ecological risk & coastal exposure assessment workstation.
 * Evaluates marine protected zones, mangrove reserves, and shoreline vulnerability.
 *
 * SCIENTIFIC INTEGRITY RULES:
 * - Clearly separate: OBSERVED DATA, MODELED DATA, SIMULATED DATA
 * - Use POTENTIAL EXPOSURE (never "guaranteed impact")
 * - DEMO MODE · SIMULATED DATA
 */

import React, { useState } from 'react';
import { Wind, ShieldAlert, AlertTriangle, Layers, Eye, Compass, Waves } from 'lucide-react';
import { EnvironmentMap, SENSITIVE_ZONES } from './EnvironmentMap';
import { DataStatusBadge } from '../../components/common/DataStatusBadge';
import './Environment.css';

export const Environment: React.FC = () => {
  const [selectedZoneId, setSelectedZoneId] = useState<string>('z-mangrove');
  const [showExposureCone, setShowExposureCone] = useState<boolean>(true);
  const [activeDataCategory, setActiveDataCategory] = useState<'all' | 'observed' | 'modeled' | 'simulated'>('all');

  const selectedZone = SENSITIVE_ZONES.find((z) => z.id === selectedZoneId) ?? SENSITIVE_ZONES[0];

  return (
    <div className="env-container" role="main" aria-label="OceanIntel Environmental Impact Workstation">
      {/* Top Toolbar */}
      <div className="env-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Wind size={18} color="var(--accent-cyan)" />
          <div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              Environmental Risk &amp; Ecological Exposure Assessment
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Ecological Sensitivity &amp; Shoreline Vulnerability (ESI) · SIH26143
            </div>
          </div>
          <button
            className={`btn btn-xs ${showExposureCone ? 'btn-secondary' : 'btn-ghost'}`}
            style={{ marginLeft: 8 }}
            onClick={() => setShowExposureCone((c) => !c)}
          >
            <Layers size={11} style={{ marginRight: 4 }} />
            {showExposureCone ? 'Hide 72h Potential Exposure Cone' : 'Show 72h Potential Exposure Cone'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <DataStatusBadge status="DEMO MODE · SIMULATED DATA" />
        </div>
      </div>

      {/* Main Split */}
      <div className="env-workspace">
        <EnvironmentMap
          selectedZoneId={selectedZoneId}
          onSelectZone={setSelectedZoneId}
          showExposureCone={showExposureCone}
        />

        {/* Intelligence Panel */}
        <aside className="env-intel-panel" aria-label="Environmental Intelligence Panel">
          <div className="env-panel-header">
            <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
              Ecological &amp; Oceanographic Intelligence
            </span>
            <span className="badge badge-warning" style={{ fontSize: '9px' }}>POTENTIAL EXPOSURE</span>
          </div>

          <div className="env-panel-body">
            {/* Scientific Data Category Filter Bar */}
            <div style={{ display: 'flex', gap: 4, background: 'var(--surface-base)', padding: 3, borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
              <button
                className={`btn btn-xs ${activeDataCategory === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ flex: 1, fontSize: '10px' }}
                onClick={() => setActiveDataCategory('all')}
              >
                All Data
              </button>
              <button
                className={`btn btn-xs ${activeDataCategory === 'observed' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ flex: 1, fontSize: '10px' }}
                onClick={() => setActiveDataCategory('observed')}
              >
                Observed
              </button>
              <button
                className={`btn btn-xs ${activeDataCategory === 'modeled' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ flex: 1, fontSize: '10px' }}
                onClick={() => setActiveDataCategory('modeled')}
              >
                Modeled
              </button>
              <button
                className={`btn btn-xs ${activeDataCategory === 'simulated' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ flex: 1, fontSize: '10px' }}
                onClick={() => setActiveDataCategory('simulated')}
              >
                Simulated
              </button>
            </div>

            {/* 1. OBSERVED DATA */}
            {(activeDataCategory === 'all' || activeDataCategory === 'observed') && (
              <div className="env-section">
                <div className="env-section-header">
                  <span className="env-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Eye size={12} color="#10b981" />
                    OBSERVED DATA
                  </span>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.12)', padding: '1px 5px', borderRadius: 'var(--radius-xs)' }}>
                    IN-SITU / SATELLITE
                  </span>
                </div>
                <div className="env-section-body">
                  <div className="env-kv">
                    <span className="env-kv-label">Sea Surface Temperature</span>
                    <span className="env-kv-val" style={{ fontFamily: 'var(--font-mono)' }}>31.4 °C (MODIS / In-situ)</span>
                  </div>
                  <div className="env-kv">
                    <span className="env-kv-label">Surface Water Salinity</span>
                    <span className="env-kv-val" style={{ fontFamily: 'var(--font-mono)' }}>39.2 PSU (Persian Gulf Basin)</span>
                  </div>
                  <div className="env-kv">
                    <span className="env-kv-label">Observed Sea State</span>
                    <span className="env-kv-val">Beaufort 3 (Gentle breeze, 0.6m swell)</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. MODELED DATA */}
            {(activeDataCategory === 'all' || activeDataCategory === 'modeled') && (
              <div className="env-section">
                <div className="env-section-header">
                  <span className="env-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Compass size={12} color="var(--accent-cyan)" />
                    MODELED DATA
                  </span>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--accent-cyan)', background: 'rgba(6,182,212,0.12)', padding: '1px 5px', borderRadius: 'var(--radius-xs)' }}>
                    CMEMS / ECMWF
                  </span>
                </div>
                <div className="env-section-body">
                  <div className="env-kv">
                    <span className="env-kv-label">Surface Current Velocity</span>
                    <span className="env-kv-val" style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                      1.4 kn @ 148° (SSE)
                    </span>
                  </div>
                  <div className="env-kv">
                    <span className="env-kv-label">ERA5 10m Neutral Wind</span>
                    <span className="env-kv-val" style={{ color: '#e5a020', fontFamily: 'var(--font-mono)' }}>
                      14.2 kn @ 328° (NNW)
                    </span>
                  </div>
                  <div className="env-kv">
                    <span className="env-kv-label">Stokes Wave Drift</span>
                    <span className="env-kv-val" style={{ fontFamily: 'var(--font-mono)' }}>0.3 kn @ 335°</span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. SIMULATED DATA */}
            {(activeDataCategory === 'all' || activeDataCategory === 'simulated') && (
              <>
                <div className="env-section">
                  <div className="env-section-header">
                    <span className="env-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Waves size={12} color="#e5a020" />
                      SIMULATED DATA (POTENTIAL EXPOSURE)
                    </span>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#e5a020', background: 'rgba(229,160,32,0.12)', padding: '1px 5px', borderRadius: 'var(--radius-xs)' }}>
                      SIMULATION CONE
                    </span>
                  </div>
                  <div className="env-section-body">
                    {/* Selected Zone Card */}
                    <div style={{ background: 'var(--surface-base)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xs)', padding: '10px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{selectedZone.name}</strong>
                        <span style={{ fontSize: '9px', fontWeight: 700, fontFamily: 'var(--font-mono)', padding: '1px 6px', borderRadius: 'var(--radius-xs)', background: selectedZone.color + '22', color: selectedZone.color, border: `1px solid ${selectedZone.color}66` }}>
                          {selectedZone.sensitivity.toUpperCase()} SENSITIVITY
                        </span>
                      </div>
                      <div className="env-kv">
                        <span className="env-kv-label">Distance to Spill Centroid</span>
                        <span className="env-kv-val" style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>{selectedZone.distToSpill}</span>
                      </div>
                      <div className="env-kv">
                        <span className="env-kv-label">Potential Exposure ETA</span>
                        <span className="env-kv-val" style={{ color: '#e8423a', fontFamily: 'var(--font-mono)' }}>{selectedZone.etaExposure}</span>
                      </div>
                      <div className="env-kv">
                        <span className="env-kv-label">Habitat Type</span>
                        <span className="env-kv-val">{selectedZone.type.toUpperCase()}</span>
                      </div>
                      <div className="env-kv">
                        <span className="env-kv-label">Shoreline Environmental Sensitivity</span>
                        <span className="env-kv-val" style={{ fontFamily: 'var(--font-mono)' }}>ESI 10A (Sheltered Mangrove / Intertidal)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sensitive Habitats Inventory */}
                <div className="env-section">
                  <div className="env-section-header">
                    <span className="env-section-title">Sensitive Ecosystems Inventory</span>
                  </div>
                  <div className="env-section-body">
                    {SENSITIVE_ZONES.map((z) => (
                      <div
                        key={z.id}
                        className="env-kv"
                        style={{ cursor: 'pointer', opacity: z.id === selectedZoneId ? 1 : 0.7 }}
                        onClick={() => setSelectedZoneId(z.id)}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: z.color }} />
                          {z.name}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {z.distToSpill}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Potential Exposure Notice */}
                <div
                  style={{
                    background: 'rgba(232,66,58,0.08)',
                    border: '1px solid rgba(232,66,58,0.25)',
                    borderRadius: 'var(--radius-xs)',
                    padding: '10px 12px',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.45,
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#e8423a', marginBottom: 2 }}>
                    <AlertTriangle size={12} style={{ display: 'inline', marginRight: 4 }} />
                    Potential Exposure Advisory:
                  </div>
                  Modelled 72h trajectory indicates <strong>potential exposure</strong> to Ras Laffan Coastal &amp; Coral Reserve and Halul Shoal habitat.
                  Pre-emptive containment boom deployment recommended at coastal inlet baselines.
                  Exposure is subject to hydrodynamic variance; no guaranteed shoreline impact is claimed.
                </div>
              </>
            )}
          </div>
        </aside>
      </div>

      {/* Bottom Disclaimer */}
      <div className="env-bottom-strip">
        <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ShieldAlert size={12} color="var(--status-warning)" />
          <span>
            <strong>ENVIRONMENT · DEMO MODE · SIMULATED DATA</strong> — Environmental vulnerability indices and potential exposure timings are simulated for workstation demonstration.
          </span>
        </div>
      </div>
    </div>
  );
};
