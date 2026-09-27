"""
Dataset Downloader for Insurance Company Benchmark (COIL 2000)
Downloads raw dataset files and dictionaries into data/raw/
"""
import os
import sys
import urllib.request
import urllib.error

RAW_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "raw")
os.makedirs(RAW_DIR, exist_ok=True)

# Primary and fallback URLs for COIL 2000 files
SOURCES = [
    {
        "name": "ticdata2000.txt",
        "description": "Training data (5822 records, 86 attributes)",
        "urls": [
            "https://archive.ics.uci.edu/ml/machine-learning-databases/tic-mld/ticdata2000.txt",
            "https://raw.githubusercontent.com/jbrownlee/Datasets/master/ticdata2000.csv",
            "https://archive.ics.uci.edu/static/public/89/ticdata2000.txt"
        ]
    },
    {
        "name": "ticeval2000.txt",
        "description": "Evaluation / Test data (4000 records, 85 attributes)",
        "urls": [
            "https://archive.ics.uci.edu/ml/machine-learning-databases/tic-mld/ticeval2000.txt"
        ]
    },
    {
        "name": "tictgts2000.txt",
        "description": "Evaluation targets (4000 records, 1 attribute)",
        "urls": [
            "https://archive.ics.uci.edu/ml/machine-learning-databases/tic-mld/tictgts2000.txt"
        ]
    },
    {
        "name": "ticinfo.txt",
        "description": "Data dictionary and documentation",
        "urls": [
            "https://archive.ics.uci.edu/ml/machine-learning-databases/tic-mld/ticinfo.txt"
        ]
    }
]

def download_file(file_info):
    target_path = os.path.join(RAW_DIR, file_info["name"])
    if os.path.exists(target_path) and os.path.getsize(target_path) > 0:
        print(f"[ALREADY EXISTS] {file_info['name']} ({os.path.getsize(target_path):,} bytes)")
        return True

    print(f"[DOWNLOADING] {file_info['name']} - {file_info['description']}...")
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

    for url in file_info["urls"]:
        try:
            print(f"  Attempting: {url}")
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=20) as response, open(target_path, "wb") as out_file:
                out_file.write(response.read())
            size = os.path.getsize(target_path)
            print(f"  -> SUCCESS: Saved {file_info['name']} ({size:,} bytes)")
            return True
        except Exception as e:
            print(f"  -> Failed from {url}: {e}")

    return False

def verify_dataset():
    print("\n--- Verifying COIL 2000 Dataset Files ---")
    train_file = os.path.join(RAW_DIR, "ticdata2000.txt")
    if os.path.exists(train_file):
        with open(train_file, "r", encoding="utf-8", errors="ignore") as f:
            lines = [l.strip() for l in f if l.strip()]
        print(f"Training records count: {len(lines)} (Expected: 5822)")
        if lines:
            sample_cols = lines[0].split("\t")
            if len(sample_cols) == 1:
                sample_cols = lines[0].split(",")
            if len(sample_cols) == 1:
                sample_cols = lines[0].split()
            print(f"Training columns per row: {len(sample_cols)} (Expected: 86)")
    else:
        print("[WARNING] ticdata2000.txt not found!")

def main():
    print("=" * 60)
    print("Downloading Insurance Company Benchmark (COIL 2000) Dataset")
    print(f"Target Directory: {RAW_DIR}")
    print("=" * 60)

    success_all = True
    for file_info in SOURCES:
        success = download_file(file_info)
        if not success:
            success_all = False
            print(f"[ERROR] Could not download {file_info['name']}")

    verify_dataset()
    if success_all:
        print("\nAll COIL 2000 dataset files acquired successfully!")
    else:
        print("\nSome files could not be downloaded via direct HTTP. Checking fallbacks...")

if __name__ == "__main__":
    main()
