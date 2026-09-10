#!/usr/bin/env python3
"""
SIH26143 — Environment Verification Script

Tests that all required components are installed and functional.
Exit code 0 = all checks passed.
Exit code 1 = one or more checks failed.

Usage:
    python scripts/verify_environment.py
"""

import sys
import platform
import importlib
from datetime import datetime, timezone


PASS = "\033[92m✓ PASS\033[0m"
FAIL = "\033[91m✗ FAIL\033[0m"
WARN = "\033[93m⚠ WARN\033[0m"

results = []


def check(name: str, fn):
    """Run a check function and record the result."""
    try:
        msg = fn()
        results.append(("PASS", name, msg))
        print(f"  {PASS}  {name}: {msg}")
    except Exception as e:
        results.append(("FAIL", name, str(e)))
        print(f"  {FAIL}  {name}: {e}")


def warn(name: str, msg: str):
    """Record a warning (non-fatal)."""
    results.append(("WARN", name, msg))
    print(f"  {WARN}  {name}: {msg}")


# ============================================================
# Section 1: Python Environment
# ============================================================
def check_python():
    v = platform.python_version()
    if not v.startswith("3.11"):
        raise RuntimeError(f"Expected Python 3.11.x, got {v}")
    return f"Python {v}"


def check_platform():
    return f"{platform.system()} {platform.machine()}"


# ============================================================
# Section 2: PyTorch + CUDA
# ============================================================
def check_pytorch():
    import torch
    return f"PyTorch {torch.__version__}"


def check_cuda_available():
    import torch
    if not torch.cuda.is_available():
        raise RuntimeError(
            "torch.cuda.is_available() returned False. "
            "PyTorch is CPU-only or CUDA drivers are not detected."
        )
    return "CUDA is available"


def check_cuda_device_count():
    import torch
    count = torch.cuda.device_count()
    if count == 0:
        raise RuntimeError("No CUDA devices detected")
    return f"{count} CUDA device(s)"


def check_gpu_name():
    import torch
    name = torch.cuda.get_device_name(0)
    if "4060" not in name:
        warn("GPU identity", f"Expected RTX 4060, found: {name}")
    return name


def check_gpu_vram():
    import torch
    props = torch.cuda.get_device_properties(0)
    vram_gb = props.total_memory / (1024 ** 3)
    return f"{vram_gb:.1f} GB VRAM"


def check_cuda_version():
    import torch
    return f"CUDA {torch.version.cuda}"


def check_gpu_tensor():
    import torch
    t = torch.zeros(16, 16, device="cuda")
    assert t.device.type == "cuda"
    return f"Allocated 16x16 tensor on GPU (device={t.device})"


def check_gpu_matmul():
    import torch
    a = torch.randn(256, 256, device="cuda")
    b = torch.randn(256, 256, device="cuda")
    c = torch.mm(a, b)
    assert c.shape == (256, 256)
    assert c.device.type == "cuda"
    return f"256x256 matmul on GPU succeeded, result on {c.device}"


# ============================================================
# Section 3: Core ML Dependencies
# ============================================================
def make_import_check(module_name: str, version_attr: str = "__version__"):
    def _check():
        mod = importlib.import_module(module_name)
        ver = getattr(mod, version_attr, "unknown")
        return f"{module_name} {ver}"
    return _check


# ============================================================
# Section 4: Geospatial Dependencies
# ============================================================
def check_rasterio():
    import rasterio
    return f"rasterio {rasterio.__version__} (GDAL {rasterio.gdal_version()})"


def check_geopandas():
    import geopandas
    return f"geopandas {geopandas.__version__}"


def check_shapely():
    import shapely
    return f"shapely {shapely.__version__}"


def check_pyproj():
    import pyproj
    return f"pyproj {pyproj.__version__}"


def check_fiona():
    import fiona
    return f"fiona {fiona.__version__}"


# ============================================================
# Main
# ============================================================
def main():
    print("=" * 64)
    print("  SIH26143 — Environment Verification")
    print(f"  Date: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print("=" * 64)

    # --- Python ---
    print("\n[1/4] Python Environment")
    check("Python version", check_python)
    check("Platform", check_platform)

    # --- PyTorch + CUDA ---
    print("\n[2/4] PyTorch + CUDA")
    check("PyTorch", check_pytorch)
    check("CUDA available", check_cuda_available)

    # Only run GPU checks if CUDA is available
    cuda_ok = any(s == "PASS" and n == "CUDA available" for s, n, _ in results)
    if cuda_ok:
        check("CUDA device count", check_cuda_device_count)
        check("GPU name", check_gpu_name)
        check("GPU VRAM", check_gpu_vram)
        check("CUDA version", check_cuda_version)
        check("GPU tensor allocation", check_gpu_tensor)
        check("GPU matrix multiply", check_gpu_matmul)
    else:
        warn("GPU checks", "Skipped — CUDA not available")

    # --- Core ML ---
    print("\n[3/4] Core ML Dependencies")
    ml_packages = [
        ("numpy", "__version__"),
        ("scipy", "__version__"),
        ("pandas", "__version__"),
        ("sklearn", "__version__"),
        ("cv2", "__version__"),
        ("PIL", "__version__"),
        ("matplotlib", "__version__"),
        ("seaborn", "__version__"),
        ("tqdm", "__version__"),
        ("pydantic", "__version__"),
    ]
    for pkg, ver_attr in ml_packages:
        check(f"Import {pkg}", make_import_check(pkg, ver_attr))

    # Check segmentation-models-pytorch
    check("Import segmentation_models_pytorch", make_import_check("segmentation_models_pytorch", "__version__"))

    # Check albumentations
    check("Import albumentations", make_import_check("albumentations", "__version__"))

    # --- Geospatial ---
    print("\n[4/4] Geospatial Dependencies")
    check("rasterio", check_rasterio)
    check("geopandas", check_geopandas)
    check("shapely", check_shapely)
    check("pyproj", check_pyproj)
    check("fiona", check_fiona)

    # --- Summary ---
    print("\n" + "=" * 64)
    passed = sum(1 for s, _, _ in results if s == "PASS")
    failed = sum(1 for s, _, _ in results if s == "FAIL")
    warned = sum(1 for s, _, _ in results if s == "WARN")
    total = len(results)

    print(f"  Results: {passed}/{total} passed, {failed} failed, {warned} warnings")

    if failed > 0:
        print(f"\n  {FAIL} ENVIRONMENT NOT READY — {failed} check(s) failed:")
        for s, n, m in results:
            if s == "FAIL":
                print(f"       • {n}: {m}")
        print()
        sys.exit(1)
    else:
        print(f"\n  {PASS} ENVIRONMENT READY")
        print()
        sys.exit(0)


if __name__ == "__main__":
    main()
