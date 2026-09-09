"""
Civic Grievance Intelligence Dashboard — NLP Classification Service
FastAPI microservice that classifies complaint text into civic service categories.

Endpoints:
  POST /classify  — classify a single complaint text, returning category and confidence
  GET  /health    — health check and model status
"""

import os
import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Optional, List, Any
from dotenv import load_dotenv
from cluster import compute_clusters

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
env_model_path = os.getenv("MODEL_PATH", "models/classifier_resaved.joblib")
if os.path.isabs(env_model_path):
    MODEL_PATH = env_model_path
else:
    MODEL_PATH = os.path.normpath(os.path.join(BASE_DIR, env_model_path))

CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", 0.35))

app = FastAPI(
    title="Civic Grievance NLP Classifier",
    description="Live text classification service for citizen grievance categories using TF-IDF and Logistic Regression.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model pipeline
model_pipeline = None

def get_model():
    global model_pipeline
    if model_pipeline is None:
        print("BASE_DIR =", BASE_DIR)
        print("MODEL_PATH =", MODEL_PATH)
        print("FILE EXISTS =", os.path.exists(MODEL_PATH))
        if os.path.exists(MODEL_PATH):
            model_pipeline = joblib.load(MODEL_PATH)
            print(f"[OK] NLP Model loaded successfully from: {MODEL_PATH}")
        else:
            print(f"! Model file not found at: {MODEL_PATH}")
    return model_pipeline

@app.on_event("startup")
def startup_event():
    get_model()

class ClassifyRequest(BaseModel):
    text: str = Field(..., min_length=3, description="The grievance description to classify")

class ClassifyResponse(BaseModel):
    category: str
    confidence: float
    is_low_confidence: bool
    probabilities: Dict[str, float]

@app.get("/health")
def health():
    model_loaded = os.path.exists(MODEL_PATH) and model_pipeline is not None
    return {
        "status": "ok",
        "service": "nlp-classifier",
        "model_loaded": model_loaded,
        "confidence_threshold": CONFIDENCE_THRESHOLD,
    }

@app.post("/classify", response_model=ClassifyResponse)
def classify(req: ClassifyRequest):
    pipeline = get_model()
    if pipeline is None:
        raise HTTPException(
            status_code=503,
            detail="Model is not loaded. Please ensure classifier.joblib exists.",
        )

    clean_text = req.text.strip()
    if not clean_text:
        return ClassifyResponse(
            category="other",
            confidence=0.0,
            is_low_confidence=True,
            probabilities={},
        )

    try:
        # Predict class and probabilities
        probs = pipeline.predict_proba([clean_text])[0]
        classes = pipeline.classes_

        prob_dict = {
            cls_name: round(float(prob), 4)
            for cls_name, prob in zip(classes, probs)
        }

        top_idx = probs.argmax()
        top_category = str(classes[top_idx])
        top_confidence = round(float(probs[top_idx]), 4)

        # Flag if below confidence threshold
        is_low = top_confidence < CONFIDENCE_THRESHOLD

        return ClassifyResponse(
            category=top_category,
            confidence=top_confidence,
            is_low_confidence=is_low,
            probabilities=prob_dict,
        )
    except Exception as e:
        print(f"Classification error: {e}")
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

class ClusterRequest(BaseModel):
    complaints: List[Dict[str, Any]]
    eps_km: Optional[float] = 0.8
    min_samples: Optional[int] = 2

@app.post("/clusters/compute")
def compute_hotspots_endpoint(req: ClusterRequest):
    """
    Computes geospatial clusters using DBSCAN and text similarity.
    """
    try:
        results = compute_clusters(
            req.complaints,
            eps_km=req.eps_km or 0.8,
            min_samples=req.min_samples or 2,
        )
        return {
            "success": True,
            "total_clusters": len(results),
            "clusters": results,
        }
    except Exception as e:
        print(f"Clustering error: {e}")
        raise HTTPException(status_code=500, detail=f"Clustering error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
