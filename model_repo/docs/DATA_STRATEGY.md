# DATA STRATEGY — SIH26143

> **Date:** 2026-09-08  
> **Auditor:** Antigravity Orchestrator

## 1. Selected Datasets

### A. ML Training Dataset
**Recommended:** Trujillo Sentinel-1 SAR Oil Spill image dataset (Part I and Part II).
* **Role:** Primary data for training the U-Net segmentation model.
* **Why:** It contains verified pixel-level labels for oil spills and explicit "look-alike" phenomena, reducing false positives.

### B. ML Validation Dataset
**Recommended:** Trujillo Sentinel-1 Dataset (validation split embedded in Part I/II).
* **Role:** Hyperparameter tuning, early stopping, and tracking generalization during training.
* **Why:** Consistent methodology with training data.

### C. ML Test Dataset
**Recommended:** Trujillo Sentinel-1 Dataset (Part III).
* **Role:** Independent, isolated test dataset for final benchmarking.
* **Why:** Maintained as a completely separate zip archive by the authors specifically for final testing.

### D. Sentinel-1 Demo Scene
**Recommended:** A single historical Sentinel-1 GRD IW scene of the 2023 Ennore, Chennai oil spill.
* **Role:** End-to-end inference verification and visual demonstration for the dashboard.
* **Why:** Real, geographically relevant (Indian waters), and well-documented for qualitative verification.

---

## 2. Leakage Prevention Strategy

Data leakage occurs when samples from the same physical event/scene are split randomly into train and test sets, inflating metrics.

* **Split mechanism:** We will split by **Scene ID**, not by random patches. All 2048x2048 patches derived from the same parent Sentinel-1 scene must remain in the same split (Train OR Val OR Test). 
* **Validation:** We will parse the filenames/metadata provided in the Trujillo dataset to ensure no crossover of parent scenes.

---

## 3. Indian Generalization Strategy

There is no public pixel-labeled Indian SAR oil spill dataset. To evaluate how our model generalizes to the Arabian Sea and Bay of Bengal, we will use a **Geographic Holdout & Unlabeled Inference Strategy**.

1. **Training Isolation:** The model will be trained exclusively on the EU/US-biased Trujillo dataset.
2. **Inference Verification:** We will download Sentinel-1 GRD scenes over the Indian EEZ containing known, documented oil spills (e.g., Chennai, Ennore).
3. **Qualitative Metric:** We will run the model on these Indian scenes without retraining. The generated masks will be evaluated qualitatively against historical news reports, AIS data, and manual visual inspection.
4. **AIS Correlation:** We will use AIS tracks matching the spill timestamps to verify the operational usefulness of the model in Indian waters.

---

## 4. Known Limitations

* **Geographic Bias:** The training data is overwhelmingly European/American.
* **SAR Class Imbalance:** Oil spills occupy a very small fraction of total pixels compared to the open ocean. We will use Dice Loss or Focal Loss to mitigate this during training.
* **Sensor Lock:** The model will only be trained on Sentinel-1 C-band VV/VH. It will not work on X-band (TerraSAR-X) or L-band (ALOS) imagery.
