# SIH26143 — Oil Spill Detection and Vessel Attribution System

> Leveraging satellite imagery to determine oil spills at sea along with AIS data correlations to identify the highest-priority investigation candidate vessel responsible for the spill.

**Smart India Hackathon 2026 — Problem Statement SIH26143**

## 1. Project Objective & Architecture

This project implements a multi-stage intelligence system designed to process Sentinel-1 Synthetic Aperture Radar (SAR) imagery, identify oil spills, drift the spill backward in time using environmental forcing, and correlate the spill trajectory against historical AIS vessel tracks to determine the most likely source.

**Architecture:**
1. **Stage 1 & 2:** SAR preprocessing and U-Net based AI Segmentation.
2. **Stage 3:** Spill Characterization (morphology, look-alike rejection, polygons).
3. **Stage 4:** Drift Intelligence (kinematic particle modeling, back-tracking).
4. **Stage 5:** AIS & Maritime Intelligence (vessel tracks, spatial/temporal compatibility).
5. **Stage 6:** Evidence & Attribution Engine (deterministic fusion, configurable priors, uncertainty profiling).

## 2. Current Implementation Status

**The engineering implementation of Stages 1 through 6 is COMPLETE and FROZEN.**

However, it is critical to distinguish between **implemented engineering logic** and **real-world validated models**.

### What is Genuinely Implemented
- The complete Python codebase, data schemas, mathematical formulas, and integration pipelines for Stages 1 through 6 exist.
- Geographic calculations, AIS candidate ranking, track interpolation, and drift kinematic physics are fully implemented.
- The deterministic evidence fusion engine correctly avoids drift double-counting and processes contradicting evidence vs missing evidence.

### What Still Requires Real Data
- **Real SAR Data:** `data/raw/` is currently empty. Sentinel-1 images must be downloaded.
- **Trained Model Weights:** The AI/ML core is currently UNTRAINED. No `.pt` or `.pth` model weights are present.
- **Environmental Forcing:** Stage 4 drift relies on mock providers; real ocean current/wind data (e.g., HYCOM/INCOIS) must be integrated.
- **AIS Data:** Stage 5 relies on mock tracks; a real AIS API or dataset must be integrated.

## 3. Scientific Limitations & Attribution Boundary

This system adheres to strict scientific and legal boundaries:
- **No Automated Guilt:** The highest classification output is `HIGH_PRIORITY_INVESTIGATION_CANDIDATE`. The system is a decision-support tool, not an autonomous legal arbiter. It will never output "guilty" or "confirmed polluter" without external ground truth.
- **Missing ≠ Negative:** An observation gap (such as missing AIS) is explicitly treated as missing evidence, not as proof of an intentional shutdown or negative causal evidence.
- **Identity is Not Causal:** A vessel's identity (MMSI/IMO) contributes only to evidence completeness, not its probability of having caused the spill.
- **Generalization:** Due to the pending integration of real data, Indian-water generalization is not yet validated.

## 4. Current Testing Status

The repository contains a robust automated test suite.
- **46 repository tests passed during the independent audit.**
- **Caveat:** These tests validate *engineering behavior* and deterministic logic on synthetic data and mock coordinates. They do NOT represent real-world detection accuracy.

## 5. Roadmap

- **Stage 1 (Data):** Integrate actual SAR datasets and labels.
- **Stage 2 (AI/ML):** Train the U-Net model and save weights.
- **Stage 3 (Characterization):** Real-data validation pending.
- **Stage 4 (Drift):** Real environmental forcing validation pending.
- **Stage 5 (AIS):** Real AIS integration pending.
- **Stage 6 (Evidence):** COMPLETE / FROZEN.
- **Stage 7 (Environmental Impact):** NOT STARTED.
- **Stage 8 (Demonstration):** NOT STARTED.

## 6. Setup and Quick Start

### Prerequisites
- Python 3.11+
- NVIDIA GPU with CUDA support (tested on RTX 4060 Laptop, 8 GB VRAM)
- Git

### Setup
```bash
git clone <repository-url>
cd "OIL SPILL"
python -m venv venv
.\venv\Scripts\activate
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu130
pip install -e ".[dev]"
```

## Documentation
See `docs/` for:
- [Implementation State](docs/IMPLEMENTATION_STATE.md)

---
*This is an investigation-intelligence system, not an autonomous legal attribution system.*
