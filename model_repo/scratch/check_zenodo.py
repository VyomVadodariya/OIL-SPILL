import requests

url = 'https://zenodo.org/api/records/8208466'
response = requests.get(url)
if response.status_code == 200:
    data = response.json()
    print(f"Record Title: {data.get('metadata', {}).get('title')}")
    print("Files:")
    for f in data.get('files', []):
        size_mb = f.get('size', 0) / (1024*1024)
        print(f" - {f.get('key')}: {size_mb:.1f} MB | URL: {f.get('links', {}).get('self')}")
else:
    print(f"Error: {response.status_code} - {response.text}")
