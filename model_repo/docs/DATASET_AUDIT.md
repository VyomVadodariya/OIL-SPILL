# DATASET AUDIT — SIH26143

> **Audit Date:** 2026-09-08  
> **Auditor:** Antigravity Orchestrator

This document evaluates candidate datasets for the Sentinel-1 SAR Oil Spill detection model.

> [!IMPORTANT]
> **STRATEGY UPDATE:** Phase 1 validates the real-data ML pipeline using an independent Sentinel-1 oil-spill segmentation dataset (Gulf of Mexico). Trujillo remains the planned primary training/robustness dataset for the next phase.

---

## 1. Trujillo Sentinel-1 SAR Oil Spill Dataset

* **Official source:** Zenodo
* **URL:** https://zenodo.org/record/8208466 (varies by version)
* **Publisher:** Rubicel Trujillo-Acatitla et al.
* **Geographic coverage:** Global / Various (NOAA and EMSA reports)
* **Sensor:** Sentinel-1
* **SAR polarization/bands:** VV/VH (processed to Sigma0 dB)
* **Number of images/scenes:** ~3,000+ patches
* **Number of labeled samples:** ~3,000+ patches
* **Label classes:** Oil Spill, Clean Sea, Lookalikes
* **Pixel-level segmentation labels:** YES (1D/2D masks provided)
* **Look-alikes labeled:** YES (Part II contains lookalikes)
* **Ship/land/sea labels:** UNKNOWN (focused on oil vs background)
* **Acquisition dates:** UNKNOWN
* **Ground truth methodology:** Correlated with NOAA and EMSA CleanSeaNet records
* **License:** Creative Commons Attribution 4.0 International (CC BY 4.0)
* **Commercial/research restrictions:** Open for research
* **Download size:** ~10-20 GB total across parts
* **Format:** TIFF (images and masks)
* **Resolution:** 2048x2048 patches
* **Raw SAR or processed:** Processed (Sigma0 decibels)
* **Incidence angle/orbit metadata:** UNKNOWN
* **Known limitations:** Patches are pre-cropped, which may lead to edge-effect issues during full-scene inference if not careful.
* **Appropriate for training:** **YES** (Excellent pixel-level masks)
* **Appropriate for validation:** **YES**
* **Appropriate for final testing:** **YES** (Part III is a dedicated test set)
* **Appropriate for Indian-water generalization:** **NO** (Must be verified independently as it relies heavily on US/EU waters)

---

## 2. M4D Oil Spill Detection Dataset

* **Official source:** Information Technologies Institute (M4D Group)
* **URL:** https://m4d.iti.gr/oil-spill-detection-dataset/
* **Publisher:** M4D Group
* **Geographic coverage:** UNKNOWN (Likely EU/Global)
* **Sensor:** Sentinel-1
* **SAR polarization/bands:** UNKNOWN
* **Number of images/scenes:** Thousands of chips
* **Number of labeled samples:** Thousands
* **Label classes:** Oil spills (cyan), look-alikes (red), ships (brown), land (green), sea surface (black)
* **Pixel-level segmentation labels:** YES
* **Look-alikes labeled:** YES
* **Ship/land/sea labels:** YES
* **Acquisition dates:** UNKNOWN
* **Ground truth methodology:** Expert annotation
* **License:** Custom / Academic
* **Commercial/research restrictions:** Requires direct request/approval from authors
* **Download size:** UNKNOWN
* **Format:** UNKNOWN
* **Resolution:** UNKNOWN
* **Raw SAR or processed:** Processed
* **Incidence angle/orbit metadata:** UNKNOWN
* **Known limitations:** Gated access. Cannot be downloaded autonomously.
* **Appropriate for training:** **YES** (if acquired)
* **Appropriate for validation:** **YES**
* **Appropriate for final testing:** **YES**
* **Appropriate for Indian-water generalization:** **UNKNOWN**

---

## 3. CSIRO Sentinel-1 SAR Oil Spill Dataset

