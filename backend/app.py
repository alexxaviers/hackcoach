"""
Flask backend that proxies chat requests to OpenAI.
Keeps OPENAI_API_KEY server-side; the mobile app never sees it.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env.local then .env from backend directory
_backend_dir = Path(__file__).resolve().parent
load_dotenv(_backend_dir / ".env.local")
load_dotenv(_backend_dir / ".env")

import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["*"])  # Restrict in production to your app's origin

OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/chat", methods=["POST"])
def chat():
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return jsonify({"error": "OPENAI_API_KEY not configured"}), 500

    body = request.get_json()
    if not body or "messages" not in body:
        return jsonify({"error": "Request body must include 'messages' array"}), 400

    messages = body["messages"]
    if not isinstance(messages, list) or not messages:
        return jsonify({"error": "'messages' must be a non-empty array"}), 400

    model = body.get("model", "gpt-4o-mini")
    max_tokens = body.get("max_tokens", 1024)

    try:
        resp = requests.post(
            OPENAI_API_URL,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
            json={
                "model": model,
                "messages": messages,
                "max_tokens": max_tokens,
            },
            timeout=60,
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as e:
        if hasattr(e, "response") and e.response is not None:
            try:
                err = e.response.json()
                msg = err.get("error", {}).get("message", str(e))
            except Exception:
                msg = e.response.text or str(e)
        else:
            msg = str(e)
        return jsonify({"error": msg}), 502

    choices = data.get("choices", [])
    if not choices:
        return jsonify({"error": "No response from OpenAI"}), 502

    message = choices[0].get("message", {})
    content = message.get("content", "").strip() or "No response."

    return jsonify({"content": content, "message": message})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_DEBUG", "0") == "1")
