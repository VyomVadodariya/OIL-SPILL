// OceanIntel — Central Component Exports
// UI Primitives
export { Button, ButtonGroup } from './ui/Button/Button';
export type { ButtonVariant, ButtonSize } from './ui/Button/Button';

export { Badge, StatusDot } from './ui/Badge/Badge';
export type { BadgeVariant, BadgeSize } from './ui/Badge/Badge';

export { Input, Select, Textarea } from './ui/Input/Input';

export { Tabs, TabList, Tab, TabPanel } from './ui/Tabs/Tabs';

export { Tooltip } from './ui/Tooltip/Tooltip';

export { DataCard } from './ui/DataCard/DataCard';

export { Panel, PanelHeader, PanelBody, PanelFooter, PanelSection, KVRow } from './ui/Panel/Panel';

export { Table } from './ui/Table/Table';
export type { ColumnDef, RowSeverity } from './ui/Table/Table';

export { Modal, Drawer } from './ui/Modal/Modal';

// Navigation
export { TopBar, SideNav } from './navigation/Navigation';
export type { NavItemConfig, NavGroupConfig } from './navigation/Navigation';

// Application Shell
export { Sidebar, TopBar as OceanIntelTopBar, AppShell } from './navigation/Sidebar';
export type { NavItemId } from './navigation/Sidebar';

// Data Status System
export { DataStatusBadge, DemoBanner } from './common/DataStatusBadge';
export type { DataStatusType } from './common/DataStatusBadge';
