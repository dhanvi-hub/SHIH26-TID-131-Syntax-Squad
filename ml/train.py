import os
import csv
import json
import joblib
import numpy as np
from datetime import datetime
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, confusion_matrix
)
from feature_pipeline import FEATURE_NAMES, extract_features_for_transaction

def load_all_dataset(data_path="data/transactions.csv", feedback_path="data/human_feedback.csv"):
    transactions = []
    if os.path.exists(data_path):
        with open(data_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                row['amount'] = float(row['amount'])
                row['is_fraud'] = int(row['is_fraud'])
                transactions.append(row)
    
    # Merge human feedback labels if available (Ground Truth Overrides)
    feedback_map = {}
    if os.path.exists(feedback_path):
        with open(feedback_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Map human decision to ground truth label
                decision = row.get('decision')
                if decision == 'CONFIRMED_FRAUD':
                    label = 1
                elif decision in ['LEGITIMATE', 'FALSE_POSITIVE']:
                    label = 0
                else:
                    continue
                feedback_map[row.get('txn_id')] = label

    # Apply feedback overrides
    for txn in transactions:
        if txn['txn_id'] in feedback_map:
            txn['is_fraud'] = feedback_map[txn['txn_id']]

    # Sort transactions chronologically
    transactions.sort(key=lambda x: x.get('timestamp', ''))
    return transactions

def train_model():
    print("=" * 60)
    print("      TRAINING REAL MACHINE LEARNING FRAUD DETECTOR      ")
    print("=" * 60)

    transactions = load_all_dataset()
    if len(transactions) == 0:
        print("No transactions found in data/transactions.csv. Running dataset generator...")
        from generate_dataset import generate_dataset
        generate_dataset(num_rows=5000)
        transactions = load_all_dataset()

    print(f"Loaded {len(transactions)} total transactions for feature extraction...")

    # Extract feature matrix X and target y
    X = []
    y = []
    
    # Accumulate history to prevent future data leakage
    history = []
    for txn in transactions:
        features = extract_features_for_transaction(txn, history)
        X.append(features)
        y.append(txn['is_fraud'])
        history.append(txn)

    X = np.array(X)
    y = np.array(y)

    # 80/20 Chronological Split (Time-aware)
    split_idx = int(len(X) * 0.8)
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]

    print(f"Training set: {len(X_train)} samples ({np.sum(y_train)} frauds)")
    print(f"Test set:     {len(X_test)} samples ({np.sum(y_test)} frauds)")

    # Train Supervised Random Forest Classifier with balanced class weights
    rf = RandomForestClassifier(
        n_estimators=100,
        max_depth=12,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1
    )
    rf.fit(X_train, y_train)

    # Predictions & Probabilities on held-out test set
    y_pred = rf.predict(X_test)
    y_prob = rf.predict_proba(X_test)[:, 1]

    # Compute Evaluation Metrics
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    roc_auc = roc_auc_score(y_test, y_prob)
    pr_auc = average_precision_score(y_test, y_prob)
    cm = confusion_matrix(y_test, y_pred)

    print("\n" + "-" * 40)
    print("       MODEL EVALUATION METRICS       ")
    print("-" * 40)
    print(f"Accuracy:          {acc * 100:.2f}%")
    print(f"Precision:         {prec * 100:.2f}%")
    print(f"Recall:            {rec * 100:.2f}%")
    print(f"F1-Score:          {f1 * 100:.2f}%")
    print(f"ROC-AUC:           {roc_auc:.4f}")
    print(f"PR-AUC:            {pr_auc:.4f}")
    print("\nConfusion Matrix:")
    print(f"  TN: {cm[0][0]} | FP: {cm[0][1]}")
    print(f"  FN: {cm[1][0]} | TP: {cm[1][1]}")

    # Extract Feature Importances
    importances = dict(zip(FEATURE_NAMES, rf.feature_importances_))
    sorted_importances = sorted(importances.items(), key=lambda x: x[1], reverse=True)

    print("\nFeature Importances:")
    for feat, imp in sorted_importances:
        print(f"  - {feat:30s}: {imp * 100:6.2f}%")

    # Save Model Artifact & Metadata
    os.makedirs("models", exist_ok=True)
    model_path = "models/fraud_model.joblib"
    joblib.dump(rf, model_path)

    metadata = {
        "model_version": f"v1.{int(datetime.now().timestamp())}",
        "algorithm": "RandomForestClassifier",
        "n_estimators": 100,
        "class_weight": "balanced",
        "trained_at": datetime.now().isoformat(),
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "features": FEATURE_NAMES,
        "metrics": {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(roc_auc, 4),
            "pr_auc": round(pr_auc, 4),
            "confusion_matrix": cm.tolist()
        },
        "feature_importances": dict(sorted_importances)
    }

    metadata_path = "models/model_metadata.json"
    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2)

    print(f"\nModel artifact saved to: {model_path}")
    print(f"Metadata saved to:       {metadata_path}")
    print("=" * 60)

if __name__ == '__main__':
    train_model()