* **Official source:** Research Data Australia / Kaggle
* **URL:** https://researchdata.edu.au/
* **Publisher:** CSIRO
* **Geographic coverage:** Global
* **Sensor:** Sentinel-1
* **SAR polarization/bands:** Single-band grayscale (likely VV)
* **Number of images/scenes:** 5,630 chips
* **Number of labeled samples:** 5,630
* **Label classes:** Class 0 (No Oil/Lookalike), Class 1 (Oil)
* **Pixel-level segmentation labels:** **NO** (Image-level classification only)
* **Look-alikes labeled:** Implicitly in Class 0
* **Ship/land/sea labels:** NO
* **Acquisition dates:** 2015-05-01 to 2022-08-31
* **Ground truth methodology:** UNKNOWN
* **License:** Open
* **Commercial/research restrictions:** Open
* **Download size:** < 1 GB
* **Format:** JPEG
* **Resolution:** 400x400 patches
* **Raw SAR or processed:** Processed (8-bit JPEG)
* **Incidence angle/orbit metadata:** NO
* **Known limitations:** Image-level classification only. JPEG format loses dynamic range. Not suitable for segmentation.
* **Appropriate for training:** **NO** (Does not have segmentation masks)
* **Appropriate for validation:** **NO**
* **Appropriate for final testing:** **NO**
* **Appropriate for Indian-water generalization:** N/A

---

## 4. DARTIS Oil Spill Dataset

* **Official source:** PANGAEA
* **URL:** DOI: 10.1594/PANGAEA.980773
* **Publisher:** DLR / DARTIS Project
* **Geographic coverage:** Global
* **Sensor:** Sentinel-1
* **SAR polarization/bands:** VV+VH
* **Number of images/scenes:** 5,930 scenes (source) / 1,365 patches published
* **Number of labeled samples:** 3,225 oil objects
* **Label classes:** Oil, Look-alikes
* **Pixel-level segmentation labels:** YES / Bounding Boxes
* **Look-alikes labeled:** YES
* **Ship/land/sea labels:** UNKNOWN
* **Acquisition dates:** 2018-2022
* **Ground truth methodology:** Expert annotation
* **License:** CC-BY
* **Commercial/research restrictions:** Open
* **Download size:** UNKNOWN
* **Format:** UNKNOWN
* **Resolution:** UNKNOWN
* **Raw SAR or processed:** Processed
* **Incidence angle/orbit metadata:** YES
* **Known limitations:** Highly fragmented across different papers/repositories.
* **Appropriate for training:** **YES**
* **Appropriate for validation:** **YES**
* **Appropriate for final testing:** **YES**
* **Appropriate for Indian-water generalization:** **NO**

---

## 5. QPOSD Dataset

* **Official source:** Academic publications
* **URL:** UNKNOWN
* **Publisher:** UNKNOWN
* **Geographic coverage:** U.S. Gulf of Mexico
* **Sensor:** UAVSAR (Airborne)
* **SAR polarization/bands:** L-band Quad-Pol
* **Number of images/scenes:** UNKNOWN
* **Number of labeled samples:** UNKNOWN
* **Label classes:** Oil, look-alikes
* **Pixel-level segmentation labels:** YES
* **Look-alikes labeled:** YES
* **Ship/land/sea labels:** UNKNOWN
* **Acquisition dates:** 2010-2022
* **Ground truth methodology:** UNKNOWN
* **License:** UNKNOWN
* **Commercial/research restrictions:** UNKNOWN
* **Download size:** UNKNOWN
* **Format:** UNKNOWN
* **Resolution:** UNKNOWN
* **Raw SAR or processed:** T3 Covariance matrix features
* **Incidence angle/orbit metadata:** YES
* **Known limitations:** L-band airborne data does not transfer to C-band satellite data (Sentinel-1).
* **Appropriate for training:** **NO** (Wrong sensor)
* **Appropriate for validation:** **NO**
* **Appropriate for final testing:** **NO**
* **Appropriate for Indian-water generalization:** **NO**

