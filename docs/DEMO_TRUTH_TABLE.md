# GOLDEN DEMO TRUTH TABLE

This document serves as the absolute source of truth for the Golden Demo (SIH26143).

## 1. SAR Scene
- **Scene ID**: S1A_IW_GRDH_1SDV_20191015...
- **Date**: 2019-10-15
- **Status**: REAL
- **Provenance**: Copernicus Sentinel-1
- **Role**: Triggers the entire investigation.

## 2. Detection Engine
- **Model Status**: TRAINED
- **Model Output**: `20191015_mask.tif`
- **Output Validation**: Verified against training bounds (Not random initialization).

## 3. Environmental Drift Engine
- **Fixture Type**: CACHED FIXTURE (`data/demo_case/environmental/forcing.json`)
- **Status**: SYNTHETIC DEMO FORCING
- **Wind/Current Values**: U/V constants applied over 24 hours.

## 4. AIS Candidate Engine
- **Fixture Type**: CACHED FIXTURE (`data/demo_case/ais/fixture.csv`)
- **Status**: SYNTHETIC DEMO AIS
- **Candidates**:
  - **VESSEL_A_COMPATIBLE** (MMSI: 111111111)
  - **VESSEL_B_WEAK** (MMSI: 222222222)
  - **VESSEL_C_INCOMPATIBLE** (MMSI: 333333333)

## 5. Evidence Fusion & Investigation Result
- **Status**: REAL INFERENCE
- **Golden Candidate**: VESSEL_A_COMPATIBLE (MMSI: 111111111) ranks #1.
- **Provenance**: `data/demo_case/investigation/result.json`

## Integrity Gate Check
- [x] NO FABRICATED "WINNER" LABELS IN FIXTURES
- [x] NO PRE-COMPUTED SCORES IN FIXTURES
- [x] ACTUAL MODEL WEIGHTS VERIFIED
- [x] DETERMINISTIC EXECUTION
