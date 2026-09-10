# DATA MANIFEST — SIH26143

> **Date:** 2026-09-08  
> **Auditor:** Antigravity Orchestrator

## Successfully Downloaded Files

| Filename | Size | Checksum / Source | Download Date | Dataset Version | Intended Purpose | Geographic Coverage | License |
|---|---|---|---|---|---|---|---|
| `01_Train_Val_Oil_Spill_mask.7z` | 6.2 MB | Zenodo (Record 8346860) | 2026-09-08 | Part I (v1) | ML Training (Labels) | Global (NOAA/EMSA) | CC BY 4.0 |

## Blocked Files (Pending Acquisition)

| Filename / Resource | Expected Size | Intended Purpose | Acquisition Blocker |
|---|---|---|---|
| `01_Train_Val_Oil_Spill_images.7z` (Trujillo) | 38.8 GB | ML Training (Features) | **Network Bandwidth:** The available network connection averaged 54 kB/s during tests. Downloading 38.8 GB would take days and time out. Will acquire via external high-bandwidth connection or cloud VM later. |
| `01_Train_Val_Lookalike_images.7z` (Trujillo) | 21.9 GB | ML Training (Lookalikes) | **Network Bandwidth:** Same as above. |
| `01_Train_Val_No_Oil_Images.7z` (Trujillo) | 21.8 GB | ML Training (Clean sea) | **Network Bandwidth:** Same as above. |
| `02_Test_images_and_ground_truth.7z` (Trujillo) | 9.4 GB | ML Test Data | **Network Bandwidth:** Same as above. |
| `S1A_IW_GRDH_...` (Real Demo Scene) | ~1.5 GB | Real inference demo | **Authentication:** Requires Copernicus Data Space Ecosystem (CDSE) API credentials, which are not currently configured in the environment. |
| AIS Dataset / API | Varies | Vessel track attribution | **Authentication:** Requires Spire / AISStream / Global Fishing Watch API keys. |
