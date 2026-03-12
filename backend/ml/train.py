"""
KrishiSmart — Crop Disease Model Training Script (Master Pipeline)
Uses EfficientNetV2B0 with advanced augmentation and progressive fine-tuning.
Produces: 
- ml/models/disease_model.keras 
- ml/models/disease_model.tflite
- ml/models/class_labels.json
- ml/models/training_summary.json
"""

import os
import json
import time
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications import EfficientNetV2B0

# ── Paths ───────────────────────────────────────────────────
BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, "data")
TRAIN_DIR = os.path.join(DATA_DIR, "train")
VAL_DIR = os.path.join(DATA_DIR, "val")
MODEL_DIR = os.path.join(BASE_DIR, "models")
MODEL_PATH = os.path.join(MODEL_DIR, "disease_model.keras")
TFLITE_PATH = os.path.join(MODEL_DIR, "disease_model.tflite")
LABELS_PATH = os.path.join(MODEL_DIR, "class_labels.json")
SUMMARY_PATH = os.path.join(MODEL_DIR, "training_summary.json")

# ── Hyperparameters ─────────────────────────────────────────
IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS_FROZEN = 5       # Warm-up: Train only the head
EPOCHS_FINETUNE = 15    # Fine-tune base layers
LEARNING_RATE = 1e-3
FINETUNE_LR = 1e-5


def calculate_class_weights(train_dir):
    """Calculates class weights to handle imbalanced datasets."""
    subdirs = sorted([d for d in os.listdir(train_dir) if os.path.isdir(os.path.join(train_dir, d))])
    total_samples = 0
    counts = []
    
    for d in subdirs:
        count = len(os.listdir(os.path.join(train_dir, d)))
        counts.append(count)
        total_samples += count

    num_classes = len(subdirs)
    class_weight = {}
    
    for i, count in enumerate(counts):
        # Handle empty directories gracefully
        if count == 0:
            count = 1 
        weight = (1 / count) * (total_samples / num_classes)
        class_weight[i] = weight
        
    return class_weight


def load_datasets():
    """Load train and validation datasets with optimal tf.data pipeline."""
    if not os.path.exists(TRAIN_DIR):
        print("❌ Training data not found!")
        print("   Run 'python download_dataset.py' first to download the PlantVillage dataset.")
        exit(1)

    train_ds = tf.keras.utils.image_dataset_from_directory(
        TRAIN_DIR,
        image_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        label_mode="categorical",
        shuffle=True,
        seed=42,
    )

    val_ds = tf.keras.utils.image_dataset_from_directory(
        VAL_DIR,
        image_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        label_mode="categorical",
        shuffle=False,
    )

    class_names = train_ds.class_names
    num_classes = len(class_names)
    print(f"✓ Loaded {num_classes} classes")
    print(f"  Train batches: {len(train_ds)}")
    print(f"  Val batches:   {len(val_ds)}")

    class_weight = calculate_class_weights(TRAIN_DIR)

    return train_ds, val_ds, class_names, num_classes, class_weight


