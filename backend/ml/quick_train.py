"""
KrishiSmart — Quick Train Script
Downloads PlantVillage via tensorflow_datasets and trains MobileNetV2.
Usage: python quick_train.py
"""

import os
import json
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications import MobileNetV2

BASE_DIR = os.path.dirname(__file__)
MODEL_DIR = os.path.join(BASE_DIR, "models")
MODEL_PATH = os.path.join(MODEL_DIR, "disease_model.keras")
LABELS_PATH = os.path.join(MODEL_DIR, "class_labels.json")

IMG_SIZE = 224
BATCH_SIZE = 32

# ── PlantVillage class labels (38 classes) ────────────────
CLASS_NAMES = [
    "Apple___Apple_scab", "Apple___Black_rot", "Apple___Cedar_apple_rust", "Apple___healthy",
    "Blueberry___healthy",
    "Cherry_(including_sour)___Powdery_mildew", "Cherry_(including_sour)___healthy",
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot", "Corn_(maize)___Common_rust_",
    "Corn_(maize)___Northern_Leaf_Blight", "Corn_(maize)___healthy",
    "Grape___Black_rot", "Grape___Esca_(Black_Measles)",
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)", "Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)",
    "Peach___Bacterial_spot", "Peach___healthy",
    "Pepper,_bell___Bacterial_spot", "Pepper,_bell___healthy",
    "Potato___Early_blight", "Potato___Late_blight", "Potato___healthy",
    "Raspberry___healthy",
    "Soybean___healthy",
    "Squash___Powdery_mildew",
    "Strawberry___Leaf_scorch", "Strawberry___healthy",
    "Tomato___Bacterial_spot", "Tomato___Early_blight", "Tomato___Late_blight",
    "Tomato___Leaf_Mold", "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite", "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus", "Tomato___Tomato_mosaic_virus",
    "Tomato___healthy"
]


def load_data():
    """Load PlantVillage dataset via tensorflow_datasets."""
    print("📥 Loading PlantVillage dataset via TensorFlow Datasets...")
    print("   (First run will download ~1GB automatically)")
    
    try:
        import tensorflow_datasets as tfds
    except ImportError:
        print("   Installing tensorflow-datasets...")
        os.system(f"pip install tensorflow-datasets")
        import tensorflow_datasets as tfds
    
    # Load the plant_village dataset
    ds_train, ds_val = tfds.load(
        'plant_village',
        split=['train[:80%]', 'train[80%:]'],
        as_supervised=True,
        shuffle_files=True,
        data_dir="C:/tfds"
    )
    
    # Get dataset info
    info = tfds.builder('plant_village').info
    num_classes = info.features['label'].num_classes
    label_names = info.features['label'].names
    
    print(f"✓ Loaded {num_classes} classes")
    print(f"  Sample classes: {label_names[:5]}...")
    
    return ds_train, ds_val, label_names, num_classes


def preprocess(image, label):
    """Resize and normalize images."""
    image = tf.image.resize(image, (IMG_SIZE, IMG_SIZE))
    image = tf.cast(image, tf.float32)
    return image, label


def load_from_directory():
    """Fallback: load from local directory if available."""
    train_dir = os.path.join(BASE_DIR, "data", "train")
    val_dir = os.path.join(BASE_DIR, "data", "val")
    
    if not os.path.exists(train_dir):
        return None, None, None, None
    
    print("📂 Loading from local directory...")
    
    train_ds = tf.keras.utils.image_dataset_from_directory(
        train_dir, image_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE, label_mode="categorical", shuffle=True, seed=42,
    )
    val_ds = tf.keras.utils.image_dataset_from_directory(
        val_dir, image_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE, label_mode="categorical", shuffle=False,
    )
    
    class_names = train_ds.class_names
    return train_ds, val_ds, class_names, len(class_names)


