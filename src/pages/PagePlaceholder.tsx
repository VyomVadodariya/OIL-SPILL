import React from 'react';
import {
  LayoutDashboard,
  FolderSearch,
  Satellite,
  Droplets,
  Radio,
  Ship,
  FileSearch,
  History,
  Waves,
  Cpu,
  Wind,
  Route,
  FileText,
} from 'lucide-react';
import type { NavItemId } from '../components/navigation/Sidebar';

/* Map of nav IDs to a descriptive icon and subtitle */
const PAGE_META: Record<NavItemId, { icon: React.ReactNode; title: string; description: string }> = {
  'command-center':          { icon: <LayoutDashboard size={40} />, title: 'Command Center',          description: 'Operational overview — active incidents, alert feed, key metrics.' },
  'investigations':          { icon: <FolderSearch  size={40} />,  title: 'Investigations',           description: 'All open and archived investigation case files.' },
  'sar-detection':           { icon: <Satellite     size={40} />,  title: 'SAR Detection',            description: 'Synthetic Aperture Radar imagery analysis and spill detection layers.' },
  'spill-intelligence':      { icon: <Droplets      size={40} />,  title: 'Spill Intelligence',       description: 'Spill characterisation, area estimation, weathering state.' },
  'ais-intelligence':        { icon: <Radio         size={40} />,  title: 'AIS Intelligence',         description: 'Vessel AIS feed, dark-vessel detection, signal gap analysis.' },
  'vessel-candidates':       { icon: <Ship          size={40} />,  title: 'Vessel Candidates',        description: 'Ranked list of investigation candidate vessels within the spill temporal window.' },
  'evidence':                { icon: <FileSearch    size={40} />,  title: 'Evidence',                 description: 'Chain-of-custody evidence log — satellite passes, AIS records, reports.' },
  'historical-intelligence':  { icon: <History       size={40} />,  title: 'Historical Intelligence',  description: 'Historical spill incidents, vessel activity, maritime risk hotspots.' },
  'drift':                   { icon: <Waves         size={40} />,  title: 'Drift Modelling',          description: 'Forward and backward drift simulations with ensemble trajectories.' },
  'model-evaluation':        { icon: <Cpu           size={40} />,  title: 'Model Evaluation',         description: 'AI model performance metrics, IoU, confusion matrix, look-alike analysis.' },
  'environment':             { icon: <Wind          size={40} />,  title: 'Environment',              description: 'Wind, current, wave, and sea-surface temperature conditions.' },
  'routes':                  { icon: <Route         size={40} />,  title: 'Response Routes',          description: 'Optimal response vessel routing and containment zone planning.' },
  'reports':                 { icon: <FileText      size={40} />,  title: 'Reports',                  description: 'Intelligence reports, case summaries, and export packages.' },
};

interface PagePlaceholderProps {
  navId: NavItemId;
}

export const PagePlaceholder: React.FC<PagePlaceholderProps> = ({ navId }) => {
  const meta = PAGE_META[navId];

  return (
    <div className="page-placeholder" role="main" aria-labelledby="page-title">
      <div className="page-placeholder-icon" aria-hidden="true">{meta.icon}</div>
      <div>
        <p id="page-title" className="page-placeholder-label">{meta.title}</p>
        <p className="page-placeholder-sublabel" style={{ marginTop: 4, textAlign: 'center' }}>
          {meta.description}
        </p>
      </div>
      <p className="page-placeholder-sublabel" style={{ marginTop: 'var(--space-2)' }}>
        — Page not yet built —
      </p>
    </div>
  );
};
