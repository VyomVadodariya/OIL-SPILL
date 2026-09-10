import React, { useState } from 'react';
import {
  // COMMAND
  LayoutDashboard,
  FolderSearch,
  // ANALYSIS
  Satellite,
  Droplets,
  Radio,
  Ship,
  FileSearch,
  History,
  // PREDICTION
  Wind,
  Waves,
  Cpu,
  // RESPONSE
  Route,
  FileText,
  // UI
  ChevronLeft,
  ChevronRight,
  Bell,
  Settings,
  RefreshCw,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './Sidebar.css';

/* ============================================================
   NAV STRUCTURE
   ============================================================ */

export type NavItemId =
  | 'command-center'
  | 'investigations'
  | 'sar-detection'
  | 'spill-intelligence'
  | 'ais-intelligence'
  | 'vessel-candidates'
  | 'evidence'
  | 'historical-intelligence'
  | 'drift'
  | 'model-evaluation'
  | 'environment'
  | 'routes'
  | 'reports';

interface NavItem {
  id: NavItemId;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'command',
    label: 'Command',
    items: [
      { id: 'command-center',  label: 'Command Center',   icon: <LayoutDashboard size={15} /> },
      { id: 'investigations',  label: 'Investigations',   icon: <FolderSearch size={15} />, badge: 2 },
    ],
  },
  {
    id: 'analysis',
    label: 'Analysis',
    items: [
      { id: 'sar-detection',         label: 'SAR Detection',           icon: <Satellite size={15} />, badge: 1 },
      { id: 'spill-intelligence',      label: 'Spill Intelligence',      icon: <Droplets size={15} /> },
      { id: 'ais-intelligence',        label: 'AIS Intelligence',        icon: <Radio size={15} /> },
      { id: 'vessel-candidates',       label: 'Vessel Candidates',       icon: <Ship size={15} />, badge: 3 },
      { id: 'evidence',              label: 'Evidence',                icon: <FileSearch size={15} /> },
      { id: 'historical-intelligence',label: 'Historical Intelligence', icon: <History size={15} /> },
    ],
  },
  {
    id: 'prediction',
    label: 'Prediction',
    items: [
      { id: 'drift',            label: 'Drift Modelling',  icon: <Waves size={15} /> },
      { id: 'model-evaluation', label: 'Model Evaluation', icon: <Cpu size={15} /> },
      { id: 'environment',      label: 'Environment',      icon: <Wind size={15} /> },
    ],
  },
  {
    id: 'response',
    label: 'Response',
    items: [
      { id: 'routes',  label: 'Response Routes',  icon: <Route size={15} /> },
      { id: 'reports', label: 'Reports',          icon: <FileText size={15} /> },
    ],
  },
];

/* ============================================================
   SIDEBAR COMPONENT
   ============================================================ */

