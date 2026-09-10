/**
 * OceanIntel — Response Routes Screen
 *
 * Tactical oil spill containment & skimmer vessel deployment workstation.
 *
 * SCIENTIFIC INTEGRITY RULES:
 * - Status: PLANNED MODULE · DEMO ROUTE · SIMULATED
 * - Planned solvers: Risk-weighted A*, Dijkstra fallback, Environmental exclusion zones, Interception optimization
 * - Explicitly marks route metrics as simulated demonstration values rather than operational calculations.
 */

import React, { useState } from 'react';
import { Route, ShieldAlert, Navigation } from 'lucide-react';
import { ResponseMap, RESPONSE_ASSETS } from './ResponseMap';
import { DataStatusBadge } from '../../components/common/DataStatusBadge';
import './ResponseRoutes.css';

export const ResponseRoutes: React.FC = () => {
  const [selectedAssetId, setSelectedAssetId] = useState<string>('a1');
  const selectedAsset = RESPONSE_ASSETS.find((a) => a.id === selectedAssetId) ?? RESPONSE_ASSETS[0];

  return (
    <div className="resp-container" role="main" aria-label="OceanIntel Response Routes Workstation">
      {/* Top Toolbar */}
      <div className="resp-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Route size={18} color="var(--accent-cyan)" />
          <div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              Tactical Countermeasure &amp; Skimmer Vessel Routing
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Pathfinding &amp; Interception Optimization · SIH26143
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <DataStatusBadge status="PLANNED MODULE" />
          <DataStatusBadge status="SIMULATED DATA" />
        </div>
      </div>

      {/* Main Split Workspace */}
      <div className="resp-workspace">
        <ResponseMap
          selectedAssetId={selectedAssetId}
          onSelectAsset={setSelectedAssetId}
        />

        {/* Intelligence Panel */}
        <aside className="resp-intel-panel" aria-label="Response Routes Control Panel">
          <div className="resp-panel-header">
            <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
              RESPONSE ROUTING — PLANNED MODULE
            </span>
            <span className="badge badge-warning" style={{ fontSize: '9px' }}>DEMO ROUTE</span>
          </div>

          <div className="resp-panel-body">
            {/* Planned Algorithms Notice */}
            <div
              style={{
                background: 'rgba(6,182,212,0.08)',
                border: '1px solid rgba(6,182,212,0.25)',
                borderRadius: 'var(--radius-xs)',
                padding: '10px 12px',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                lineHeight: 1.45,
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Navigation size={13} />
                Planned Route Optimization Engine
              </div>
              <div>
                <strong>Planned Solvers: </strong>
                Risk-weighted A*, Dijkstra fallback, Environmental exclusion zones, Interception optimization.
              </div>
              <div style={{ marginTop: 4, color: 'var(--text-muted)' }}>
                <em>DEMO ROUTE · SIMULATED</em> — Displayed paths and transit ETAs are illustrative simulations, not operational calculations.
              </div>
            </div>

            {/* Selected Asset Hero */}
            <div className="resp-section">
              <div className="resp-section-header">
                <span className="resp-section-title">{selectedAsset.name}</span>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: '#2ece7a',
                    background: 'rgba(46,206,122,0.15)',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid rgba(46,206,122,0.3)',
                  }}
                >
                  {selectedAsset.status.toUpperCase()}
                </span>
              </div>
              <div className="resp-section-body">
                <div className="resp-kv">
                  <span className="resp-kv-label">Role / Asset Type</span>
                  <span className="resp-kv-val">{selectedAsset.type}</span>
                </div>
                <div className="resp-kv">
                  <span className="resp-kv-label">Interception ETA (Simulated)</span>
                  <span className="resp-kv-val" style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                    {selectedAsset.eta}
                  </span>
                </div>
                <div className="resp-kv">
                  <span className="resp-kv-label">Transit Speed</span>
                  <span className="resp-kv-val" style={{ fontFamily: 'var(--font-mono)' }}>
                    {selectedAsset.speed}
                  </span>
                </div>
                <div className="resp-kv">
                  <span className="resp-kv-label">Demonstration Distance</span>
                  <span className="resp-kv-val" style={{ fontFamily: 'var(--font-mono)' }}>
                    14.8 NM (27.4 km)
                  </span>
                </div>
                <div className="resp-kv">
                  <span className="resp-kv-label">Planned Pathfinding Solver</span>
                  <span className="resp-kv-val" style={{ color: 'var(--accent-cyan)', fontSize: '10px' }}>
                    Risk-Weighted A* / Dijkstra Fallback
                  </span>
                </div>
                <div className="resp-kv">
                  <span className="resp-kv-label">Simulated Cost Surface</span>
                  <span className="resp-kv-val" style={{ color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                    0.18 (Low Impedance Corridors)
                  </span>
                </div>
              </div>
            </div>

            {/* Response Countermeasure Inventory */}
            <div className="resp-section">
              <div className="resp-section-header">
                <span className="resp-section-title">Response Assets Inventory</span>
              </div>
              <div className="resp-section-body">
                {RESPONSE_ASSETS.map((asset) => (
                  <div
                    key={asset.id}
                    className="resp-kv"
                    style={{ cursor: 'pointer', opacity: asset.id === selectedAssetId ? 1 : 0.7 }}
                    onClick={() => setSelectedAssetId(asset.id)}
                  >
                    <span>{asset.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                      {asset.eta}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Skimming Operations Capacity */}
            <div className="resp-section">
              <div className="resp-section-header">
                <span className="resp-section-title">Simulated Containment Capacity</span>
              </div>
              <div className="resp-section-body">
                <div className="resp-kv">
                  <span className="resp-kv-label">Total Offshore Skimming Rate</span>
                  <span className="resp-kv-val" style={{ fontFamily: 'var(--font-mono)' }}>
                    450 m³/h (2,830 bbl/d)
                  </span>
                </div>
                <div className="resp-kv">
                  <span className="resp-kv-label">Containment Boom Deployed</span>
                  <span className="resp-kv-val" style={{ fontFamily: 'var(--font-mono)' }}>
                    3,500 meters (Heavy Duty Offshore)
                  </span>
                </div>
                <div className="resp-kv">
                  <span className="resp-kv-label">Temporary Storage Capacity</span>
                  <span className="resp-kv-val" style={{ fontFamily: 'var(--font-mono)' }}>
                    12,000 bbl (Storage Barge B-4)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom Disclaimer */}
      <div className="resp-bottom-strip" role="region" aria-label="Workstation disclaimer">
        <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ShieldAlert size={12} color="var(--status-warning)" />
          <span>
            <strong>RESPONSE ROUTING · PLANNED MODULE · DEMO ROUTE</strong> — Tactical routes and asset ETAs are simulated demonstration values. Real operations require dynamic AIS telemetry, real-time current grids, and vessel navigational clearances.
          </span>
        </div>
      </div>
    </div>
  );
};
