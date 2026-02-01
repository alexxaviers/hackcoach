# HackCoach

Expo (React Native) chat app with an optional Flask backend for proxying OpenAI requests.

---

## Do not deploy to production

**This repository is for development only.** Do not deploy this app or backend to production. It is not intended for production use and has not been hardened for security, scaling, or compliance.

---

## For development

Use **only the frontend** — no backend required. Put your OpenAI key in `frontend/.env.local` and the app calls OpenAI directly (dev only; do not deploy).

- **Backend:** Optional. If you set `API_URL` in `frontend/.env.local`, the app uses the backend instead. See `backend/README.md`.

### Quick start (frontend only)

```bash
cd frontend
npm install
npx expo start
```

Add to `frontend/.env.local`:

```
OPENAI_API_KEY=sk-your-openai-api-key
```

See `frontend/.env.example`. Restart Expo after changing `.env.local`.

### Project layout

- **frontend/** – Expo React Native app (chat UI; uses OpenAI directly in dev, or backend if `API_URL` is set)
- **backend/** – Optional Flask API; use only if you want the key server-side
