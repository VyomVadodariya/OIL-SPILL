import requests

url = 'https://zenodo.org/api/records'
params = {'q': '"Sentinel-1 SAR Oil spill image dataset"', 'size': 5}
response = requests.get(url, params=params)
if response.status_code == 200:
    data = response.json()
    for hit in data.get('hits', {}).get('hits', []):
        print(f"Record: {hit.get('id')}")
        print(f"Title: {hit.get('metadata', {}).get('title')}")
        for f in hit.get('files', []):
            size_mb = f.get('size', 0) / (1024*1024)
            print(f" - {f.get('key')}: {size_mb:.1f} MB | URL: {f.get('links', {}).get('self')}")
        print('-'*40)
else:
    print(f"Error: {response.status_code} - {response.text}")
