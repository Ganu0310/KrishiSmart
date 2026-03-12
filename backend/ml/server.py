"""
KrishiSmart — ML Prediction Server (FastAPI)
Serves crop disease predictions from the trained EfficientNetV2 model.
Run: python server.py   (starts at http://localhost:8000)
"""

import os
import json
import numpy as np
from io import BytesIO
from PIL import Image

import tensorflow as tf
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# ── Paths ───────────────────────────────────────────────────
BASE_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, "models", "disease_model.keras")
LABELS_PATH = os.path.join(BASE_DIR, "models", "class_labels.json")
DISEASE_INFO_PATH = os.path.join(BASE_DIR, "disease_info.json")

IMG_SIZE = 224

# ── Load model & metadata ──────────────────────────────────
app = FastAPI(
    title="KrishiSmart Disease Prediction API",
    description="Crop disease identification using EfficientNetV2",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None
class_labels = None
disease_info = None


@app.on_event("startup")
def load_model():
    """Load the trained model and metadata at server startup."""
    global model, class_labels, disease_info

    if not os.path.exists(MODEL_PATH):
        print("⚠️  No trained model found!")
        print(f"   Expected at: {MODEL_PATH}")
        print("   Run 'python train.py' first to train the model.")
        print("   Server will start but predictions will fail.")
        return

    print(f"Loading model from {MODEL_PATH}...")
    model = tf.keras.models.load_model(MODEL_PATH)
    print("Model loaded successfully")

    with open(LABELS_PATH, "r") as f:
        class_labels = json.load(f)
    print(f"Loaded {len(class_labels)} class labels")

    with open(DISEASE_INFO_PATH, "r") as f:
        disease_info = json.load(f)
    print(f"Loaded disease info for {len(disease_info)} classes")

    print(f"\n-> Ready to serve predictions at http://localhost:8000/predict")


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """Load, resize, and prepare an image for EfficientNetV2."""
    img = Image.open(BytesIO(image_bytes)).convert("RGB")
    img = img.resize((IMG_SIZE, IMG_SIZE))
    arr = np.array(img, dtype=np.float32)
    arr = np.expand_dims(arr, axis=0)
    # EfficientNetV2 handles preprocessing (scaling) internally 
    # when trained with include_preprocessing=True. 
    # We just need to pass the raw pixel values [0, 255].
    return arr


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "classes": len(class_labels) if class_labels else 0,
    }


@app.post("/predict")
async def predict(image: UploadFile = File(...)):
    """
    Accept an image upload, run inference, return disease prediction.
    Returns JSON matching the KrishiSmart frontend DiseaseResult interface.
    """
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Run 'python train.py' first.",
        )

    # Validate file type
    allowed = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
    if image.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, and WEBP images are supported.")

    # Read and preprocess image
    image_bytes = await image.read()
    if len(image_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be smaller than 5MB.")

    try:
        preprocessed = preprocess_image(image_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {e}")

    # Run inference
    predictions = model.predict(preprocessed, verbose=0)
    predicted_idx = int(np.argmax(predictions[0]))
    confidence = float(predictions[0][predicted_idx])
    class_name = class_labels[predicted_idx]

    # Get disease metadata
    info = disease_info.get(class_name, {})
    is_healthy = info.get("isHealthy", False) or "healthy" in class_name.lower()

    # Build response matching the frontend DiseaseResult interface
    result = {
        "success": True,
        "data": {
            "disease": info.get("disease", class_name.replace("___", " — ").replace("_", " ")),
            "confidence": f"{confidence * 100:.1f}%",
            "severity": info.get("severity", "low") if not is_healthy else "none",
            "isHealthy": is_healthy,
            "description": info.get("description", "Disease identified by KrishiSmart AI model."),
            "affectedCrop": info.get("crop", "Unknown"),
            "treatments": info.get("treatments", []),
            "prevention": info.get("prevention", []),
            "organicRemedy": info.get("organic_remedy"),
        },
        "model": "EfficientNetV2-PlantVillage",
        "class_name": class_name,
        "top_3": [],
    }

    # Add top-3 predictions for transparency
    top_indices = np.argsort(predictions[0])[::-1][:3]
    for idx in top_indices:
        label = class_labels[int(idx)]
        prob = float(predictions[0][int(idx)])
        result["top_3"].append({
            "class": label.replace("___", " — ").replace("_", " "),
            "confidence": f"{prob * 100:.1f}%",
        })

    return result


if __name__ == "__main__":
    print("=" * 50)
    print("  KrishiSmart - Disease Prediction Server")
    print("=" * 50)
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info",
    )
