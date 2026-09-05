import os
import sys
import json
import joblib
import numpy as np
import argparse
from feature_pipeline import FEATURE_NAMES, extract_features_for_transaction
from train import load_all_dataset

def load_model_and_metadata():
    model_path = "models/fraud_model.joblib"
    meta_path = "models/model_metadata.json"
    
    if not os.path.exists(model_path):
        # Auto-train if missing
        from train import train_model
        train_model()
        
    model = joblib.load(model_path)
    metadata = {}
    if os.path.exists(meta_path):
        with open(meta_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
            
    return model, metadata

def predict_transaction(txn_data, user_history=None):
    model, metadata = load_model_and_metadata()
    
    if user_history is None:
        user_history = load_all_dataset()

    features = extract_features_for_transaction(txn_data, user_history)
    X = np.array([features])

    # Probability of Class 1 (Fraud)
    prob_fraud = float(model.predict_proba(X)[0][1])
    ml_risk_score = min(100, max(0, round(prob_fraud * 100)))

    classification = "SAFE"
    if ml_risk_score >= 65:
        classification = "FRAUD"
    elif ml_risk_score >= 35:
        classification = "SUSPICIOUS"

    # Feature Importance Attribution
    importances = metadata.get("feature_importances", {})
    feature_contributions = []
    for name, val, imp in zip(FEATURE_NAMES, features, model.feature_importances_):
        feature_contributions.append({
            "feature": name,
            "value": val,
            "importance": round(float(imp), 4)
        })
    
    feature_contributions.sort(key=lambda x: x["importance"], reverse=True)

    result = {
        "success": True,
        "ml_probability": round(prob_fraud, 4),
        "ml_risk_score": ml_risk_score,
        "ml_classification": classification,
        "model_version": metadata.get("model_version", "v1.0.0"),
        "top_features": feature_contributions[:5],
        "extracted_features": dict(zip(FEATURE_NAMES, features))
    }
    return result

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Predict fraud probability for a transaction.")
    parser.add_argument("--json", type=str, help="Transaction JSON string")
    parser.add_argument("--sample", action="store_true", help="Run sample prediction test")
    args = parser.parse_args()

    if args.sample:
        sample_txn = {
            "txn_id": "TXN-TEST-999",
            "user_id": "USR001",
            "amount": 75000.0,
            "location": "Jamtara, Jharkhand",
            "ip": "185.220.101.5",
            "device": "desktop",
            "timestamp": "2026-09-04T20:00:00.000Z"
        }
        res = predict_transaction(sample_txn)
        print(json.dumps(res, indent=2))
    elif args.json:
        txn_data = json.loads(args.json)
        res = predict_transaction(txn_data)
        print(json.dumps(res))
    else:
        # Read from stdin
        input_data = sys.stdin.read()
        if input_data.strip():
            txn_data = json.loads(input_data)
            res = predict_transaction(txn_data)
            print(json.dumps(res))
        else:
            print(json.dumps({"error": "No input transaction provided"}))
