
import os
import joblib
import numpy as np
from flask import Flask, request, jsonify, render_template
print("Starting Flask App...")
app = Flask(__name__)

MODEL_PATH = os.path.join("models", "phishing_model.pkl")
VECTORIZER_PATH = os.path.join("models", "vectorizer.pkl")

model = None
vectorizer = None

def load_artifacts():
    global model, vectorizer
    try:
        model = joblib.load(MODEL_PATH)
        vectorizer = joblib.load(VECTORIZER_PATH)
        print("[✓] Model and vectorizer loaded successfully.")
    except FileNotFoundError as e:
        print(f"[✗] Could not load model artifacts: {e}")

load_artifacts()


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    if not data or "email" not in data:
        return jsonify({"error": "No email content provided."}), 400

    email_text = data["email"].strip()
    if not email_text:
        return jsonify({"error": "Email content is empty."}), 400

    if model is None or vectorizer is None:
        return jsonify({"error": "Model not loaded. Please check server logs."}), 500

    try:
        features = vectorizer.transform([email_text])
        prediction = model.predict(features)[0]

        # Match your model's string output: "phishing" or "legitimate"
        is_phishing = str(prediction).lower() == "phishing"

        # Confidence score
        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(features)[0]
            confidence = float(np.max(proba)) * 100
        else:
            confidence = 99.0 if is_phishing else 97.0

        return jsonify({
            "is_phishing": is_phishing,
            "label": "Phishing" if is_phishing else "Legitimate",
            "confidence": round(confidence, 2)
        })

    except Exception as e:
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)