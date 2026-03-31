"""Download the latest free EPA vehicle fuel-economy dataset."""

from __future__ import annotations

import os
from pathlib import Path
from urllib.request import urlretrieve

DATASET_URL = "https://www.fueleconomy.gov/feg/epadata/vehicles.csv.zip"
OUTPUT_PATH = Path(__file__).with_name("vehicles.csv.zip")


def main() -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    print(f"Downloading dataset from {DATASET_URL}")
    urlretrieve(DATASET_URL, OUTPUT_PATH)
    size_mb = os.path.getsize(OUTPUT_PATH) / (1024 * 1024)
    print(f"Saved {OUTPUT_PATH} ({size_mb:.2f} MB)")


if __name__ == "__main__":
    main()
