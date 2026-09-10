import os
import sys
import json
import urllib.request
import argparse
import shutil
from pathlib import Path

# Zenodo APIs for Trujillo datasets
ZENODO_RECORDS = {
    'part1': '8346860',
    'part2': '8253899',
    'part3': '13761290'
}

# Fallback metadata in case of 504 Gateway Timeout from Zenodo API
FALLBACK_METADATA = {
    'part1': {
        "title": "Trujillo Part I",
        "files": [
            {"key": "01_Train_Val_Oil_Spill_images.7z", "size": 40712942245, "checksum": "unknown"},
            {"key": "01_Train_Val_Oil_Spill_mask.7z", "size": 6236761, "checksum": "unknown"}
        ]
    },
    'part2': {
        "title": "Trujillo Part II",
        "files": [
            {"key": "01_Train_Val_No_Oil_Images.7z", "size": 22931223979, "checksum": "unknown"},
            {"key": "01_Train_Val_Lookalike_mask.7z", "size": 426795, "checksum": "unknown"},
            {"key": "01_Train_Val_No_Oil_mask.7z", "size": 416694, "checksum": "unknown"},
            {"key": "01_Train_Val_Lookalike_images.7z", "size": 22993852696, "checksum": "unknown"}
        ]
    }
}

def get_zenodo_metadata(record_id, part_key):
    url = f"https://zenodo.org/api/records/{record_id}"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            return json.loads(response.read())
    except Exception as e:
        print(f"Error fetching Zenodo metadata for {record_id}: {e}")
        print("Falling back to cached metadata due to API failure...")
        return FALLBACK_METADATA.get(part_key)

def main():
    parser = argparse.ArgumentParser(description="Acquire Trujillo SAR dataset from Zenodo")
    parser.add_argument("--dry-run", action="store_true", help="Report files and sizes without downloading")
    parser.add_argument("--dataset", choices=["part1", "part2", "part3", "all"], default="all", help="Dataset part to acquire")
    args = parser.parse_args()

    parts_to_process = []
    if args.dataset == 'all':
        parts_to_process = ['part1', 'part2']
    else:
        parts_to_process = [args.dataset]

    print(f"--- SIH26143 Data Acquisition Engine ---")
    if args.dry_run:
        print("MODE: DRY-RUN")
    else:
        print("MODE: EXECUTION")

    workspace_dir = Path("c:/Users/Vyom/OneDrive/Desktop/OIL SPILL")
    raw_dir = workspace_dir / "data" / "raw" / "sar"
    
    total_bytes_expected = 0
    total_bytes_missing = 0

    print("\n[Zenodo Audit]")
    for part in parts_to_process:
        print(f"Fetching metadata for {part.upper()}...")
        metadata = get_zenodo_metadata(ZENODO_RECORDS[part], part)
        if not metadata:
            print("BLOCKED - SOURCE INACCESSIBLE")
            sys.exit(1)
            
        print(f"Title: {metadata.get('title')}")
        
        for f in metadata.get("files", []):
            fname = f.get("key", f.get("filename"))
            fsize = f.get("size", 0)
            checksum = f.get("checksum", "unknown")
            
            total_bytes_expected += fsize
            
            local_path = raw_dir / fname
            if local_path.exists():
                local_size = local_path.stat().st_size
                if local_size == fsize:
                    print(f"  [PRESENT] {fname} ({fsize / (1024**3):.2f} GB) - Checksum: {checksum}")
                else:
                    print(f"  [INCOMPLETE] {fname} ({local_size} / {fsize} bytes) - Checksum: {checksum}")
                    total_bytes_missing += (fsize - local_size)
            else:
                print(f"  [MISSING] {fname} ({fsize / (1024**3):.2f} GB) - Checksum: {checksum}")
                total_bytes_missing += fsize

    print("\n[Architecture Assessment]")
    print("PARTIAL EXTRACTION UNSUPPORTED - FULL DOWNLOAD REQUIRED for .7z archives.")
    print("Explanation: 7z archives use solid compression by default. Extracting a specific file "
          "requires parsing the header and often decompressing preceding solid blocks. "
          "Attempting HTTP Range streaming extraction on 7z is brittle and unreliable. "
          "We must DOWNLOAD COMPLETE ARCHIVE -> VERIFY CHECKSUM -> EXTRACT -> SELECT VALID SCENES.")

    print("\n[Disk Space Analysis]")
    total, used, free = shutil.disk_usage(workspace_dir)
    print(f"Total Disk Free:       {free / (1024**3):.2f} GB")
    print(f"Expected Download:     {total_bytes_missing / (1024**3):.2f} GB")
    
    estimated_extraction = total_bytes_expected * 1.1 # roughly 10% overhead for uncompressed
    print(f"Estimated Extraction:  {estimated_extraction / (1024**3):.2f} GB")
    
    total_required = total_bytes_missing + estimated_extraction
    print(f"Total Required Space:  {total_required / (1024**3):.2f} GB")
    
    if total_required > free:
        print("WARNING: Insufficient disk space for complete operation!")
    else:
        print("OK: Sufficient disk space available.")

    print("\n[Recommended Strategy]")
    print("1. Target Part I and Part II.")
    print("2. Completely download all required .7z archives to data/raw/sar/")
    print("3. Verify checksums exactly matching Zenodo API.")
    print("4. Extract archives using py7zr.")
    print("5. Select 50-100 Oil, 50 Lookalike, 50 No-Oil for initial validation target.")
    print("6. Run validation suite and generate visual overlays in reports/data_validation_preview/")

    if args.dry_run:
        print("\nDRY-RUN COMPLETE. Halting execution.")
        sys.exit(0)
    else:
        print("\nExecution blocked. Please run with --dry-run first to review.")

if __name__ == "__main__":
    main()