def build_model(num_classes):
    """Build MobileNetV2 with transfer learning."""
    augmentation = tf.keras.Sequential([
        layers.RandomFlip("horizontal"),
        layers.RandomRotation(0.15),
        layers.RandomZoom(0.1),
        layers.RandomContrast(0.1),
    ], name="augmentation")

    base = MobileNetV2(input_shape=(IMG_SIZE, IMG_SIZE, 3), include_top=False, weights="imagenet")
    base.trainable = False

    inputs = layers.Input(shape=(IMG_SIZE, IMG_SIZE, 3))
    x = augmentation(inputs)
    x = tf.keras.applications.mobilenet_v2.preprocess_input(x)
    x = base(x, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(256, activation="relu")(x)
    x = layers.Dropout(0.2)(x)
    outputs = layers.Dense(num_classes, activation="softmax")(x)

    return models.Model(inputs, outputs), base


def train():
    """Full training pipeline."""
    print("=" * 60)
    print("  KrishiSmart — Crop Disease Model Training")
    print("=" * 60)
    
    # Try local directory first, then TFDS
    train_ds, val_ds, class_names, num_classes = load_from_directory()
    use_tfds = False
    
    if train_ds is None:
        ds_train, ds_val, class_names, num_classes = load_data()
        use_tfds = True
    
    AUTOTUNE = tf.data.AUTOTUNE
    
    if use_tfds:
        # TFDS returns unbatched supervised (image, label) pairs
        # Convert labels to one-hot
        def to_onehot(image, label):
            image = tf.image.resize(image, (IMG_SIZE, IMG_SIZE))
            image = tf.cast(image, tf.float32)
            label = tf.one_hot(label, num_classes)
            return image, label
        
        train_ds = ds_train.map(to_onehot, num_parallel_calls=AUTOTUNE).shuffle(1000).batch(BATCH_SIZE).prefetch(AUTOTUNE)
        val_ds = ds_val.map(to_onehot, num_parallel_calls=AUTOTUNE).batch(BATCH_SIZE).prefetch(AUTOTUNE)
        
        # Count batches
        train_count = sum(1 for _ in train_ds)
        val_count = sum(1 for _ in val_ds)
        # Re-create after counting
        train_ds = ds_train.map(to_onehot, num_parallel_calls=AUTOTUNE).shuffle(1000).batch(BATCH_SIZE).prefetch(AUTOTUNE)
        val_ds = ds_val.map(to_onehot, num_parallel_calls=AUTOTUNE).batch(BATCH_SIZE).prefetch(AUTOTUNE)
        print(f"  Train batches: ~{train_count}")
        print(f"  Val batches:   ~{val_count}")
    else:
        train_ds = train_ds.prefetch(buffer_size=AUTOTUNE)
        val_ds = val_ds.prefetch(buffer_size=AUTOTUNE)
    
    # Build model
    print(f"\n🏗️  Building MobileNetV2 ({num_classes} classes)...")
    model, base = build_model(num_classes)
    
    # Phase 1: Train head
    print(f"\n📌 Phase 1: Training classification head (5 epochs)...")
    model.compile(
        optimizer=tf.keras.optimizers.Adam(1e-3),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    model.fit(train_ds, validation_data=val_ds, epochs=5, callbacks=[
        tf.keras.callbacks.EarlyStopping(patience=3, restore_best_weights=True),
    ])
    
    # Phase 2: Fine-tune
    print(f"\n🔧 Phase 2: Fine-tuning top layers (10 epochs)...")
    base.trainable = True
    for layer in base.layers[:-30]:
        layer.trainable = False
    
    model.compile(
        optimizer=tf.keras.optimizers.Adam(1e-5),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    model.fit(train_ds, validation_data=val_ds, epochs=10, callbacks=[
        tf.keras.callbacks.EarlyStopping(patience=3, restore_best_weights=True),
        tf.keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=2, min_lr=1e-7),
    ])
    
    # Evaluate
    print("\n📊 Final Evaluation...")
    loss, accuracy = model.evaluate(val_ds)
    print(f"   Val Loss:     {loss:.4f}")
    print(f"   Val Accuracy: {accuracy*100:.1f}%")
    
    # Save
    os.makedirs(MODEL_DIR, exist_ok=True)
    model.save(MODEL_PATH)
    print(f"\n💾 Model saved: {MODEL_PATH}")
    
    # Save class labels — use PlantVillage names or directory names
    if isinstance(class_names, list):
        labels_to_save = class_names
    else:
        labels_to_save = list(class_names)
    
    with open(LABELS_PATH, "w") as f:
        json.dump(labels_to_save, f, indent=2)
    print(f"📋 Labels saved: {LABELS_PATH} ({len(labels_to_save)} classes)")
    
    print(f"\n✅ Training complete! Accuracy: {accuracy*100:.1f}%")
    print(f"   Run 'python server.py' to start the prediction API")


if __name__ == "__main__":
    train()
