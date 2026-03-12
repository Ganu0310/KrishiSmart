"""
KrishiSmart — Create Synthetic Dataset
Creates a small fake dataset to verify the train.py pipeline without 
needing the full 1.2GB PlantVillage download on Windows.
"""

import os
import numpy as np
from PIL import Image

BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, "data")
TRAIN_DIR = os.path.join(DATA_DIR, "train")
VAL_DIR = os.path.join(DATA_DIR, "val")

# Create 5 fake classes for testing
CLASSES = [
    "Apple___Apple_scab", 
    "Apple___healthy",
    "Tomato___Bacterial_spot",
    "Tomato___healthy",
    "Potato___Late_blight"
]

def create_synthetic_images(directory, num_images_per_class=10):
    for cls in CLASSES:
        cls_dir = os.path.join(directory, cls)
        os.makedirs(cls_dir, exist_ok=True)
        
        for i in range(num_images_per_class):
            # Create a random RGB image (224x224)
            img_array = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
            img = Image.fromarray(img_array)
            img.save(os.path.join(cls_dir, f"fake_{i}.jpg"))
            
def main():
    print("Creating synthetic training data...")
    create_synthetic_images(TRAIN_DIR, num_images_per_class=10)
    
    print("Creating synthetic validation data...")
    create_synthetic_images(VAL_DIR, num_images_per_class=5)
    
    print("\n✅ Synthetic dataset created successfully!")
    print(f"Classes: {len(CLASSES)}")
    print(f"Train samples: {len(CLASSES) * 10}")
    print(f"Val samples: {len(CLASSES) * 5}")

if __name__ == "__main__":
    main()
