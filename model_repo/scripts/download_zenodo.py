import os
import requests
import json
import hashlib
import time

MANIFEST_PATH = "docs/DATA_ACQUISITION_MANIFEST.json"
TARGET_DIR = "data/raw/zenodo_8346860"

def calculate_md5(filepath):
    print(f"Calculating MD5 for {filepath}...")
    hash_md5 = hashlib.md5()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(4096 * 1024), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

def format_time(seconds):
    if seconds < 0: return "Unknown"
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    if h > 0: return f"{h}h {m}m"
    if m > 0: return f"{m}m {s}s"
    return f"{s}s"

def download_file(url, expected_md5, target_path, expected_size):
    part_path = target_path + ".part"
    
    # Check if final file exists and is valid
    if os.path.exists(target_path):
        if os.path.getsize(target_path) == expected_size:
            print(f"File {target_path} exists. Verifying checksum...")
            local_md5 = calculate_md5(target_path)
            if local_md5 == expected_md5.split(":")[-1]:
                print(f"File {target_path} is valid. Skipping.")
                return True
            else:
                print(f"File {target_path} checksum mismatch. Re-downloading.")
                os.remove(target_path)
        else:
            print(f"File {target_path} size mismatch. Re-downloading.")
            os.remove(target_path)

    retry_delay = 5
    max_delay = 60

    while True:
        current_size = 0
        resume_header = {}
        
        if os.path.exists(part_path):
            current_size = os.path.getsize(part_path)
            if current_size >= expected_size:
                print("Partial file size >= expected size. Checking checksum.")
                break
            resume_header = {'Range': f'bytes={current_size}-'}
            print(f"Found partial file {part_path} of size {current_size} bytes. Attempting to resume...")

        try:
            print(f"Connecting to {url}...")
            response = requests.get(url, headers=resume_header, stream=True, allow_redirects=True, timeout=(30, 30))
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            print(f"Connection failed: {e}. Retrying in {retry_delay}s...")
            time.sleep(retry_delay)
            retry_delay = min(max_delay, retry_delay * 2)
            continue

        if current_size > 0:
            if response.status_code == 200:
                print("WARNING: Server returned 200 OK instead of 206 Partial Content.")
                print("Server does not support Range requests or redirect dropped the header.")
                print("Restarting download from scratch.")
                current_size = 0
                with open(part_path, 'wb') as f:
                    pass
            elif response.status_code == 206:
                content_range = response.headers.get('Content-Range', '')
                print(f"Server returned 206 Partial Content. Content-Range: {content_range}")
                if not content_range.startswith(f"bytes {current_size}-"):
                    print("WARNING: Content-Range offset does not match current size. Restarting from scratch.")
                    current_size = 0
                    with open(part_path, 'wb') as f:
                        pass
            else:
                print(f"Unexpected status code {response.status_code}. Retrying in {retry_delay}s...")
                time.sleep(retry_delay)
                retry_delay = min(max_delay, retry_delay * 2)
                continue
        elif response.status_code not in (200, 206):
            print(f"Failed to start download. Status code: {response.status_code}. Retrying in {retry_delay}s...")
            time.sleep(retry_delay)
            retry_delay = min(max_delay, retry_delay * 2)
            continue

        # Reset retry delay on successful connection
        retry_delay = 5

        mode = 'ab' if current_size > 0 else 'wb'
        start_time = time.time()
        last_print_time = start_time
        bytes_since_last_print = 0

        print("Starting data transfer...")
        try:
            with open(part_path, mode) as f:
                for chunk in response.iter_content(chunk_size=8192 * 1024):
                    if chunk:
                        f.write(chunk)
                        f.flush()
                        chunk_len = len(chunk)
                        current_size += chunk_len
                        bytes_since_last_print += chunk_len
                        
                        now = time.time()
                        if now - last_print_time >= 10:
                            elapsed = now - last_print_time
                            speed_bps = bytes_since_last_print / elapsed
                            speed_mbps = speed_bps / (1024 * 1024)
                            pct = (current_size / expected_size) * 100 if expected_size else 0
                            
                            remaining_bytes = expected_size - current_size
                            eta_seconds = remaining_bytes / speed_bps if speed_bps > 0 else -1
                            
                            print(f"Progress: {current_size / (1024**3):.2f} GB / {expected_size / (1024**3):.2f} GB ({pct:.2f}%) | Speed: {speed_mbps:.2f} MB/s | ETA: {format_time(eta_seconds)}")
                            
                            last_print_time = now
                            bytes_since_last_print = 0

            # If we exit the loop cleanly, check if we're done
            if current_size >= expected_size:
                break

        except (requests.exceptions.ChunkedEncodingError, requests.exceptions.ConnectionError, requests.exceptions.ReadTimeout) as e:
            print(f"Network interruption during read: {e}. Retrying in {retry_delay}s...")
            time.sleep(retry_delay)
            retry_delay = min(max_delay, retry_delay * 2)
            continue
        except Exception as e:
            print(f"Unexpected error during download: {e}. Retrying in {retry_delay}s...")
            time.sleep(retry_delay)
            retry_delay = min(max_delay, retry_delay * 2)
            continue

    actual_size = os.path.getsize(part_path)
    if actual_size == expected_size:
        print(f"Download complete. Verifying checksum...")
        local_md5 = calculate_md5(part_path)
        expected_md5_clean = expected_md5.split(":")[-1]
        
        if local_md5 == expected_md5_clean:
            print(f"Checksum match: {local_md5}. Renaming to {target_path}.")
            os.rename(part_path, target_path)
            return True
        else:
            print(f"Checksum FAILED. Local: {local_md5}, Expected: {expected_md5_clean}")
            return False
    else:
        print(f"Size mismatch after download completion. Actual: {actual_size}, Expected: {expected_size}")
        return False

def main():
    os.makedirs(TARGET_DIR, exist_ok=True)
    with open(MANIFEST_PATH, 'r') as f:
        manifest = json.load(f)
        
    for item in manifest['files']:
        filename = item['filename']
        url = item['download_url']
        expected_md5 = item['checksum']
        expected_size = item['size_bytes']
        
        target_path = os.path.join(TARGET_DIR, filename)
        print(f"\n--- Starting {filename} ---")
        
        success = download_file(url, expected_md5, target_path, expected_size)
        if not success:
            print("Download failed completely.")

if __name__ == '__main__':
    main()
