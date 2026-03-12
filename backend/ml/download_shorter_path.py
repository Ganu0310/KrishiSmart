import os
import tensorflow_datasets as tfds

# Use a very short path c:/tfds to avoid Windows 260 character limit
data_dir = "C:/tfds"
os.makedirs(data_dir, exist_ok=True)

print(f"Downloading to {data_dir}...")
try:
    ds_train, ds_val = tfds.load(
        'plant_village',
        split=['train[:80%]', 'train[80%:]'],
        as_supervised=True,
        shuffle_files=True,
        data_dir=data_dir
    )
    print("Download and extraction successful!")
except Exception as e:
    import traceback
    traceback.print_exc()
