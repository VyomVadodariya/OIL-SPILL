import React, { createContext, useContext, useState } from 'react';
import './Tabs.css';

/* ---- Context ---- */
interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
  variant: 'underline' | 'segment';
}

const TabsContext = createContext<TabsContextValue>({
  activeTab: '',
  setActiveTab: () => {},
  variant: 'underline',
});

/* ---- Root ---- */
interface TabsProps {
  defaultTab: string;
  variant?: 'underline' | 'segment';
  children: React.ReactNode;
  className?: string;
  onChange?: (tab: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({
  defaultTab,
  variant = 'underline',
  children,
  className = '',
  onChange,
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleChange = (tab: string) => {
    setActiveTab(tab);
    onChange?.(tab);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleChange, variant }}>
      <div className={`tabs tabs-${variant} ${className}`}>{children}</div>
    </TabsContext.Provider>
  );
};

/* ---- Tab List ---- */
interface TabListProps {
  children: React.ReactNode;
  className?: string;
}

export const TabList: React.FC<TabListProps> = ({ children, className = '' }) => (
  <div className={`tab-list ${className}`} role="tablist">
    {children}
  </div>
);

/* ---- Tab Item ---- */
interface TabProps {
  id: string;
  children: React.ReactNode;
  count?: number;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export const Tab: React.FC<TabProps> = ({ id, children, count, icon, disabled = false }) => {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = activeTab === id;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${id}`}
      id={`tab-${id}`}
      className={`tab-item ${isActive ? 'tab-active' : ''}`}
      onClick={() => !disabled && setActiveTab(id)}
      disabled={disabled}
      tabIndex={isActive ? 0 : -1}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
      {count !== undefined && <span className="tab-count">{count}</span>}
    </button>
  );
};

/* ---- Tab Panel ---- */
interface TabPanelProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export const TabPanel: React.FC<TabPanelProps> = ({ id, children, className = '' }) => {
  const { activeTab } = useContext(TabsContext);
  const isActive = activeTab === id;

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${id}`}
      aria-labelledby={`tab-${id}`}
      className={`tab-panel ${isActive ? 'tab-panel-active' : ''} ${className}`}
      tabIndex={0}
    >
      {children}
    </div>
  );
};
