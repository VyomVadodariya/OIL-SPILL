# GOLDEN DEMO AUDIT

## SAR IMAGERY
1. **Which SAR imagery exists?** `data/raw/sar/Radar_data.rar` exists.
2. **Is it real Sentinel-1 imagery?** Presumed YES (pending extraction).
3. **What format?** `.rar` archive containing likely `.tif` or `.nc`.
4. **What geographic location?** Unknown until extracted.
5. **What acquisition timestamp?** Unknown until extracted.
6. **What labels/masks exist?** `01_Train_Val_Oil_Spill_mask.7z` exists in `data/raw/sar/` and `data/raw/zenodo_8346860/`.

**Status:** REAL (Requires Extraction)

## AI DETECTOR / MODEL
7. **Is a trained checkpoint available anywhere?** YES (`models/best_model.pth`).
8. **Is the checkpoint actually trained?** Presumed YES (has 278 weight layers matching ResNet34 U-Net).
9. **What model architecture does it use?** ResNet-34 U-Net.
10. **Can the checkpoint perform inference?** YES, pipeline exists in `src/inference/pipeline.py`.

**Status:** TRAINED (Pending inference verification)

## AIS DATA
11. **What AIS data exists?** None in `data/raw/ais/`.
12. **Is it real or synthetic?** MISSING.

**Status:** BLOCKED (Will use SYNTHETIC DEMO)

## ENVIRONMENTAL FORCING
13. **What environmental forcing exists?** None in `data/raw/environmental/`.
14. **Is it real/cached/synthetic?** MISSING.

**Status:** BLOCKED (Will use DEMO ENVIRONMENTAL FORCING)

## BACKEND ENGINES
15. **Which drift engine is executable?** `src.drift.simulation` (Requires environmental API/Mock).
16. **Which AIS engine is executable?** `src.ais.candidate` (Requires AIS API/Mock).
17. **Which evidence engine is executable?** `src.evidence.engine` (Executable).

**Status:** IMPLEMENTED + TESTED

## FRONTEND
18. **Which frontend screens already work?** Foundation structure, Map view placeholder, candidate placeholders. Actual sequential flow requires wiring.

**Status:** IMPLEMENTED (Missing golden path integration)