def build_model(num_classes):
    """Build EfficientNetV2B0 model with custom classification head and augmentation."""

    # Advanced Data Augmentation
    data_augmentation = tf.keras.Sequential([
        layers.RandomFlip("horizontal_and_vertical"),
        layers.RandomRotation(0.2),
        layers.RandomZoom(0.15),
        layers.RandomTranslation(height_factor=0.1, width_factor=0.1),
        layers.RandomContrast(0.1),
        layers.RandomBrightness(0.1),
    ], name="advanced_augmentation")

    # Base model (EfficientNetV2B0 already includes preprocessing)
    base_model = EfficientNetV2B0(
        input_shape=(IMG_SIZE, IMG_SIZE, 3),
        include_top=False,
        weights="imagenet",
        include_preprocessing=True # Important for EfficientNetV2
    )
    base_model.trainable = False

    # Build full model
    inputs = layers.Input(shape=(IMG_SIZE, IMG_SIZE, 3))
    x = data_augmentation(inputs)
    x = base_model(x, training=False)
    
    # Custom Head
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.4)(x)
    x = layers.Dense(256, activation="relu")(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(num_classes, activation="softmax", dtype="float32")(x)

    model = models.Model(inputs, outputs)
    return model, base_model


def export_tflite(model):
    """Export model to TFLite format with optimization."""
    print("\n📦 Exporting to TFLite (Mobile Ready)...")
    try:
        converter = tf.lite.TFLiteConverter.from_keras_model(model)
        # Default float16 optimization for balance of size/accuracy
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        converter.target_spec.supported_types = [tf.float16]
        tflite_model = converter.convert()
        
        with open(TFLITE_PATH, "wb") as f:
            f.write(tflite_model)
        print(f"   ✓ TFLite model saved to: {TFLITE_PATH}")
    except Exception as e:
        print(f"   ❌ TFLite export failed: {e}")


def train():
    """Full production-grade training pipeline."""
    start_time = time.time()
    print("=" * 60)
    print("  KrishiSmart — Master Model Training Pipeline")
    print("=" * 60)

    # 1. Load data
    train_ds, val_ds, class_names, num_classes, class_weight = load_datasets()

    # Performance optimization
    AUTOTUNE = tf.data.AUTOTUNE
    train_ds = train_ds.cache().prefetch(buffer_size=AUTOTUNE)
    val_ds = val_ds.cache().prefetch(buffer_size=AUTOTUNE)

    # 2. Build model
    print("\n🏗️  Building EfficientNetV2B0 model...")
    model, base_model = build_model(num_classes)

    os.makedirs(MODEL_DIR, exist_ok=True)

    # Callbacks
    early_stopping = tf.keras.callbacks.EarlyStopping(
        monitor="val_loss", patience=4, restore_best_weights=True, verbose=1
    )
    model_checkpoint = tf.keras.callbacks.ModelCheckpoint(
        filepath=MODEL_PATH, monitor="val_accuracy", save_best_only=True, verbose=1
    )
    reduce_lr = tf.keras.callbacks.ReduceLROnPlateau(
        monitor="val_loss", factor=0.5, patience=2, min_lr=1e-7, verbose=1
    )

    # 3. Phase 1: Train head only (base frozen)
    print(f"\n📌 Phase 1: Warm-up Classification Head ({EPOCHS_FROZEN} epochs)...")
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=LEARNING_RATE),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )

    history_1 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=EPOCHS_FROZEN,
        class_weight=class_weight,
        callbacks=[early_stopping, model_checkpoint],
    )

    # 4. Phase 2: Progressive Fine-tuning
    print(f"\n🔧 Phase 2: Fine-tuning top base layers ({EPOCHS_FINETUNE} epochs)...")
    base_model.trainable = True
    
    # Freeze bottom layers to prevent catastrophic forgetting
    # EfficientNetV2B0 has ~270 layers. Fine-tune top 50.
    for layer in base_model.layers[:-50]:
        layer.trainable = False

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=FINETUNE_LR),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )

    history_2 = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=EPOCHS_FINETUNE,
        class_weight=class_weight, # Maintain class weighting
        callbacks=[early_stopping, model_checkpoint, reduce_lr],
    )

    # 5. Evaluate
    print("\n📊 Final Evaluation...")
    # Load best model for evaluation
    if os.path.exists(MODEL_PATH):
        model.load_weights(MODEL_PATH)
        
    loss, accuracy = model.evaluate(val_ds)
    print(f"   Validation Loss:     {loss:.4f}")
    print(f"   Validation Accuracy: {accuracy:.4f} ({accuracy*100:.1f}%)")

    # 6. Save metadata and export
    with open(LABELS_PATH, "w") as f:
        json.dump(class_names, f, indent=2)
    print(f"\n📋 Class labels saved to: {LABELS_PATH}")

    export_tflite(model)

    end_time = time.time()
    training_time = end_time - start_time
    
    summary = {
        "model_architecture": "EfficientNetV2B0",
        "num_classes": num_classes,
        "final_accuracy": float(accuracy),
        "final_loss": float(loss),
        "training_time_seconds": training_time,
        "epochs_completed": len(history_1.history['loss']) + len(history_2.history['loss']),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    
    with open(SUMMARY_PATH, "w") as f:
        json.dump(summary, f, indent=2)

    print(f"\n✅ Training complete! Total time: {training_time/60:.1f} minutes.")
    print(f"   Summary saved to: {SUMMARY_PATH}")

if __name__ == "__main__":
    # Ensure mixed precision for faster training if supported
    tf.keras.mixed_precision.set_global_policy('mixed_float16')
    try:
        train()
    except KeyboardInterrupt:
        print("\n⚠️ Training interrupted by user.")
