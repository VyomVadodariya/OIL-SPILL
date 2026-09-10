/**
 * OceanIntel — Historical Demonstration Data Store
 *
 * HISTORICAL_DEMO_DATA
 * Demonstration records for the Historical Intelligence workstation.
 *
 * CONCEPTUAL SEPARATION:
 * - Current active investigation pages consume DEMO_INCIDENT (src/data/demo/incident.ts)
 * - Historical Intelligence consumes HISTORICAL_DEMO_DATA (src/data/demo/historical.ts)
 *
 * DEMO MODE · SIMULATED DATA · NOT HISTORICAL OPERATIONAL FEED
 * Incidents, vessel references, and statistics are simulated demonstration records
 * used to illustrate the historical-risk workflow.
 */

export interface HistoricalIncident {
  id: string;
  name: string;
  year: string;
  area: string;
  volume: string;
  severity: 'critical' | 'warning' | 'nominal';
  attributed: string;
  x: number;
  y: number;
}

export interface HistoricalRiskHotspot {
  id: string;
  name: string;
  lat: number;
  lon: number;
  incidentCount: number;
  riskTier: 'CRITICAL' | 'HIGH' | 'MODERATE';
  dominantCause: string;
}

export interface HistoricalDemoData {
  status: 'HISTORICAL DEMONSTRATION MODE';
  isSimulated: true;
  disclaimer: string;
  incidents: HistoricalIncident[];
  hotspots: HistoricalRiskHotspot[];
  summary: {
    totalIncidents: number;
    activeRiskGrids: number;
    corridorCoverage: string;
    temporalRange: string;
  };
}

export const HISTORICAL_DEMO_DATA: HistoricalDemoData = {
  status: 'HISTORICAL DEMONSTRATION MODE',
  isSimulated: true,
  disclaimer: 'Incidents, vessel references and statistics shown in this view are simulated demonstration records used to illustrate the historical-risk workflow.',
  incidents: [
    { id: 'h-01', name: 'SPILL-2026-047 (Current)', year: '2026', area: '42.7 km²', volume: '4,820 bbl', severity: 'critical', attributed: 'Under Review', x: 470, y: 340 },
    { id: 'h-02', name: 'SPILL-2025-112 (Jubail Outer)', year: '2025', area: '28.1 km²', volume: '2,900 bbl', severity: 'critical', attributed: 'Candidate Linked (MMSI 538002910)', x: 740, y: 280 },
    { id: 'h-03', name: 'SPILL-2025-084 (Hormuz Transit)', year: '2025', area: '14.5 km²', volume: '1,200 bbl', severity: 'warning',  attributed: 'Unlinked (AIS Gap)', x: 280, y: 190 },
    { id: 'h-04', name: 'SPILL-2024-041 (South Pars Zone)', year: '2024', area: '31.0 km²', volume: '3,400 bbl', severity: 'critical', attributed: 'Platform Discharge (SP-04)', x: 580, y: 220 },
    { id: 'h-05', name: 'SPILL-2024-019 (Central Gulf)', year: '2024', area: '9.2 km²',  volume: '750 bbl',   severity: 'nominal',  attributed: 'Tank Washings Anomaly', x: 410, y: 440 },
    { id: 'h-06', name: 'SPILL-2023-098 (Rastanura Anchorage)', year: '2023', area: '18.4 km²', volume: '1,850 bbl', severity: 'warning',  attributed: 'Candidate Linked (MMSI 636014412)', x: 690, y: 380 },
  ],
  hotspots: [
    { id: 'spot-1', name: 'Strait of Hormuz Inbound Lane', lat: 26.50, lon: 56.25, incidentCount: 14, riskTier: 'CRITICAL', dominantCause: 'High-density tanker transit & ballast discharge' },
    { id: 'spot-2', name: 'Jubail Anchorage Approaches', lat: 27.05, lon: 49.70, incidentCount: 9, riskTier: 'HIGH', dominantCause: 'Refinery loading operations' },
    { id: 'spot-3', name: 'South Pars / North Field Zone', lat: 26.70, lon: 52.00, incidentCount: 7, riskTier: 'HIGH', dominantCause: 'Offshore platform production flush' },
    { id: 'spot-4', name: 'Rastanura Deep-Water Channel', lat: 26.65, lon: 50.20, incidentCount: 5, riskTier: 'MODERATE', dominantCause: 'Bunkering maneuvering anomalies' },
  ],
  summary: {
    totalIncidents: 6,
    activeRiskGrids: 4,
    corridorCoverage: '840 km Maritime Lanes',
    temporalRange: '2021 – 2026 Longitudinal Archive',
  },
};
