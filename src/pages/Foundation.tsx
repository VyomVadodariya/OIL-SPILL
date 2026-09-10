import React, { useState } from 'react';
import {
  Map, Ship, AlertTriangle, Activity, BarChart2,
  Settings, Bell, Search, Filter, Download, RefreshCw,
  Eye, Layers, Navigation, Wind, Droplets,
  FileText, Globe,
} from 'lucide-react';

import {
  Button, ButtonGroup,
  Badge, StatusDot,
  Input, Select, Textarea,
  Tabs, TabList, Tab, TabPanel,
  Tooltip,
  DataCard,
  Panel, PanelHeader, PanelBody, PanelSection, KVRow,
  Table, type ColumnDef,
  Modal, Drawer,
  TopBar, SideNav, type NavGroupConfig,
} from '../components';

import './Foundation.css';

/* ---- Mock vessel data ---- */
interface Vessel {
  id: string;
  mmsi: string;
  name: string;
  type: string;
  flag: string;
  status: string;
  lat: string;
  lon: string;
  speed: number;
  risk: string;
}

const VESSELS: Vessel[] = [
  { id: 'v1', mmsi: '538009842', name: 'HARBOR PIONEER', type: 'Oil Tanker', flag: 'MH', status: 'under-review', lat: '26.1520°N', lon: '51.8150°E', speed: 0.2, risk: 'High' },
  { id: 'v2', mmsi: '477213650', name: 'PACIFIC ENDEAVOR', type: 'Chemical Tanker', flag: 'HK', status: 'monitored', lat: '26.0950°N', lon: '51.7200°E', speed: 4.1, risk: 'Medium' },
  { id: 'v3', mmsi: '229109000', name: 'OCEAN SCOUT', type: 'Patrol Vessel', flag: 'MT', status: 'cleared', lat: '26.2200°N', lon: '51.8600°E', speed: 8.7, risk: 'None' },
  { id: 'v4', mmsi: '636019241', name: 'DELTA STAR', type: 'Oil Tanker', flag: 'LR', status: 'under-review', lat: '26.1850°N', lon: '51.7650°E', speed: 0.0, risk: 'Critical' },
  { id: 'v5', mmsi: '304010417', name: 'NORSE CARRIER', type: 'Bulk Carrier', flag: 'AG', status: 'monitored', lat: '26.0500°N', lon: '51.6800°E', speed: 6.3, risk: 'Low' },
];

const VESSEL_COLUMNS: ColumnDef<Vessel>[] = [
  { key: 'mmsi',  header: 'MMSI',        width: '110px', mono: true, sortable: true },
  { key: 'name',  header: 'Vessel Name', sortable: true },
  { key: 'type',  header: 'Type',        width: '140px' },
  { key: 'flag',  header: 'Flag',        width: '56px',  align: 'center' },
  { key: 'lat',   header: 'Latitude',    width: '110px', coord: true },
  { key: 'lon',   header: 'Longitude',   width: '110px', coord: true },
  { key: 'speed', header: 'Kts',         width: '64px',  align: 'right', mono: true, sortable: true },
  {
    key: 'risk',
    header: 'Risk',
    width: '90px',
    render: (row) => {
      const v = row.risk === 'Critical' ? 'critical'
              : row.risk === 'High'     ? 'critical'
              : row.risk === 'Medium'   ? 'warning'
              : row.risk === 'Low'      ? 'nominal'
              : 'inactive';
      return <Badge variant={v}>{row.risk}</Badge>;
    },
  },
  {
    key: 'status',
    header: 'Status',
    width: '100px',
    render: (row) => {
      const v = row.status === 'under-review' ? 'critical'
              : row.status === 'monitored'    ? 'warning'
              : 'nominal';
      return <StatusDot variant={v} label={row.status} pulse={row.status === 'under-review'} />;
    },
  },
];

