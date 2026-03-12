"""
KrishiSmart — PlantVillage Dataset Downloader
Downloads and organizes the PlantVillage dataset for training.
Dataset: ~87K images across 38 plant disease classes.
"""

import os
import zipfile
import shutil
import sys

try:
    import gdown
except ImportError:
    print("Installing gdown...")
    os.system(f"{sys.executable} -m pip install gdown")
    import gdown


# PlantVillage dataset on Google Drive (public mirror)
DATASET_URL = "https://drive.google.com/uc?id=0B_voCy5O5sXMTFByemhpZllYREU"
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
RAW_DIR = os.path.join(DATA_DIR, "raw")
ZIP_PATH = os.path.join(DATA_DIR, "plantvillage.zip")


def download_dataset():
    """Download PlantVillage dataset from Google Drive."""
    os.makedirs(DATA_DIR, exist_ok=True)

    if os.path.exists(os.path.join(DATA_DIR, "train")):
        print("✓ Dataset already exists at", DATA_DIR)
        print("  Delete 'ml/data/train' folder to re-download.")
        return

    print("📥 Downloading PlantVillage dataset (~1.2 GB)...")
    print("   This may take a few minutes depending on your internet speed.")
    
    try:
        gdown.download(DATASET_URL, ZIP_PATH, quiet=False)
    except Exception as e:
        print(f"\n⚠️  Google Drive download failed: {e}")
        print("\n📋 Manual download instructions:")
        print("   1. Go to: https://data.mendeley.com/datasets/tywbtsjrjv/1")
        print("   2. Download 'PlantVillage' dataset")
        print("   3. Extract to: ml/data/raw/PlantVillage/")
        print("   4. Run this script again to organize the data")
        
        # Try Kaggle as alternative
        print("\n   Alternative (Kaggle):")
        print("   1. pip install kaggle")
        print("   2. kaggle datasets download -d emmarex/plantdisease")
        print("   3. Extract to: ml/data/raw/")
        return

    if not os.path.exists(ZIP_PATH):
        print("❌ Download failed. Please download manually (see instructions above).")
        return

    print("📦 Extracting dataset...")
    with zipfile.ZipFile(ZIP_PATH, 'r') as z:
        z.extractall(RAW_DIR)
    
    os.remove(ZIP_PATH)
    print("✓ Extraction complete")
    
    organize_dataset()


def organize_dataset():
    """Split dataset into train/val (80/20)."""
    import random
    random.seed(42)
    
    # Find the extracted folder (may vary in structure)
    source_dir = None
    for root, dirs, files in os.walk(RAW_DIR):
        # Look for directories that look like class folders
        if len(dirs) > 10 and any("___" in d or "Tomato" in d or "Potato" in d for d in dirs):
            source_dir = root
            break
    
    if not source_dir:
        # Check if raw dir itself has the classes
        items = os.listdir(RAW_DIR) if os.path.exists(RAW_DIR) else []
        if len(items) > 10:
            source_dir = RAW_DIR
        else:
            print("❌ Could not find class folders in extracted data.")
            print(f"   Please check: {RAW_DIR}")
            return

    classes = sorted([
        d for d in os.listdir(source_dir) 
        if os.path.isdir(os.path.join(source_dir, d)) and not d.startswith('.')
    ])
    
    print(f"📂 Found {len(classes)} disease classes")
    
    train_dir = os.path.join(DATA_DIR, "train")
    val_dir = os.path.join(DATA_DIR, "val")
    
    total_train = 0
    total_val = 0
    
    for cls in classes:
        cls_path = os.path.join(source_dir, cls)
        images = [f for f in os.listdir(cls_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        random.shuffle(images)
        
        split_idx = int(len(images) * 0.8)
        train_images = images[:split_idx]
        val_images = images[split_idx:]
        
        # Create class dirs
        os.makedirs(os.path.join(train_dir, cls), exist_ok=True)
        os.makedirs(os.path.join(val_dir, cls), exist_ok=True)
        
        for img in train_images:
            shutil.copy2(os.path.join(cls_path, img), os.path.join(train_dir, cls, img))
        for img in val_images:
            shutil.copy2(os.path.join(cls_path, img), os.path.join(val_dir, cls, img))
        
        total_train += len(train_images)
        total_val += len(val_images)
        print(f"  ✓ {cls}: {len(train_images)} train / {len(val_images)} val")
    
    print(f"\n✅ Dataset organized!")
    print(f"   Train: {total_train} images")
    print(f"   Val:   {total_val} images")
    print(f"   Classes: {len(classes)}")
    
    # Clean up raw folder
    if os.path.exists(RAW_DIR):
        shutil.rmtree(RAW_DIR)
        print("   Cleaned up raw download files")


if __name__ == "__main__":
    download_dataset()
