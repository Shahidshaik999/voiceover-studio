# VoiceOver Studio

Turn any script into natural human voice — powered by **Microsoft Edge Neural TTS**.

- 60+ neural voices including Andrew, Ava, Brian and more
- Indian language voices — Hindi, Telugu, Tamil, Kannada, Malayalam and more
- Speed and pitch controls
- Instant MP3 download
- Free, no signup, no API key

## Tech Stack

- **Backend** — Node.js + Express + `node-edge-tts`
- **Frontend** — Vanilla JS, Inter + Syne fonts, glassmorphism UI
- **TTS Engine** — Microsoft Edge Neural TTS (via WebSocket)

## Run Locally

```bash
npm install
node server.js
```

Open http://localhost:3000

## Deploy on Render

1. Connect this repo on [render.com](https://render.com)
2. Set **Build Command** → `npm install`
3. Set **Start Command** → `node server.js`
4. Set **Instance Type** → Free
5. Deploy — live in ~2 minutes

## Environment

Requires Node.js 18+. No environment variables needed.