/* ---- Nav config ---- */
const NAV_GROUPS: NavGroupConfig[] = [
  {
    id: 'main',
    label: 'Investigation',
    items: [
      { id: 'map',       label: 'Incident Map',    icon: <Map size={15} /> },
      { id: 'vessels',   label: 'Vessel Tracker',  icon: <Ship size={15} />, count: 3 },
      { id: 'alerts',    label: 'Alerts',          icon: <AlertTriangle size={15} />, count: 7 },
      { id: 'timeline',  label: 'Event Timeline',  icon: <Activity size={15} /> },
      { id: 'analysis',  label: 'Analysis',        icon: <BarChart2 size={15} /> },
    ],
  },
  {
    id: 'data',
    label: 'Data Sources',
    items: [
      { id: 'satellite', label: 'Satellite Imagery', icon: <Globe size={15} /> },
      { id: 'ais',       label: 'AIS Feed',          icon: <Navigation size={15} /> },
      { id: 'ocean',     label: 'Oceanographic',     icon: <Wind size={15} /> },
      { id: 'reports',   label: 'Reports',           icon: <FileText size={15} /> },
    ],
  },
  {
    id: 'admin',
    items: [
      { id: 'settings', label: 'Settings', icon: <Settings size={15} /> },
    ],
  },
];

/* ============================================================
   FOUNDATION SHOWCASE
   ============================================================ */

