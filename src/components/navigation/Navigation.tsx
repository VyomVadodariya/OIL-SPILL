import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Navigation.css';

/* ============================================================
   TOP BAR
   ============================================================ */

interface TopBarProps {
  incidentName?: string;
  incidentId?: string;
  timestamp?: string;
  statusDot?: React.ReactNode;
  actions?: React.ReactNode;
  center?: React.ReactNode;
}

export const TopBar: React.FC<TopBarProps> = ({
  incidentName,
  incidentId,
  timestamp,
  statusDot,
  actions,
  center,
}) => (
  <header className="topbar">
    {/* Logo */}
    <div className="topbar-logo">
      <div className="topbar-logo-mark" aria-hidden="true">OI</div>
      <div>
        <div className="topbar-logo-name">OCEANINTEL</div>
        <div className="topbar-logo-tagline">Maritime Intelligence</div>
      </div>
    </div>

    {/* Divider + Context */}
    {incidentName && (
      <>
        <div className="topbar-divider" aria-hidden="true" />
        <div className="topbar-context">
          <span className="topbar-context-label">{incidentName}</span>
          {incidentId && (
            <>
              <span className="topbar-context-sep">/</span>
              <span>{incidentId}</span>
            </>
          )}
        </div>
      </>
    )}

    {/* Center slot */}
    {center && <div className="topbar-center">{center}</div>}

    {/* Right */}
    <div className="topbar-right">
      {statusDot}
      {timestamp && (
        <span className="topbar-timestamp" title="Current UTC time">
          {timestamp}
        </span>
      )}
      {actions}
    </div>
  </header>
);

/* ============================================================
   SIDE NAV
   ============================================================ */

export interface NavItemConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
  disabled?: boolean;
}

export interface NavGroupConfig {
  id: string;
  label?: string;
  items: NavItemConfig[];
}

interface SideNavProps {
  groups: NavGroupConfig[];
  activeItemId: string;
  onItemClick: (id: string) => void;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  footer?: React.ReactNode;
}

export const SideNav: React.FC<SideNavProps> = ({
  groups,
  activeItemId,
  onItemClick,
  collapsible = true,
  defaultCollapsed = false,
  footer,
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <nav className={`sidenav ${collapsed ? 'sidenav-collapsed' : ''}`} aria-label="Main navigation">
      {groups.map(group => (
        <div key={group.id} className="nav-group">
          {group.label && !collapsed && (
            <div className="nav-group-label">{group.label}</div>
          )}
          {group.items.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeItemId === item.id ? 'nav-item-active' : ''}`}
              onClick={() => onItemClick(item.id)}
              disabled={item.disabled}
              aria-current={activeItemId === item.id ? 'page' : undefined}
              title={collapsed ? item.label : undefined}
            >
              <span className="nav-item-icon" aria-hidden="true">{item.icon}</span>
              <span className="nav-item-label">{item.label}</span>
              {item.count != null && item.count > 0 && (
                <span className="nav-item-count" aria-label={`${item.count} alerts`}>
                  {item.count > 99 ? '99+' : item.count}
                </span>
              )}
            </button>
          ))}
        </div>
      ))}

      {footer && !collapsed && (
        <div style={{ padding: 'var(--space-2) var(--space-3)', marginTop: 'auto' }}>
          {footer}
        </div>
      )}

      {collapsible && (
        <div className="sidenav-toggle">
          <button
            className="sidenav-toggle-btn"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
      )}
    </nav>
  );
};
