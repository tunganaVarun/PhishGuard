# PhishGuard — Email Threat Analyzer

A professional cybersecurity web application that detects phishing emails using a trained Scikit-learn ML model, served via a Flask backend with a dark-themed terminal UI.

---

## 📁 Project Structure

```
phishguard/
│
├── app.py                  # Flask backend — loads model, serves routes
├── requirements.txt        # Python dependencies
├── README.md               # This file
│
├── models/
│   ├── phishing_model.pkl  # Trained Scikit-learn classifier
│   └── vectorizer.pkl      # Fitted TF-IDF / CountVectorizer
│
├── templates/
│   └── index.html          # Jinja2 HTML template (dark cybersecurity UI)
│
└── static/
    ├── style.css           # Dark-mode cybersecurity theme
    └── script.js           # Frontend logic (fetch API, UI state)
```

---

## ⚙️ Setup & Installation

### 1. Clone / copy your project

Make sure your folder looks like the structure above, with your `.pkl` files inside `models/`.

### 2. Create a virtual environment (recommended)

```bash
python -m venv venv

# Activate:
# Windows:
venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

---

## ▶️ Run the Application

```bash
python app.py
```

Then open your browser and go to:

```
http://localhost:5000
```

---

## 🔍 How It Works

1. User pastes an email into the textarea
2. JavaScript sends a `POST /analyze` request with the email content
3. Flask loads the model and vectorizer from `models/`
4. The vectorizer transforms the email text into a feature vector
5. The model predicts `"phishing"` or `"legitimate"`
6. Confidence score is extracted via `predict_proba` (if supported)
7. Result is returned as JSON and rendered in the UI

---

## 🧠 Model Integration

The app expects your model to:
- Be saved with `joblib.dump(model, "models/phishing_model.pkl")`
- Be saved with `joblib.dump(vectorizer, "models/vectorizer.pkl")`
- Return `"phishing"` or `"legitimate"` from `model.predict()`

If your model returns numeric labels (`0` / `1`), update line in `app.py`:

```python
# Current (string labels):
is_phishing = str(prediction).lower() == "phishing"

# For numeric labels (1 = phishing):
is_phishing = int(prediction) == 1
```

---

## 🌐 API Reference

### `POST /analyze`

**Request body:**
```json
{ "email": "Full email content here..." }
```

**Response:**
```json
{
  "is_phishing": true,
  "label": "Phishing",
  "confidence": 97.43
}
```

**Error response:**
```json
{ "error": "Description of the error" }
```

---

## 💡 Tips

- Press `Ctrl + Enter` (or `Cmd + Enter` on Mac) to analyze without clicking the button
- The model and vectorizer are loaded once at startup for performance
- For production deployment, use Gunicorn: `gunicorn -w 4 app:app`

---

## 🛡️ Tech Stack

| Layer     | Technology              |
|-----------|-------------------------|
| Backend   | Python 3.10+, Flask 3.x |
| ML        | Scikit-learn, joblib    |
| Frontend  | HTML5, CSS3, Vanilla JS |
| Fonts     | Share Tech Mono, Rajdhani (Google Fonts) |