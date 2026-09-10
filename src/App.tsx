import { useState, useCallback, useEffect } from 'react';
import { AppShell, type NavItemId } from './components/navigation/Sidebar';
import { CommandCenter } from './pages/CommandCenter/CommandCenter';
import { Investigations } from './pages/Investigations/Investigations';
import { SarDetection } from './pages/SarDetection/SarDetection';
import { SpillIntelligence } from './pages/SpillIntelligence/SpillIntelligence';
import { AisIntelligence } from './pages/AisIntelligence/AisIntelligence';
import { VesselCandidates } from './pages/VesselCandidates/VesselCandidates';
import { Evidence } from './pages/Evidence/Evidence';
import { HistoricalIntelligence } from './pages/HistoricalIntelligence/HistoricalIntelligence';
import { DriftModelling } from './pages/DriftModelling/DriftModelling';
import { ModelEvaluation } from './pages/ModelEvaluation/ModelEvaluation';
import { Environment } from './pages/Environment/Environment';
import { ResponseRoutes } from './pages/ResponseRoutes/ResponseRoutes';
import { Reports } from './pages/Reports/Reports';
import { PagePlaceholder } from './pages/PagePlaceholder';
import { GuidedWalkthrough, WALKTHROUGH_STEPS } from './components/investigation/GuidedWalkthrough';
import { ThemeProvider } from './context/ThemeContext';

/* Format real date and time according to India timeline (IST · UTC+05:30) */
function formatIST(d: Date): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return `${formatter.format(d).replace(',', '')} IST`;
}

function App() {
  const [activeId, setActiveId] = useState<NavItemId>('command-center');
  /* Real date and time according to India timeline (IST · UTC+05:30) */
  const [currentTime, setCurrentTime] = useState<string>(() => formatIST(new Date()));
  const [isGuidedMode, setIsGuidedMode] = useState<boolean>(false);
  const [guidedStep, setGuidedStep] = useState<number>(1);

  /* Live ticking clock every second */
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(formatIST(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  /* Guided Walkthrough Handlers */
  const handleStartGuidedMode = useCallback(() => {
    setIsGuidedMode(true);
    setGuidedStep(1);
    setActiveId(WALKTHROUGH_STEPS[0].navId);
  }, []);

  const handleStepChange = useCallback((step: number) => {
    setGuidedStep(step);
    const targetNav = WALKTHROUGH_STEPS[step - 1]?.navId;
    if (targetNav) {
      setActiveId(targetNav);
    }
  }, []);

  const handleExitGuidedMode = useCallback(() => {
    setIsGuidedMode(false);
    setActiveId('command-center');
  }, []);

  return (
    <ThemeProvider>
      <AppShell
        activeId={activeId}
        onNavigate={(id) => {
          // If user manually navigates via sidebar while in guided mode, exit guided mode
          if (isGuidedMode) setIsGuidedMode(false);
          setActiveId(id);
        }}
        currentTime={currentTime}
        utcTime={currentTime}
      >
        {activeId === 'command-center'
          ? <CommandCenter onStartGuidedMode={handleStartGuidedMode} />
          : activeId === 'investigations'
          ? <Investigations />
          : activeId === 'sar-detection'
          ? <SarDetection />
          : activeId === 'spill-intelligence'
          ? <SpillIntelligence />
          : activeId === 'ais-intelligence'
          ? <AisIntelligence />
          : activeId === 'vessel-candidates'
          ? <VesselCandidates />
          : activeId === 'evidence'
          ? <Evidence />
          : activeId === 'historical-intelligence'
          ? <HistoricalIntelligence />
          : activeId === 'drift'
          ? <DriftModelling />
          : activeId === 'model-evaluation'
          ? <ModelEvaluation />
          : activeId === 'environment'
          ? <Environment />
          : activeId === 'routes'
          ? <ResponseRoutes />
          : activeId === 'reports'
          ? <Reports />
          : <PagePlaceholder navId={activeId} />
        }
      </AppShell>

      {/* Floating Guided Investigation Controller Bar */}
      {isGuidedMode && (
        <GuidedWalkthrough
          currentStep={guidedStep}
          onStepChange={handleStepChange}
          onExit={handleExitGuidedMode}
        />
      )}
    </ThemeProvider>
  );
}

export default App;
