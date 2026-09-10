# Environment Setup — SIH26143

> **Last verified:** PENDING  
> **Platform:** Windows 11, Intel i7-14650HX, RTX 4060 Laptop 8GB

---

## Prerequisites

- Windows 10/11 (x64)
- Python 3.11+
- NVIDIA GPU with CUDA-compatible driver (≥ 592.x)
- Git 2.40+

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "OIL SPILL"
```

### 2. Create Virtual Environment

```bash
python -m venv venv
```

### 3. Activate Virtual Environment

**Windows (PowerShell):**
```powershell
.\venv\Scripts\Activate.ps1
```

**Windows (CMD):**
```cmd
.\venv\Scripts\activate.bat
```

### 4. Install PyTorch with CUDA Support

```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu126
```

> **Note:** This installs PyTorch compiled against CUDA 12.6 runtime.  
> Your NVIDIA driver must support CUDA 12.6+ (driver ≥ 590.x).  
> The CUDA runtime is bundled with the PyTorch wheel — no separate CUDA Toolkit installation is required.

### 5. Install Project Dependencies

```bash
pip install -e ".[dev]"
```

### 6. Verify Environment

```bash
python scripts/verify_environment.py
```

All checks should pass. If any fail, see the Troubleshooting section below.

---

## Verified Versions

> **Status: ✅ VERIFIED — 2026-09-08**

| Component | Version | Status |
|---|---|---|
| Python | 3.11.9 | ✅ PASS |
| PyTorch | 2.14.0+cu126 | ✅ PASS |
| CUDA | 12.6 | ✅ PASS |
| torchvision | 0.29.0+cu126 | ✅ PASS |
| GPU detected | RTX 4060 (8.0 GB VRAM) | ✅ PASS |
| numpy | 2.4.6 | ✅ PASS |
| rasterio | 1.4.4 | ✅ PASS |
| geopandas | 1.1.4 | ✅ PASS |
| shapely | 2.1.2 | ✅ PASS |
| pyproj | 3.7.2 | ✅ PASS |
| fiona | 1.10.1 | ✅ PASS |
| segmentation-models-pytorch | 0.5.0 | ✅ PASS |
| albumentations | 2.0.8 | ✅ PASS |

---

## Troubleshooting

### PyTorch reports CPU-only

1. Verify your NVIDIA driver: `nvidia-smi`
2. Uninstall CPU PyTorch: `pip uninstall torch torchvision`
3. Reinstall with CUDA: `pip install torch torchvision --index-url https://download.pytorch.org/whl/cu130`

### GDAL / rasterio installation fails on Windows

GDAL on Windows can be problematic. Options:
1. Use pre-built wheels from `pip install rasterio` (recent versions bundle GDAL)
2. If that fails, install from Christoph Gohlke's Windows wheels
3. Use conda: `conda install -c conda-forge rasterio geopandas`

### Import errors after install

Make sure you've activated the virtual environment:
```powershell
.\venv\Scripts\Activate.ps1
```

---

## GPU Information

| Property | Value |
|---|---|
| GPU | NVIDIA GeForce RTX 4060 Laptop GPU |
| VRAM | 8 GB (8188 MiB) |
| Driver | 592.82 |
| CUDA capability | 13.1 |
| Compute capability | Ada Lovelace (SM 8.9) |

### Training Feasibility

- U-Net with ResNet34 encoder on 256×256 patches: ✅ Feasible
- U-Net with ResNet50 encoder on 512×512 patches: ✅ Feasible (with mixed precision)
- Large models (ViT-Large, Swin-L) on 512×512: ⚠️ May require gradient accumulation
- Batch sizes up to ~16 for ResNet34/256×256: ✅ Expected

---

*This document is updated after each environment change.*