export const FoundationShowcase: React.FC = () => {
  const [activeNav, setActiveNav] = useState('vessels');
  const [selectedVessel, setSelectedVessel] = useState<string | null>('v1');
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [, setActiveTab] = useState('colors');

  // Simulated live timestamp
  const timestamp = '2026-09-08T18:30:00Z';

  return (
    <div className="showcase">
      {/* ---- Top Bar ---- */}
      <TopBar
        incidentName="INCIDENT-2026-047"
        incidentId="Arabian Gulf Spill"
        timestamp={timestamp}
        statusDot={<StatusDot variant="critical" label="ACTIVE INCIDENT" pulse />}
        actions={
          <>
            <Tooltip content="Refresh workstation state" placement="bottom">
              <Button variant="ghost" size="sm" iconOnly aria-label="Refresh workstation state">
                <RefreshCw size={14} />
              </Button>
            </Tooltip>
            <Button variant="ghost" size="sm" iconOnly aria-label="Notifications">
              <Bell size={14} />
            </Button>
            <div className="topbar-avatar" title="Analyst: J. Reeves">JR</div>
          </>
        }
      />

      <div className="showcase-body">
        {/* ---- Side Nav ---- */}
        <SideNav
          groups={NAV_GROUPS}
          activeItemId={activeNav}
          onItemClick={setActiveNav}
          collapsible
        />

        {/* ---- Main Content ---- */}
        <main className="showcase-main">

          {/* Page header */}
          <div>
            <div className="label-overline" style={{ marginBottom: 'var(--space-1)' }}>
              OceanIntel Foundation
            </div>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', letterSpacing: 'var(--tracking-tight)' }}>
              UI Component Library
            </h1>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
              All reusable components for the OceanIntel maritime intelligence workstation.
            </p>
          </div>

          {/* Navigation tabs for sections */}
          <Tabs defaultTab="colors" onChange={setActiveTab}>
            <TabList>
              <Tab id="colors">Design Tokens</Tab>
              <Tab id="buttons">Buttons &amp; Inputs</Tab>
              <Tab id="data">Data Components</Tab>
              <Tab id="overlays">Overlays</Tab>
            </TabList>

            {/* ==================== DESIGN TOKENS ==================== */}
            <TabPanel id="colors">
              <div className="showcase-main" style={{ padding: 0, gap: 'var(--space-8)' }}>

                {/* -- Color Palette -- */}
                <div className="showcase-section">
                  <div className="showcase-section-title">Surface Hierarchy</div>
                  <div className="showcase-grid-4" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
                    {[
                      { name: 'void',     hex: '#050810', var: '--surface-void' },
                      { name: 'base',     hex: '#080c14', var: '--surface-base' },
                      { name: 'raised',   hex: '#0d1520', var: '--surface-raised' },
                      { name: 'overlay',  hex: '#121e2e', var: '--surface-overlay' },
                      { name: 'elevated', hex: '#172332', var: '--surface-elevated' },
                      { name: 'tooltip',  hex: '#1e2e42', var: '--surface-tooltip' },
                    ].map(c => (
                      <div key={c.name} className="color-chip">
                        <div className="color-swatch" style={{ background: c.hex }} title={c.hex} />
                        <div className="color-label">{c.name}</div>
                        <div className="color-label" style={{ color: 'var(--text-muted)', fontSize: '9px' }}>{c.hex}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Accent Colors */}
                <div className="showcase-section">
                  <div className="showcase-section-title">Accent Colors</div>
                  <div className="showcase-grid-4" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
                    {[
                      { name: 'blue',       hex: '#2e7af0' },
                      { name: 'blue-dim',   hex: '#1a5dc2' },
                      { name: 'blue-hover', hex: '#4a8ff5' },
                      { name: 'cyan',       hex: '#00b4d8' },
                      { name: 'cyan-dim',   hex: '#007fa0' },
                      { name: 'cyan-hover', hex: '#00cef5' },
                    ].map(c => (
                      <div key={c.name} className="color-chip">
                        <div className="color-swatch" style={{ background: c.hex }} />
                        <div className="color-label">{c.name}</div>
                        <div className="color-label" style={{ color: 'var(--text-muted)', fontSize: '9px' }}>{c.hex}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Colors */}
                <div className="showcase-section">
                  <div className="showcase-section-title">Status / Severity</div>
                  <div className="showcase-grid-4" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                    {[
                      { name: 'Critical', hex: '#e8423a' },
                      { name: 'Warning',  hex: '#e5a020' },
                      { name: 'Caution',  hex: '#c8881a' },
                      { name: 'Nominal',  hex: '#2ece7a' },
                      { name: 'Inactive', hex: '#4a5e78' },
                    ].map(c => (
                      <div key={c.name} className="color-chip">
                        <div className="color-swatch" style={{ background: c.hex }} />
                        <div className="color-label">{c.name}</div>
                        <div className="color-label" style={{ color: 'var(--text-muted)', fontSize: '9px' }}>{c.hex}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Map Overlay Colors */}
                <div className="showcase-section">
                  <div className="showcase-section-title">Map Overlay Palette</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', padding: 'var(--space-4)', background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                    {[
                      { label: 'Spill Fill',        color: 'rgba(220, 50, 42, 0.55)' },
                      { label: 'Spill Stroke',       color: 'rgba(232, 66, 58, 0.90)' },
                      { label: 'Trajectory Active',  color: 'rgba(0, 180, 216, 0.65)' },
                      { label: 'Trajectory Past',    color: 'rgba(0, 100, 150, 0.45)' },
                      { label: 'Exclusion Zone',     color: 'rgba(229, 160, 32, 0.18)' },
                      { label: 'Exclusion Border',   color: 'rgba(229, 160, 32, 0.55)' },
                      { label: 'Impact Zone',        color: 'rgba(232, 66, 58, 0.12)' },
                      { label: 'Wind Arrows',        color: 'rgba(0, 180, 216, 0.70)' },
                      { label: 'Current Arrows',     color: 'rgba(46, 122, 240, 0.70)' },
                    ].map(m => (
                      <div key={m.label} className="map-swatch-row">
                        <div className="map-swatch" style={{ background: m.color, border: '1px solid var(--border-faint)' }} />
                        <span style={{ flex: 1 }}>{m.label}</span>
                        <span className="color-label">{m.color}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Typography */}
                <div className="showcase-section">
                  <div className="showcase-section-title">Typography Scale</div>
                  <div className="type-specimen">
                    {[
                      { label: '10px / 2xs', size: '10px', sample: 'MMSI 538009842 — coordinates, micro-labels' },
                      { label: '11px / xs',  size: '11px', sample: 'Table cell data, secondary metadata' },
                      { label: '12px / sm',  size: '12px', sample: 'Body text, button labels, form inputs' },
                      { label: '13px / base',size: '13px', sample: 'Default interface text' },
                      { label: '14px / md',  size: '14px', sample: 'Panel titles, section headers' },
                      { label: '16px / lg',  size: '16px', sample: 'Modal headings, prominent labels' },
                      { label: '22px / 2xl', size: '22px', sample: 'Metric values: 42.7 km²' },
                      { label: '28px / 3xl', size: '28px', sample: 'Dashboard KPI' },
                    ].map(t => (
                      <div key={t.label} style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-4)', borderBottom: '1px solid var(--border-faint)', paddingBottom: 'var(--space-2)' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', width: '80px', flexShrink: 0 }}>{t.label}</span>
                        <span style={{ fontSize: t.size, color: 'var(--text-primary)', lineHeight: 1.2 }}>{t.sample}</span>
                      </div>
                    ))}
                    {/* Mono specimen */}
                    <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-subtle)' }}>
                      <div className="label-overline" style={{ marginBottom: 'var(--space-2)' }}>JetBrains Mono — Data / Coordinates</div>
                      <span className="data-value-lg">28.4521°N  052.1834°E</span>
                      <div style={{ marginTop: 'var(--space-2)' }}>
                        <span className="coord-value">LAT 28.4521 · LON 052.1834 · ALT 0m · UTC+04:00</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </TabPanel>

            {/* ==================== BUTTONS & INPUTS ==================== */}
            <TabPanel id="buttons">
              <div className="showcase-main" style={{ padding: 0, gap: 'var(--space-8)' }}>

                {/* Buttons */}
                <div className="showcase-section">
                  <div className="showcase-section-title">Buttons — Variants</div>
                  <div className="showcase-row">
                    <Button variant="primary">Primary Action</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="danger">Danger</Button>
                  </div>

                  <div className="showcase-section-title" style={{ marginTop: 'var(--space-2)' }}>Buttons — Sizes</div>
                  <div className="showcase-row" style={{ alignItems: 'flex-end' }}>
                    <Button variant="primary" size="xs">XSmall</Button>
                    <Button variant="primary" size="sm">Small</Button>
                    <Button variant="primary" size="md">Medium</Button>
                    <Button variant="primary" size="lg">Large</Button>
                  </div>

                  <div className="showcase-section-title" style={{ marginTop: 'var(--space-2)' }}>Buttons — With Icons & States</div>
                  <div className="showcase-row">
                    <Button variant="primary" leftIcon={<Download size={13} />}>Export Report</Button>
                    <Button variant="secondary" leftIcon={<Filter size={13} />}>Filter</Button>
                    <Button variant="secondary" leftIcon={<RefreshCw size={13} />} loading>Refreshing...</Button>
                    <Button variant="secondary" disabled>Disabled</Button>
                    <Button variant="ghost" iconOnly aria-label="Settings"><Settings size={14} /></Button>
                    <Button variant="secondary" iconOnly aria-label="Search"><Search size={14} /></Button>
                  </div>

                  <div className="showcase-section-title" style={{ marginTop: 'var(--space-2)' }}>Button Group</div>
                  <div className="showcase-row">
                    <ButtonGroup>
                      <Button variant="secondary" size="sm">Satellite</Button>
                      <Button variant="secondary" size="sm">AIS</Button>
                      <Button variant="secondary" size="sm">Ocean</Button>
                    </ButtonGroup>
                    <ButtonGroup>
                      <Button variant="secondary" size="sm" leftIcon={<Eye size={12} />}>View</Button>
                      <Button variant="secondary" size="sm" leftIcon={<Layers size={12} />}>Layers</Button>
                      <Button variant="secondary" size="sm" leftIcon={<Download size={12} />}>Export</Button>
                    </ButtonGroup>
                  </div>
                </div>

                {/* Badges */}
                <div className="showcase-section">
                  <div className="showcase-section-title">Badges — Label</div>
                  <div className="showcase-row">
                    <Badge variant="critical">Critical</Badge>
                    <Badge variant="warning">Warning</Badge>
                    <Badge variant="nominal">Nominal</Badge>
                    <Badge variant="info">Info</Badge>
                    <Badge variant="inactive">Inactive</Badge>
                    <Badge variant="cyan">Demo Feed</Badge>
                    <Badge variant="default">Unknown</Badge>
                  </div>
                  <div className="showcase-row">
                    <Badge variant="critical" size="sm">Critical SM</Badge>
                    <Badge variant="warning" size="sm">Warning SM</Badge>
                    <Badge variant="nominal" size="lg">Nominal LG</Badge>
                  </div>

                  <div className="showcase-section-title" style={{ marginTop: 'var(--space-2)' }}>Status Dots</div>
                  <div className="showcase-row">
                    <StatusDot variant="critical" label="Candidate Under Review" pulse />
                    <StatusDot variant="warning" label="Under Monitoring" />
                    <StatusDot variant="nominal" label="Cleared" />
                    <StatusDot variant="info" label="Tracking" />
                    <StatusDot variant="inactive" label="Dark / Unknown" />
                    <StatusDot variant="cyan" label="AIS Telemetry" pulse />
                  </div>
                </div>

                {/* Inputs */}
                <div className="showcase-section">
                  <div className="showcase-section-title">Inputs</div>
                  <div className="showcase-grid-2">
                    <Input label="Vessel MMSI" placeholder="Enter 9-digit MMSI..." leftIcon={<Search size={13} />} />
                    <Input label="Search Vessels" placeholder="Name, IMO, flag..." leftIcon={<Ship size={13} />} />
                    <Input label="Start Date (UTC)" type="date" />
                    <Input label="Incident Coordinates" placeholder="28.4521°N, 52.1834°E" mono />
                    <Select label="Incident Status">
                      <option>Active Investigation</option>
                      <option>Under Review</option>
                      <option>Closed — Candidate Linked</option>
                      <option>Closed — Unlinked</option>
                    </Select>
                    <Input label="Error State" defaultValue="INVALID_MMSI" error="MMSI must be exactly 9 digits." />
                  </div>
                  <div>
                    <Textarea label="Intelligence Notes" placeholder="Enter analyst notes, evidence summary..." rows={3} />
                  </div>
                </div>

                {/* Tabs */}
                <div className="showcase-section">
                  <div className="showcase-section-title">Tabs — Underline Variant</div>
                  <Tabs defaultTab="ais">
                    <TabList>
                      <Tab id="ais" count={3}>AIS Data</Tab>
                      <Tab id="sat">Satellite Imagery</Tab>
                      <Tab id="ocean">Oceanographic</Tab>
                      <Tab id="reports">Intelligence Reports</Tab>
                    </TabList>
                    <TabPanel id="ais">
                      <div style={{ padding: 'var(--space-4)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                        AIS tracking data panel — vessel positions, speed, heading, and candidate correlation.
                      </div>
                    </TabPanel>
                    <TabPanel id="sat">
                      <div style={{ padding: 'var(--space-4)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                        Satellite imagery panel — SAR, optical, multispectral analysis.
                      </div>
                    </TabPanel>
                    <TabPanel id="ocean">
                      <div style={{ padding: 'var(--space-4)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                        Ocean current, wind, wave data for drift modelling.
                      </div>
                    </TabPanel>
                    <TabPanel id="reports">
                      <div style={{ padding: 'var(--space-4)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                        Intelligence reports, chain of custody, evidence logs.
                      </div>
                    </TabPanel>
                  </Tabs>

                  <div className="showcase-section-title" style={{ marginTop: 'var(--space-4)' }}>Tabs — Segment Variant</div>
                  <Tabs defaultTab="24h" variant="segment">
                    <TabList>
                      <Tab id="6h">6h</Tab>
                      <Tab id="24h">24h</Tab>
                      <Tab id="72h">72h</Tab>
                      <Tab id="7d">7d</Tab>
                      <Tab id="custom">Custom</Tab>
                    </TabList>
                    <TabPanel id="6h"><div style={{ padding: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>6-hour view</div></TabPanel>
                    <TabPanel id="24h"><div style={{ padding: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>24-hour view</div></TabPanel>
                    <TabPanel id="72h"><div style={{ padding: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>72-hour view</div></TabPanel>
                    <TabPanel id="7d"><div style={{ padding: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>7-day view</div></TabPanel>
                    <TabPanel id="custom"><div style={{ padding: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Custom range picker</div></TabPanel>
                  </Tabs>
                </div>

                {/* Tooltips */}
                <div className="showcase-section">
                  <div className="showcase-section-title">Tooltips</div>
                  <div className="showcase-row">
                    <Tooltip content="View full satellite image acquisition details" placement="top">
                      <Button variant="secondary" size="sm">Hover: Top</Button>
                    </Tooltip>
                    <Tooltip content="Re-run spill drift model with updated currents" placement="bottom">
                      <Button variant="secondary" size="sm">Hover: Bottom</Button>
                    </Tooltip>
                    <Tooltip content="MMSI: 538009842 · Flag: Marshall Islands · IMO: 9735982" placement="right">
                      <Button variant="outline" size="sm" leftIcon={<Ship size={13} />}>Vessel Info</Button>
                    </Tooltip>
                  </div>
                </div>

              </div>
            </TabPanel>

            {/* ==================== DATA COMPONENTS ==================== */}
            <TabPanel id="data">
              <div className="showcase-main" style={{ padding: 0, gap: 'var(--space-8)' }}>

                {/* DataCards */}
                <div className="showcase-section">
                  <div className="showcase-section-title">Data Cards — KPI Metrics</div>
                  <div className="showcase-grid-4">
                    <DataCard
                      label="Estimated Spill Volume"
                      value="4,820"
                      unit="bbl"
                      delta="+180 bbl since last estimate"
                      deltaDir="up"
                      severity="critical"
                      icon={<Droplets size={14} />}
                    />
                    <DataCard
                      label="Spill Surface Area"
                      value="42.7"
                      unit="km²"
                      delta="+2.1 km²"
                      deltaDir="up"
                      severity="critical"
                      icon={<Layers size={14} />}
                    />
                    <DataCard
                      label="Vessels of Interest"
                      value="3"
                      sublabel="Observed in exclusion zone"
                      severity="warning"
                      icon={<Ship size={14} />}
                    />
                    <DataCard
                      label="Wind Speed"
                      value="14.2"
                      unit="kts"
                      delta="NNW 328°"
                      deltaDir="flat"
                      severity="info"
                      icon={<Wind size={14} />}
                    />
                    <DataCard
                      label="AIS Coverage"
                      value="94"
                      unit="%"
                      delta="Normal range"
                      deltaDir="down"
                      severity="nominal"
                      compact
                    />
                    <DataCard
                      label="Satellite Passes"
                      value="6"
                      sublabel="Next: T+04:22"
                      severity="cyan"
                      compact
                    />
                    <DataCard
                      label="Evidence Items"
                      value="28"
                      sublabel="12 pending review"
                      compact
                    />
                    <DataCard
                      label="Drift Model ETA"
                      value="T+18h"
                      sublabel="Coastal impact zone"
                      severity="warning"
                      compact
                    />
                  </div>
                </div>

                {/* Panels */}
                <div className="showcase-section">
                  <div className="showcase-section-title">Panel — With Sections &amp; KV Rows</div>
                  <div className="showcase-grid-2">
                    <Panel>
                      <PanelHeader
                        title="HARBOR PIONEER"
                        subtitle="MMSI 538009842 · Flag MH"
                        icon={<Ship size={14} />}
                        actions={
                          <>
                            <Badge variant="critical">Under Review</Badge>
                            <Button variant="ghost" size="sm" iconOnly aria-label="More options">
                              <Settings size={12} />
                            </Button>
                          </>
                        }
                      />
                      <PanelBody>
                        <PanelSection label="Vessel Identity" collapsible defaultOpen>
                          <KVRow label="IMO Number" value="9735982" mono />
                          <KVRow label="Call Sign" value="V7BW4" mono />
                          <KVRow label="Type" value="Oil / Chemical Tanker" />
                          <KVRow label="Gross Tonnage" value="84,220 GT" />
                          <KVRow label="Flag State" value="Marshall Islands" />
                          <KVRow label="Owner" value="Pacific Maritime LLC" />
                        </PanelSection>
                        <PanelSection label="Last Known Position" collapsible>
                          <KVRow label="Latitude" value="28.4521°N" mono />
                          <KVRow label="Longitude" value="052.1834°E" mono />
                          <KVRow label="Speed" value="0.2 kts" mono />
                          <KVRow label="Heading" value="142°" mono />
                          <KVRow label="Last AIS" value="2026-09-08 14:22Z" mono />
                          <KVRow label="AIS Gap" value="4h 08m" />
                        </PanelSection>
                        <PanelSection label="Risk Assessment">
                          <KVRow label="Risk Level" value={<Badge variant="critical">HIGH</Badge>} />
                          <KVRow label="Investigation Score" value="87/100" mono />
                          <KVRow label="Analyst" value="J. Reeves" />
                        </PanelSection>
                      </PanelBody>
                    </Panel>

                    <Panel>
                      <PanelHeader title="Spill Characterization" icon={<Droplets size={14} />} />
                      <PanelBody>
                        <PanelSection label="Detection">
                          <KVRow label="First Detected" value="2026-09-07 06:12Z" mono />
                          <KVRow label="Source" value="Sentinel-1 SAR" />
                          <KVRow label="Quality Index" value="High (92/100)" mono />
                          <KVRow label="Detection Count" value="4 passes" />
                        </PanelSection>
                        <PanelSection label="Physical Parameters" collapsible>
                          <KVRow label="Surface Area" value="42.7 km²" mono />
                          <KVRow label="Est. Volume" value="4,820 bbl" mono />
                          <KVRow label="Est. Thickness" value="0.08–0.14 mm" mono />
                          <KVRow label="Weathering" value="35% (emulsified)" />
                          <KVRow label="Trajectory" value="NNW at 1.4 kts" />
                        </PanelSection>
                        <PanelSection label="Impact Forecast" collapsible>
                          <KVRow label="Coastal ETA" value="T+18h ± 3h" />
                          <KVRow label="Shore Type" value="Mangrove / Sandy" />
                          <KVRow label="Protected Area" value={<Badge variant="critical">YES</Badge>} />
                          <KVRow label="Fisheries Zone" value={<Badge variant="warning">ADJACENT</Badge>} />
                        </PanelSection>
                      </PanelBody>
                      <div className="panel-footer" style={{ padding: 'var(--space-3) var(--space-4)', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 'var(--space-2)' }}>
                        <Button variant="secondary" size="sm" leftIcon={<Download size={12} />}>Export Data</Button>
                        <Button variant="primary" size="sm">Run Drift Model</Button>
                      </div>
                    </Panel>
                  </div>
                </div>

                {/* Table */}
                <div className="showcase-section">
                  <div className="showcase-section-title">Table — Vessel Tracker</div>
                  <Panel>
                    <PanelHeader
                      title="Vessels of Interest"
                      subtitle="Arabian Gulf · 48h window"
                      icon={<Ship size={14} />}
                      actions={
                        <>
                          <span className="table-count">{VESSELS.length} vessels</span>
                          <Button variant="ghost" size="sm" iconOnly aria-label="Filter"><Filter size={13} /></Button>
                          <Button variant="ghost" size="sm" iconOnly aria-label="Download"><Download size={13} /></Button>
                        </>
                      }
                    />
                    <Table<Vessel>
                      columns={VESSEL_COLUMNS}
                      data={VESSELS}
                      rowKey="id"
                      selectedRowKey={selectedVessel}
                      onRowClick={v => setSelectedVessel(v.id === selectedVessel ? null : v.id)}
                      getRowSeverity={row =>
                        row.risk === 'Critical' ? 'critical'
                        : row.risk === 'High' ? 'critical'
                        : row.risk === 'Medium' ? 'warning'
                        : row.status === 'cleared' ? 'nominal'
                        : 'none'
                      }
                      maxHeight="260px"
                    />
                  </Panel>
                </div>

              </div>
            </TabPanel>

            {/* ==================== OVERLAYS ==================== */}
            <TabPanel id="overlays">
              <div className="showcase-main" style={{ padding: 0, gap: 'var(--space-8)' }}>

                <div className="showcase-section">
                  <div className="showcase-section-title">Modal</div>
                  <div className="showcase-row">
                    <Button variant="primary" onClick={() => setModalOpen(true)}>
                      Open Vessel Detail Modal
                    </Button>
                  </div>
                </div>

                <div className="showcase-section">
                  <div className="showcase-section-title">Drawer</div>
                  <div className="showcase-row">
                    <Button variant="secondary" onClick={() => setDrawerOpen(true)} leftIcon={<FileText size={13} />}>
                      Open Evidence Drawer
                    </Button>
                  </div>
                </div>

              </div>
            </TabPanel>

          </Tabs>

        </main>
      </div>

      {/* ---- Modal ---- */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Vessel Detail — HARBOR PIONEER"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Dismiss</Button>
            <Button variant="danger" leftIcon={<AlertTriangle size={13} />}>Flag for Detailed Review</Button>
            <Button variant="primary" leftIcon={<FileText size={13} />}>Generate Investigation Report</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Badge variant="critical">High Risk</Badge>
            <StatusDot variant="critical" label="AIS Signal Lost — 4h 08m ago" pulse />
          </div>

          <div className="showcase-grid-4" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
            <DataCard label="Investigation Score" value="87" unit="/100" severity="critical" compact />
            <DataCard label="AIS Gap Duration" value="4h 08m" severity="warning" compact />
            <DataCard label="Distance to Spill" value="0.8" unit="nm" severity="critical" compact />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div>
              <div className="panel-section-label" style={{ marginBottom: 'var(--space-2)' }}>Vessel Identity</div>
              <KVRow label="MMSI" value="538009842" mono />
              <KVRow label="IMO" value="9735982" mono />
              <KVRow label="Name" value="HARBOR PIONEER" />
              <KVRow label="Type" value="Oil Tanker" />
              <KVRow label="Flag" value="Marshall Islands" />
            </div>
            <div>
              <div className="panel-section-label" style={{ marginBottom: 'var(--space-2)' }}>Last Position</div>
              <KVRow label="Lat" value="28.4521°N" mono />
              <KVRow label="Lon" value="052.1834°E" mono />
              <KVRow label="Speed" value="0.2 kts" mono />
              <KVRow label="Heading" value="142°" mono />
              <KVRow label="Timestamp" value="2026-09-08 14:22Z" mono />
            </div>
          </div>

          <div>
            <div className="panel-section-label" style={{ marginBottom: 'var(--space-2)' }}>Analyst Notes</div>
            <Textarea
              defaultValue="Vessel was observed stationary in the vicinity of the spill for approximately 6 hours before AIS signal was lost. Cargo manifest indicates crude oil. Owner communications pending."
              rows={3}
            />
          </div>
        </div>
      </Modal>

      {/* ---- Drawer ---- */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Evidence Log — INC-2026-047"
        size="md"
        side="right"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDrawerOpen(false)}>Close</Button>
            <Button variant="primary" leftIcon={<Download size={13} />}>Export Chain of Custody</Button>
          </>
        }
      >
        <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {[
            { id: 'E-001', type: 'SAR Image', source: 'Sentinel-1A', ts: '2026-09-07 06:12Z', status: 'ingested', note: 'Primary spill detection. Dark patch 42.7 km².' },
            { id: 'E-002', type: 'AIS Record', source: 'MarineTraffic', ts: '2026-09-07 05:50Z', status: 'ingested', note: 'HARBOR PIONEER last transmitted position 0.8 nm from spill centroid.' },
            { id: 'E-003', type: 'Optical Image', source: 'Planet Labs', ts: '2026-09-07 08:34Z', status: 'pending', note: 'Cloud cover 35%. Partial visibility of northern spill edge.' },
            { id: 'E-004', type: 'AIS Gap Log', source: 'System', ts: '2026-09-07 10:00Z', status: 'ingested', note: 'MMSI 538009842 — 4h 08m signal gap coinciding with spill window.' },
            { id: 'E-005', type: 'Weather Report', source: 'ECMWF', ts: '2026-09-07 00:00Z', status: 'ingested', note: 'Wind NNW 14 kts, current 1.4 kts — consistent with drift direction.' },
          ].map(ev => (
            <div key={ev.id} style={{ padding: 'var(--space-3)', background: 'var(--surface-overlay)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1-5)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', color: 'var(--text-cyan)' }}>{ev.id}</span>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-primary)' }}>{ev.type}</span>
                </div>
                <Badge variant={ev.status === 'ingested' ? 'nominal' : 'warning'}>
                  {ev.status}
                </Badge>
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
                {ev.source} · <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{ev.ts}</span>
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-snug)' }}>
                {ev.note}
              </div>
            </div>
          ))}
        </div>
      </Drawer>
    </div>
  );
};
