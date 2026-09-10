import os
import requests
import hashlib
from tqdm import tqdm

def download_file(url, dest_path, expected_md5=None):
    """
    Downloads a file with resumable support via Range header.
    """
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    
    # Check existing file size
    existing_size = 0
    if os.path.exists(dest_path):
        existing_size = os.path.getsize(dest_path)
    
    # Get total file size from server
    try:
        head_req = requests.head(url, allow_redirects=True)
        total_size = int(head_req.headers.get('content-length', 0))
    except Exception as e:
        print(f"Error getting headers for {url}: {e}")
        return False

    if total_size != 0 and existing_size == total_size:
        print(f"File {dest_path} already completely downloaded.")
        return True
        
    headers = {}
    if existing_size > 0:
        print(f"Resuming download from {existing_size} bytes...")
        headers['Range'] = f'bytes={existing_size}-'
        
    try:
        response = requests.get(url, headers=headers, stream=True, allow_redirects=True)
        response.raise_for_status()
        
        mode = 'ab' if existing_size > 0 else 'wb'
        with open(dest_path, mode) as f, tqdm(
            desc=os.path.basename(dest_path),
            initial=existing_size,
            total=total_size,
            unit='B',
            unit_scale=True,
            unit_divisor=1024,
        ) as bar:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    size = f.write(chunk)
                    bar.update(size)
    except Exception as e:
        print(f"Failed to download {url}: {e}")
        return False
        
    return True