interface SidebarProps {
  activeId: NavItemId;
  onNavigate: (id: NavItemId) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeId, onNavigate }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}
      aria-label="Application navigation"
    >
      {/* ---- Identity Header ---- */}
      <div className="sidebar-header">
        <div className="sidebar-logo-mark" aria-hidden="true" title="OceanIntel — See | Trace | Understand">
          <img
            src="/oceanintel-logo.png"
            alt="OceanIntel Emblem"
            className="sidebar-logo-img"
          />
        </div>
      </div>

      {/* ---- Navigation Groups ---- */}
      <nav className="sidebar-nav" aria-label="Main menu">
        {NAV_GROUPS.map(group => (
          <div key={group.id} className="nav-group" role="group" aria-label={group.label}>
            <div className="nav-group-label" aria-hidden="true">{group.label}</div>

            {group.items.map(item => (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                className={`nav-item ${activeId === item.id ? 'nav-item-active' : ''}`}
                onClick={() => onNavigate(item.id)}
                aria-current={activeId === item.id ? 'page' : undefined}
                /* CSS tooltip when collapsed */
                data-tooltip={collapsed ? item.label : undefined}
                title={collapsed ? item.label : undefined}
              >
                <span className="nav-item-icon" aria-hidden="true">{item.icon}</span>
                <span className="nav-item-label">{item.label}</span>
                {item.badge != null && item.badge > 0 && (
                  <span className="nav-item-badge" aria-label={`${item.badge} alerts`}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* ---- Footer ---- */}
      <div className="sidebar-footer">
        {/* DEMO MODE badge */}
        <div className="sidebar-demo-badge" title="Running on simulated data — not a live system">
          <div className="sidebar-demo-dot" aria-hidden="true" />
          <div className="sidebar-demo-text">
            <span className="sidebar-demo-label">Demo Mode</span>
            <span className="sidebar-demo-sublabel">Simulated Data</span>
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed(c => !c)}
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          {collapsed
            ? <ChevronRight size={14} aria-hidden="true" />
            : <ChevronLeft  size={14} aria-hidden="true" />}
        </button>
      </div>
    </aside>
  );
};

/* ============================================================
   TOP BAR — Persistent header strip
   ============================================================ */

interface TopBarProps {
  activeId: NavItemId;
  currentTime?: string;
  utcTime?: string;
}

/* Human-readable page names for breadcrumb */
const PAGE_LABELS: Record<NavItemId, string> = {
  'command-center':          'Command Center',
  'investigations':          'Investigations',
  'sar-detection':           'SAR Detection',
  'spill-intelligence':      'Spill Intelligence',
  'ais-intelligence':        'AIS Intelligence',
  'vessel-candidates':       'Vessel Candidates',
  'evidence':                'Evidence',
  'historical-intelligence': 'Historical Intelligence',
  'drift':                   'Drift Modelling',
  'model-evaluation':        'Model Evaluation',
  'environment':             'Environment',
  'routes':                  'Response Routes',
  'reports':                 'Reports',
};

const SECTION_LABELS: Record<NavItemId, string> = {
  'command-center':          'Command',
  'investigations':          'Command',
  'sar-detection':           'Analysis',
  'spill-intelligence':      'Analysis',
  'ais-intelligence':        'Analysis',
  'vessel-candidates':       'Analysis',
  'evidence':                'Analysis',
  'historical-intelligence': 'Analysis',
  'drift':                   'Prediction',
  'model-evaluation':        'Prediction',
  'environment':             'Prediction',
  'routes':                  'Response',
  'reports':                 'Response',
};

export const TopBar: React.FC<TopBarProps> = ({ activeId, currentTime, utcTime }) => {
  const { theme, toggleTheme } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const displayTime = currentTime || utcTime || '';

  const handleRefresh = () => {
    setIsRefreshing(true);
    setStatusNotice('REFRESH WORKSTATION STATE: Local demo state reset');
    setTimeout(() => {
      setIsRefreshing(false);
      setTimeout(() => setStatusNotice(null), 3000);
    }, 600);
  };

  return (
    <header className="topbar" role="banner" style={{ position: 'relative' }}>
      <div className="topbar-left">
        {/* Breadcrumb */}
        <nav className="topbar-breadcrumb" aria-label="Breadcrumb">
          <span>{SECTION_LABELS[activeId]}</span>
          <span aria-hidden="true" style={{ opacity: 0.35 }}>/</span>
          <span className="topbar-breadcrumb-active">{PAGE_LABELS[activeId]}</span>
        </nav>

        {statusNotice && (
          <span
            style={{
              fontSize: '11px',
              color: 'var(--accent-cyan)',
              marginLeft: 16,
              fontFamily: 'var(--font-mono)',
            }}
          >
            ✓ {statusNotice}
          </span>
        )}
      </div>

      <div className="topbar-right">
        {/* Persistent Demo Mode Indicator */}
        <span
          className="badge badge-warning"
          style={{
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            letterSpacing: '0.04em',
            padding: '3px 8px',
          }}
          title="Workstation operating on simulated demonstration data for SIH 2026"
        >
          DEMO MODE · SIMULATED DATA
        </span>

        {/* Live Operational Clock (Indian Standard Time · IST · UTC+05:30) */}
        <span
          className="topbar-timestamp"
          title="Current Live Time (Indian Standard Time · IST · UTC+05:30)"
        >
          {displayTime}
        </span>

        <div className="topbar-divider" aria-hidden="true" />

        {/* Theme Toggle Button (Light / Dark Mode) */}
        <button
          id="theme-toggle-btn"
          className="btn btn-ghost btn-sm"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 8px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            letterSpacing: '0.04em',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-xs)',
            background: 'var(--surface-elevated)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
          onClick={toggleTheme}
          title={`Active Theme: ${theme.toUpperCase()} MODE. Click to switch to ${theme === 'dark' ? 'LIGHT' : 'DARK'} MODE.`}
          aria-label={`Toggle theme (currently ${theme})`}
        >
          {theme === 'dark' ? (
            <>
              <Sun size={13} style={{ color: '#fbbf24' }} aria-hidden="true" />
              <span>DARK</span>
            </>
          ) : (
            <>
              <Moon size={13} style={{ color: 'var(--accent-blue)' }} aria-hidden="true" />
              <span>LIGHT</span>
            </>
          )}
        </button>

        {/* Actions */}
        <button
          className="btn btn-ghost btn-sm btn-icon"
          aria-label="REFRESH WORKSTATION STATE"
          title="REFRESH WORKSTATION STATE (Demo mode)"
          onClick={handleRefresh}
        >
          <RefreshCw
            size={13}
            aria-hidden="true"
            style={{
              transform: isRefreshing ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.4s ease',
            }}
          />
        </button>

        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-ghost btn-sm btn-icon"
            aria-label="Notifications"
            title="System notifications"
            onClick={() => {
              setShowNotifications((n) => !n);
              setShowSettings(false);
            }}
            aria-expanded={showNotifications}
          >
            <Bell size={13} aria-hidden="true" />
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 5,
                right: 5,
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: 'var(--status-critical)',
                border: '1px solid var(--surface-raised)',
              }}
            />
          </button>

          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 6,
                width: 320,
                background: 'var(--surface-raised)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                padding: '12px',
                zIndex: 100,
                fontSize: '11px',
              }}
              role="dialog"
              aria-label="Notifications"
            >
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span>NOTIFICATIONS (SIMULATED)</span>
                <span className="badge badge-warning" style={{ fontSize: '8px' }}>DEMO</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ background: 'var(--surface-base)', padding: '6px 8px', borderRadius: 'var(--radius-xs)' }}>
                  <div style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>Sentinel-1A SAR Pass Ingested</div>
                  <div style={{ color: 'var(--text-muted)' }}>42.7 km² surface backscatter anomaly detected at 06:12:04 UTC.</div>
                </div>
                <div style={{ background: 'var(--surface-base)', padding: '6px 8px', borderRadius: 'var(--radius-xs)' }}>
                  <div style={{ color: '#e8423a', fontWeight: 600 }}>AIS Observation Gap Flagged</div>
                  <div style={{ color: 'var(--text-muted)' }}>HARBOR PIONEER transmission gap (4h 08m) coincides with release window.</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-ghost btn-sm btn-icon"
            aria-label="Settings"
            title="Workstation settings"
            onClick={() => {
              setShowSettings((s) => !s);
              setShowNotifications(false);
            }}
            aria-expanded={showSettings}
          >
            <Settings size={13} aria-hidden="true" />
          </button>

          {showSettings && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 6,
                width: 300,
                background: 'var(--surface-raised)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                padding: '12px',
                zIndex: 100,
                fontSize: '11px',
              }}
              role="dialog"
              aria-label="Settings"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
                <img
                  src="/oceanintel-logo.png"
                  alt="OceanIntel Emblem"
                  style={{
                    width: 38,
                    height: 38,
                    objectFit: 'contain',
                    background: '#ffffff',
                    borderRadius: 'var(--radius-xs)',
                    padding: 2,
                    border: '1px solid var(--border-subtle)',
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
                    OCEANINTEL WORKSTATION
                  </div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                    SEE · TRACE · UNDERSTAND · SIH26143
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--text-secondary)' }}>
                <div><strong>Station:</strong> Demonstration Station</div>
                <div><strong>Telemetry Stream:</strong> Local Simulated Cache</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div><strong>Theme:</strong> {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</div>
                  <button
                    onClick={toggleTheme}
                    style={{
                      padding: '3px 8px',
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--border-default)',
                      background: 'var(--surface-elevated)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    Switch to {theme === 'dark' ? 'Light' : 'Dark'}
                  </button>
                </div>
                <div><strong>Map Engine:</strong> MapLibre GL v4</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 4, borderTop: '1px solid var(--border-faint)', paddingTop: 4 }}>
                  OceanIntel Workstation · SIH26143
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="topbar-divider" aria-hidden="true" />

        {/* User avatar */}
        <div className="topbar-avatar" role="button" tabIndex={0} title="Operator: Demonstration Station">
          OP
        </div>
      </div>
    </header>
  );
};

/* ============================================================
   APP SHELL — Root layout wrapper
   ============================================================ */

interface AppShellProps {
  activeId: NavItemId;
  onNavigate: (id: NavItemId) => void;
  currentTime?: string;
  utcTime?: string;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeId,
  onNavigate,
  currentTime,
  utcTime,
  children,
}) => (
  <div className="app-shell">
    <div className="app-shell-body">
      <Sidebar activeId={activeId} onNavigate={onNavigate} />
      <div className="app-shell-content">
        <TopBar activeId={activeId} currentTime={currentTime} utcTime={utcTime} />
        {children}
      </div>
    </div>
  </div>
);
