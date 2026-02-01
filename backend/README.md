# HackCoach Backend

Flask API that proxies chat requests to OpenAI. The API key stays on the server; the mobile app never sees it.

## Setup

1. Create a virtual environment and install dependencies:

   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate   # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. Copy `.env.example` to `.env` or `.env.local` and set your OpenAI key:

   ```bash
   cp .env.example .env.local
   # Edit .env.local and set OPENAI_API_KEY=sk-your-key
   ```

3. Run the server:

   ```bash
   python app.py
   ```

   Server runs at `http://localhost:5000` by default. Use `PORT=8000 python app.py` to change the port.

## Endpoints

- **GET /health** – Returns `{ "status": "ok" }`.
- **POST /chat** – Proxies to OpenAI chat completions.
  - Body: `{ "messages": [ { "role": "user"|"assistant", "content": "..." } ], "model": "gpt-4o-mini", "max_tokens": 1024 }`
  - Response: `{ "content": "...", "message": { ... } }`

## Frontend

In the frontend `.env.local`, set the backend URL so the app can reach it:

- **Same machine (simulator / device on same Wi‑Fi):**  
  `API_URL=http://localhost:5000`  
  or use your machine’s LAN IP, e.g. `API_URL=http://192.168.1.10:5000`.

- **Device on different network (e.g. tunnel):**  
  Use a tunnel (ngrok, etc.) to expose the backend and set `API_URL=https://your-tunnel-url`.

The frontend `app.config.js` reads `API_URL` from `.env.local`; default is `http://localhost:5000`.