---

## 6. IEEE DataPort Peruvian Coastal SAR

* **Official source:** IEEE DataPort / Academic papers
* **URL:** N/A (Not officially hosted as a standalone dataset)
* **Publisher:** Various authors
* **Geographic coverage:** Peru (Ventanilla spill)
* **Sensor:** Sentinel-1
* **SAR polarization/bands:** VV
* **Number of images/scenes:** UNKNOWN
* **Number of labeled samples:** UNKNOWN
* **Label classes:** Oil
* **Pixel-level segmentation labels:** YES
* **Look-alikes labeled:** NO
* **Ship/land/sea labels:** NO
* **Acquisition dates:** Jan 2022
* **Ground truth methodology:** Case study correlation
* **License:** Private/Academic
* **Commercial/research restrictions:** Tied to papers
* **Download size:** N/A
* **Format:** N/A
* **Resolution:** N/A
* **Raw SAR or processed:** Processed
* **Incidence angle/orbit metadata:** N/A
* **Known limitations:** Not a public, ready-to-use dataset.
* **Appropriate for training:** **NO**
* **Appropriate for validation:** **NO**
* **Appropriate for final testing:** **YES** (If replicated as a case study)
* **Appropriate for Indian-water generalization:** **NO**

---

## DATA QUALITY & ML SUITABILITY AUDIT

### Scientific Quality
The **Trujillo** dataset provides the best balance of scientific quality. It uses confirmed NOAA/EMSA reports as ground truth. The inclusion of explicit "look-alike" and "no oil" classes (Part II) ensures the model will learn discriminative features rather than just identifying any dark spot. The data is genuinely Sentinel-1 C-band.

### Generalization Risk
- **Geographic Bias:** High risk. Datasets like Trujillo are biased towards European (EMSA) and American (NOAA) waters.
- **Sensor Bias:** Low risk if restricted to Sentinel-1 GRD. High risk if mixing QPOSD (UAVSAR).
- **Labeling Bias:** Masks created via thresholds and expert review may omit thin sheens or over-label thick emulsions.

### Data Leakage Analysis
Most SAR datasets are constructed by tiling large 250km x 250km scenes into smaller patches (e.g., 2048x2048).
**Leakage Risk:** If patches from the *same* Sentinel-1 scene end up in both the training and test sets, the model will overfit to the specific wind, sea state, and incidence angle of that scene.
**Prevention:** Data splits MUST be strictly segregated by source scene ID or geographic incident, NOT by randomly shuffling patches. The Trujillo dataset explicitly separates Part III for testing, which helps, but we must verify scene disjointness.

---

## INDIAN GENERALIZATION STRATEGY

There is **no known public labeled dataset** specifically for Indian coastal waters.
To evaluate generalization to the Arabian Sea and Bay of Bengal:
1. **Geographic Holdout:** We cannot train on Indian data. We must train on EU/US data.
2. **Qualitative Verification (Unlabeled Inference):** We will download unlabelled Sentinel-1 scenes of known historical spills in Indian waters (e.g., Chennai 2017 spill, Ennore 2023 spill). We will run the trained model on these scenes and perform qualitative review against news reports and manual inspection.
3. **AIS Correlation:** We will correlate the detected Indian slicks with historical AIS tracks to verify attribution logic.

## REAL SENTINEL-1 DATA SOURCING

* **Source:** Copernicus Data Space Ecosystem (CDSE) API / SciHub.
* **Product Type:** Sentinel-1 Level-1 GRD (Ground Range Detected) IW (Interferometric Wide) swath.
* **Reasoning:** GRD provides amplitude data directly. SLC (Single Look Complex) is unnecessary for amplitude-based segmentation and is vastly larger in file size.
* **Vertical Slice Target:** We need 1 recent GRD scene. To avoid massive downloads without credentials right now, we will use a small sample or download a specific test scene via the `eodag` or `sentinelsat` library in the next stage.
