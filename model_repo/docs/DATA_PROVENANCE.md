# DATA PROVENANCE — SIH26143

> **Date:** 2026-09-08  
> **Auditor:** Antigravity Orchestrator

This document tracks the origin and modifications of all data used in the SIH26143 pipeline.

---

## 1. Trujillo Sentinel-1 SAR Oil Spill Dataset

* **Source Entity:** Rubicel Trujillo-Acatitla et al.
* **Original URL:** https://zenodo.org/record/8208466
* **License:** Creative Commons Attribution 4.0 International (CC BY 4.0)
* **Citation:** Trujillo-Acatitla, R., et al. (2023). "Sentinel-1 SAR Oil spill image dataset for train, validate, and test deep learning models."
* **Acquisition Status:** Masks successfully acquired (2026-09-08). Imagery blocked by network bandwidth limitations.
* **Preprocessing Chain (Authors):** 
    1. Sentinel-1 GRD IW images downloaded from Copernicus.
    2. Radiometric calibration (Sigma0).
    3. Converted to decibels (dB).
    4. Sliced into 2048x2048 patches.
    5. Annotated based on NOAA/EMSA spill reports.
* **Local Modifications:** None yet. Files stored as raw `.7z` archives in `data/raw/sar/`.

---

## 2. Copernicus Sentinel-1 Demo Data

* **Source Entity:** European Space Agency (ESA) / Copernicus Data Space Ecosystem (CDSE)
* **Original URL:** https://dataspace.copernicus.eu/
* **License:** Copernicus Open Access (Free, full, open)
* **Acquisition Status:** Pending CDSE API credentials.
* **Local Modifications:** N/A.

---

## 3. AIS Data (Pending)

* **Source Entity:** To Be Determined (AISStream, Spire, Global Fishing Watch)
* **License:** TBD
* **Acquisition Status:** Pending API Keys.
* **Local Modifications:** N/A.
