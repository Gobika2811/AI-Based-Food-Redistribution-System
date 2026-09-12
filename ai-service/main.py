import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load local environment variables
load_dotenv()

app = FastAPI(
    title="ResQFood AI Prediction Service",
    description="FastAPI microservice executing LSTM, Prophet, and Scikit-Learn algorithms to forecast waste risk and reorders.",
    version="1.0.0"
)

# CORS setup
origins = [
    "http://localhost:8000", # Main FastAPI backend
    "http://127.0.0.1:8000",
    "*"                      # Local access
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "ResQFood AI Service",
        "version": "1.0.0",
        "environment": os.getenv("APP_ENV", "development")
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "models": {
            "prophet": "available",
            "lstm": "available",
            "classifier": "available"
        }
    }

@app.post("/predict/waste-risk")
def predict_waste_risk(payload: dict):
    # Base endpoint structure for AI engine Module 2
    # Returns a mock risk score for early integration testing
    product_id = payload.get("product_id")
    quantity = payload.get("quantity", 0)
    days_to_expiry = payload.get("days_to_expiry", 10)
    
    # Simple risk rule logic as placeholder
    risk_score = min(100.0, max(0.0, (10 - days_to_expiry) * 10.0 + (quantity * 0.1)))
    
    return {
        "product_id": product_id,
        "risk_score": round(risk_score, 2),
        "waste_probability": round(risk_score / 100.0, 2),
        "status": "high_risk" if risk_score > 70 else "medium_risk" if risk_score > 30 else "low_risk"
    }
