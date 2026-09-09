"""
Civic Grievance Intelligence Dashboard — NLP Training Script
Trains a TF-IDF + Logistic Regression classifier on civic complaints.
Reports evaluation metrics (Accuracy, F1, Precision, Recall) on a 20% held-out test set.
Saves model pipeline to models/classifier.joblib.
"""

import json
import os
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "training_data.json")
MODEL_DIR = os.path.join(BASE_DIR, "models")
MODEL_PATH = os.path.join(MODEL_DIR, "classifier.joblib")
REPORT_PATH = os.path.join(BASE_DIR, "evaluation_report.json")

def main():
    print("=" * 60)
    print("  CIVIC GRIEVANCE CLASSIFIER TRAINING & EVALUATION")
    print("=" * 60)

    # 1. Load Data
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    texts = [item["text"] for item in data]
    labels = [item["category"] for item in data]

    print(f"\n[1] Loaded {len(texts)} samples across {len(set(labels))} categories.")

    # 2. 80/20 Stratified Split
    X_train, X_test, y_train, y_test = train_test_split(
        texts,
        labels,
        test_size=0.20,
        random_state=42,
        stratify=labels
    )
    print(f"[2] Split: {len(X_train)} training samples, {len(X_test)} test samples (20% held-out).")

    # 3. Define Pipeline
    # Using TF-IDF with unigrams & bigrams + Logistic Regression with balanced weights
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(
            ngram_range=(1, 2),
            sublinear_tf=True,
            min_df=1,
            max_features=5000,
            stop_words='english'
        )),
        ('clf', LogisticRegression(
            C=2.0,
            max_iter=1000,
            class_weight='balanced',
            random_state=42
        ))
    ])

    # 4. Train
    print("[3] Training pipeline (TF-IDF + LogisticRegression)...")
    pipeline.fit(X_train, y_train)

    # 5. Evaluate on Test Set
    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    report_dict = classification_report(y_test, y_pred, output_dict=True)
    report_text = classification_report(y_test, y_pred, digits=4)

    print("\n" + "=" * 60)
    print(f"  HELD-OUT TEST SET ACCURACY: {acc * 100:.2f}%")
    print("=" * 60)
    print("\nClassification Report:\n")
    print(report_text)

    # 6. Save Model
    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)
    print(f"\n[4] Saved trained model pipeline to: {MODEL_PATH}")

    # 7. Save Evaluation Report for Viva / Documentation
    eval_summary = {
        "total_samples": len(texts),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "accuracy": round(acc, 4),
        "macro_avg_f1": round(report_dict["macro avg"]["f1-score"], 4),
        "weighted_avg_f1": round(report_dict["weighted avg"]["f1-score"], 4),
        "classes": sorted(list(set(labels))),
        "per_class": {
            cat: {
                "precision": round(report_dict[cat]["precision"], 4),
                "recall": round(report_dict[cat]["recall"], 4),
                "f1": round(report_dict[cat]["f1-score"], 4),
                "support": report_dict[cat]["support"]
            }
            for cat in sorted(list(set(labels)))
        }
    }
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(eval_summary, f, indent=2)
    print(f"[5] Saved evaluation metrics to: {REPORT_PATH}")

    # 8. Test Live Inference with Confidence Scores
    print("\n" + "=" * 60)
    print("  SAMPLE LIVE INFERENCES & CONFIDENCE SCORES")
    print("=" * 60)
    test_queries = [
        "Huge pile of garbage rotting near bus stand, bad smell",
        "Pipeline burst and drinking water is leaking on the road",
        "Sewage overflowing from open manhole into building compound",
        "Deep pothole on highway causing vehicle tires to burst",
        "Streetlight pole #12 is dark and flickering at night",
        "Loud music from party hall playing past midnight"
    ]
    for q in test_queries:
        probs = pipeline.predict_proba([q])[0]
        classes = pipeline.classes_
        top_idx = probs.argmax()
        pred_label = classes[top_idx]
        confidence = probs[top_idx]
        print(f"Text: \"{q}\"")
        print(f"  -> Predicted: [{pred_label.upper()}] (Confidence: {confidence * 100:.1f}%)")
        print()

if __name__ == "__main__":
    main()
