# 🎙️ VoiceOver Studio

Convert your YouTube scripts into studio-quality humanized AI voiceovers — powered by [ElevenLabs](https://elevenlabs.io).

---

## Features

- ✍️ Paste any script (up to 5,000 characters)
- 🎭 Choose from 9 natural AI voices (male & female)
- 🎛️ Fine-tune Stability, Similarity, and Style
- ⚡ One-click generation — audio ready in seconds
- ⬇️ Download as MP3
- 🔑 Your API key stays in your browser (never stored on server)

---

## Quick Start

### 1. Install Node.js (v18 or higher)
Download from https://nodejs.org

### 2. Install dependencies
```bash
cd voiceover-studio
npm install
```

### 3. Start the server
```bash
npm start
```

### 4. Open in browser
```
http://localhost:3000
```

### 5. Get your free ElevenLabs API key
1. Sign up at https://elevenlabs.io (free)
2. Go to **Profile → API Keys**
3. Copy your key and paste it into the **API Key** section at the bottom of the app

> Free tier: **10,000 characters/month** — enough for ~5–10 YouTube scripts.

---

## Development (auto-reload)
```bash
npm run dev
```

---

## Project Structure

```
voiceover-studio/
├── public/
│   ├── index.html      ← UI
│   ├── style.css       ← Dark theme styles
│   ├── app.js          ← Frontend logic
│   └── audio/          ← Generated MP3 files (auto-cleaned after 1 hour)
├── server.js           ← Express backend + ElevenLabs proxy
├── package.json
└── README.md
```

---

## Notes

- Audio files are automatically deleted after **1 hour** to save disk space.
- The server acts as a proxy — your API key is sent from your browser to the local server only, never to any third party.
- Requires **Node.js 18+** (uses built-in `fetch`, no extra HTTP libraries).
