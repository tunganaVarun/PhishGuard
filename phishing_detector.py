import joblib


model = joblib.load("models/phishing_model.pkl")
vectorizer = joblib.load("models/vectorizer.pkl")

print("=== Phishing Email Detector ===")

email = input("\nEnter Email Content:\n")

email_vector = vectorizer.transform([email])

prediction = model.predict(email_vector)

print("\nPrediction:")

if prediction[0] == "phishing":
    print("⚠️ PHISHING EMAIL DETECTED")
else:
    print("✅ LEGITIMATE EMAIL")