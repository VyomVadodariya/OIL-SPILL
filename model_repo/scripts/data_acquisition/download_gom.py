import os
import time
import requests
from tqdm import tqdm
from pathlib import Path

def download_gom(max_retries=100, retry_delay=5):
    url = "https://zenodo.org/records/4672426/files/Radar_data.rar?download=1"
    dest = Path("data/raw/sar/Radar_data.rar")
    dest.parent.mkdir(parents=True, exist_ok=True)
    
    print(f"Downloading Gulf of Mexico Dataset to {dest}...")
    total_size = 0
    try:
        head_req = requests.head(url, allow_redirects=True, timeout=30)
        total_size = int(head_req.headers.get('content-length', 0))
    except Exception as e:
        print(f"Failed to get headers: {e}")
        total_size = 487624870 # approx 465 MB
        
    retries = 0
    while retries < max_retries:
        existing_size = dest.stat().st_size if dest.exists() else 0
        
        if total_size > 0 and existing_size >= total_size:
            print(f"File already completely downloaded ({existing_size} bytes).")
            return str(dest)
            
        headers = {}
        if existing_size > 0:
            headers['Range'] = f'bytes={existing_size}-'
            print(f"Resuming download from {existing_size / (1024*1024):.2f} MB (attempt {retries + 1}/{max_retries})...")
        else:
            print(f"Starting download (attempt {retries + 1}/{max_retries})...")
            
        try:
            response = requests.get(url, headers=headers, stream=True, allow_redirects=True, timeout=45)
            # 206 Partial Content or 200 OK
            if response.status_code not in [200, 206]:
                print(f"Unexpected status code {response.status_code}")
                time.sleep(retry_delay)
                retries += 1
                continue
                
            # If server sent content-length for partial content, recalculate total_size if unknown
            if total_size == 0 and 'content-length' in response.headers:
                total_size = existing_size + int(response.headers['content-length'])

            mode = 'ab' if existing_size > 0 else 'wb'
            with open(dest, mode) as f, tqdm(
                desc="Radar_data.rar",
                initial=existing_size,
                total=total_size if total_size > 0 else None,
                unit='B',
                unit_scale=True,
                unit_divisor=1024,
            ) as bar:
                for chunk in response.iter_content(chunk_size=131072): # 128 KB chunks
                    if chunk:
                        size = f.write(chunk)
                        f.flush()
                        bar.update(size)
                        
            final_size = dest.stat().st_size if dest.exists() else 0
            if total_size > 0 and final_size >= total_size:
                print("Download complete and verified by size.")
                return str(dest)
            else:
                print(f"Stream ended before reaching full size ({final_size}/{total_size}). Reconnecting...")
                retries += 1
                time.sleep(retry_delay)
                
        except (requests.exceptions.RequestException, Exception) as e:
            print(f"\nNetwork interrupted: {e}")
            retries += 1
            print(f"Retrying in {retry_delay} seconds...")
            time.sleep(retry_delay)
            
    if dest.exists() and total_size > 0 and dest.stat().st_size >= total_size:
        print("Download complete.")
        return str(dest)
    else:
        raise RuntimeError(f"Failed to complete download after {max_retries} attempts.")

if __name__ == "__main__":
    download_gom()

