/**
 * VoiceOver Studio — Express + Microsoft Edge Neural TTS
 * Uses msedge-tts for free, high-quality, human-sounding voices.
 * Default voice: Andrew (en-US-AndrewNeural)
 */

const express        = require('express');
const fs             = require('fs');
const path           = require('path');
const crypto         = require('crypto');
const { EdgeTTS } = require('node-edge-tts');

const app       = express();
const PORT      = process.env.PORT || 3000;
const AUDIO_DIR = path.join(__dirname, 'public', 'audio');

if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

// ── Middleware ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ── Auto-clean audio files older than 2 hours ─────────────────────────────
function cleanOldAudio() {
  try {
    const now = Date.now();
    fs.readdirSync(AUDIO_DIR).forEach(f => {
      const fp = path.join(AUDIO_DIR, f);
      try { if (now - fs.statSync(fp).mtimeMs > 2 * 3600 * 1000) fs.unlinkSync(fp); } catch (_) {}
    });
  } catch (_) {}
}
setInterval(cleanOldAudio, 30 * 60 * 1000);

// ── Clean text — strip emojis, markdown, hashtags ─────────────────────────
function cleanText(raw) {
  return raw
    .replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1')
    .replace(/[\u{1F300}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FEFF}]/gu, '')
    .replace(/₹/g, 'rupees ').replace(/\$/g, 'dollars ')
    .replace(/#(\w+)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ── Voice list — curated Edge Neural voices ───────────────────────────────
const VOICES = [
  // ── English US (top picks) ────────────────────────────────────────────
  { id: 'en-US-AndrewNeural',            name: 'Andrew',            lang: 'en-US', gender: 'Male',   region: 'English' },
  { id: 'en-US-AndrewMultilingualNeural',name: 'Andrew Multilingual',lang:'en-US',  gender: 'Male',   region: 'English' },
  { id: 'en-US-AvaNeural',               name: 'Ava',               lang: 'en-US', gender: 'Female', region: 'English' },
  { id: 'en-US-EmmaNeural',              name: 'Emma',              lang: 'en-US', gender: 'Female', region: 'English' },
  { id: 'en-US-BrianNeural',             name: 'Brian',             lang: 'en-US', gender: 'Male',   region: 'English' },
  { id: 'en-US-GuyNeural',               name: 'Guy',               lang: 'en-US', gender: 'Male',   region: 'English' },
  { id: 'en-US-JennyNeural',             name: 'Jenny',             lang: 'en-US', gender: 'Female', region: 'English' },
  { id: 'en-US-AriaNeural',              name: 'Aria',              lang: 'en-US', gender: 'Female', region: 'English' },
  { id: 'en-US-EricNeural',              name: 'Eric',              lang: 'en-US', gender: 'Male',   region: 'English' },
  { id: 'en-US-ChristopherNeural',       name: 'Christopher',       lang: 'en-US', gender: 'Male',   region: 'English' },
  { id: 'en-US-RogerNeural',             name: 'Roger',             lang: 'en-US', gender: 'Male',   region: 'English' },
  { id: 'en-US-SteffanNeural',           name: 'Steffan',           lang: 'en-US', gender: 'Male',   region: 'English' },
  { id: 'en-US-MichelleNeural',          name: 'Michelle',          lang: 'en-US', gender: 'Female', region: 'English' },
  // ── English UK ────────────────────────────────────────────────────────
  { id: 'en-GB-RyanNeural',              name: 'Ryan (UK)',         lang: 'en-GB', gender: 'Male',   region: 'English' },
  { id: 'en-GB-SoniaNeural',             name: 'Sonia (UK)',        lang: 'en-GB', gender: 'Female', region: 'English' },
  { id: 'en-GB-ThomasNeural',            name: 'Thomas (UK)',       lang: 'en-GB', gender: 'Male',   region: 'English' },
  { id: 'en-GB-LibbyNeural',             name: 'Libby (UK)',        lang: 'en-GB', gender: 'Female', region: 'English' },
  // ── English AU / IN ───────────────────────────────────────────────────
  { id: 'en-AU-WilliamMultilingualNeural',name:'William (AU)',      lang: 'en-AU', gender: 'Male',   region: 'English' },
  { id: 'en-AU-NatashaNeural',            name:'Natasha (AU)',      lang: 'en-AU', gender: 'Female', region: 'English' },
  { id: 'en-IN-NeerjaNeural',             name:'Neerja (India)',    lang: 'en-IN', gender: 'Female', region: 'English' },
  { id: 'en-IN-PrabhatNeural',            name:'Prabhat (India)',   lang: 'en-IN', gender: 'Male',   region: 'English' },
  // ── Indian Languages ──────────────────────────────────────────────────
  { id: 'hi-IN-SwaraNeural',             name: 'Swara (Hindi)',     lang: 'hi-IN', gender: 'Female', region: 'Indian' },
  { id: 'hi-IN-MadhurNeural',            name: 'Madhur (Hindi)',    lang: 'hi-IN', gender: 'Male',   region: 'Indian' },
  { id: 'te-IN-MohanNeural',             name: 'Mohan (Telugu)',    lang: 'te-IN', gender: 'Male',   region: 'Indian' },
  { id: 'te-IN-ShrutiNeural',            name: 'Shruti (Telugu)',   lang: 'te-IN', gender: 'Female', region: 'Indian' },
  { id: 'ta-IN-PallaviNeural',           name: 'Pallavi (Tamil)',   lang: 'ta-IN', gender: 'Female', region: 'Indian' },
  { id: 'ta-IN-ValluvarNeural',          name: 'Valluvar (Tamil)',  lang: 'ta-IN', gender: 'Male',   region: 'Indian' },
  { id: 'kn-IN-GaganNeural',             name: 'Gagan (Kannada)',   lang: 'kn-IN', gender: 'Male',   region: 'Indian' },
  { id: 'kn-IN-SapnaNeural',             name: 'Sapna (Kannada)',   lang: 'kn-IN', gender: 'Female', region: 'Indian' },
  { id: 'ml-IN-MidhunNeural',            name: 'Midhun (Malayalam)',lang: 'ml-IN', gender: 'Male',   region: 'Indian' },
  { id: 'ml-IN-SobhanaNeural',           name: 'Sobhana (Malayalam)',lang:'ml-IN', gender: 'Female', region: 'Indian' },
  { id: 'mr-IN-AarohiNeural',            name: 'Aarohi (Marathi)',  lang: 'mr-IN', gender: 'Female', region: 'Indian' },
  { id: 'mr-IN-ManoharNeural',           name: 'Manohar (Marathi)', lang: 'mr-IN', gender: 'Male',   region: 'Indian' },
  { id: 'bn-IN-BashkarNeural',           name: 'Bashkar (Bengali)', lang: 'bn-IN', gender: 'Male',   region: 'Indian' },
  { id: 'bn-IN-TanishaaNeural',          name: 'Tanishaa (Bengali)',lang: 'bn-IN', gender: 'Female', region: 'Indian' },
  { id: 'gu-IN-DhwaniNeural',            name: 'Dhwani (Gujarati)', lang: 'gu-IN', gender: 'Female', region: 'Indian' },
  { id: 'gu-IN-NiranjanNeural',          name: 'Niranjan (Gujarati)',lang:'gu-IN', gender: 'Male',   region: 'Indian' },
  { id: 'pa-IN-OjasNeural',              name: 'Ojas (Punjabi)',    lang: 'pa-IN', gender: 'Male',   region: 'Indian' },
  { id: 'pa-IN-VaaniNeural',             name: 'Vaani (Punjabi)',   lang: 'pa-IN', gender: 'Female', region: 'Indian' },
  // ── European ─────────────────────────────────────────────────────────
  { id: 'es-ES-AlvaroNeural',            name: 'Alvaro (Spanish)',  lang: 'es-ES', gender: 'Male',   region: 'European' },
  { id: 'es-ES-ElviraNeural',            name: 'Elvira (Spanish)',  lang: 'es-ES', gender: 'Female', region: 'European' },
  { id: 'fr-FR-HenriNeural',             name: 'Henri (French)',    lang: 'fr-FR', gender: 'Male',   region: 'European' },
  { id: 'fr-FR-DeniseNeural',            name: 'Denise (French)',   lang: 'fr-FR', gender: 'Female', region: 'European' },
  { id: 'de-DE-ConradNeural',            name: 'Conrad (German)',   lang: 'de-DE', gender: 'Male',   region: 'European' },
  { id: 'de-DE-KatjaNeural',             name: 'Katja (German)',    lang: 'de-DE', gender: 'Female', region: 'European' },
  { id: 'it-IT-DiegoNeural',             name: 'Diego (Italian)',   lang: 'it-IT', gender: 'Male',   region: 'European' },
  { id: 'it-IT-ElsaNeural',              name: 'Elsa (Italian)',    lang: 'it-IT', gender: 'Female', region: 'European' },
  { id: 'pt-BR-AntonioNeural',           name: 'Antonio (Portuguese)',lang:'pt-BR', gender: 'Male',  region: 'European' },
  { id: 'pt-BR-FranciscaNeural',         name: 'Francisca (Portuguese)',lang:'pt-BR',gender:'Female',region: 'European' },
  // ── Asian ─────────────────────────────────────────────────────────────
  { id: 'ar-SA-HamedNeural',             name: 'Hamed (Arabic)',    lang: 'ar-SA', gender: 'Male',   region: 'Asian' },
  { id: 'ar-SA-ZariyahNeural',           name: 'Zariyah (Arabic)',  lang: 'ar-SA', gender: 'Female', region: 'Asian' },
  { id: 'zh-CN-YunxiNeural',             name: 'Yunxi (Chinese)',   lang: 'zh-CN', gender: 'Male',   region: 'Asian' },
  { id: 'zh-CN-XiaoxiaoNeural',          name: 'Xiaoxiao (Chinese)',lang: 'zh-CN', gender: 'Female', region: 'Asian' },
  { id: 'ja-JP-KeitaNeural',             name: 'Keita (Japanese)',  lang: 'ja-JP', gender: 'Male',   region: 'Asian' },
  { id: 'ja-JP-NanamiNeural',            name: 'Nanami (Japanese)', lang: 'ja-JP', gender: 'Female', region: 'Asian' },
  { id: 'ko-KR-InJoonNeural',            name: 'InJoon (Korean)',   lang: 'ko-KR', gender: 'Male',   region: 'Asian' },
  { id: 'ko-KR-SunHiNeural',             name: 'SunHi (Korean)',    lang: 'ko-KR', gender: 'Female', region: 'Asian' },
];

// ── GET /api/voices ───────────────────────────────────────────────────────
app.get('/api/voices', (_req, res) => res.json(VOICES));

// ── POST /api/generate ────────────────────────────────────────────────────
app.post('/api/generate', async (req, res) => {
  const { text, voice = 'en-US-AndrewNeural', rate = '+0%', pitch = '+0Hz' } = req.body;

  if (!text || typeof text !== 'string' || !text.trim())
    return res.status(400).json({ error: 'Script text is required.' });
  if (text.length > 10000)
    return res.status(400).json({ error: 'Script too long (max 10,000 chars).' });

  const cleaned = cleanText(text);
  if (!cleaned || cleaned.length < 3)
    return res.status(400).json({ error: 'No speakable text found after cleaning.' });

  const startMs  = Date.now();
  const uid      = crypto.randomBytes(8).toString('hex');
  const filename = `vo_${uid}.mp3`;
  const filepath = path.join(AUDIO_DIR, filename);

  try {
    const tts = new EdgeTTS({
      voice,
      lang: voice.split('-').slice(0, 2).join('-'),
      outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
      rate,
      pitch,
      timeout: 30000,
    });

    const chunks = [];
    for await (const chunk of tts.streamAudio(cleaned)) {
      if (Buffer.isBuffer(chunk)) chunks.push(chunk);
    }

    if (!chunks.length)
      return res.status(500).json({ error: 'No audio received. Please try again.' });

    const finalBuffer = Buffer.concat(chunks);
    fs.writeFileSync(filepath, finalBuffer);

    const sizeKb = Math.round(finalBuffer.length / 1024);

    return res.json({
      audioUrl:   `/audio/${filename}`,
      filename,
      durationMs: Date.now() - startMs,
      characters: cleaned.length,
      sizeKb,
    });

  } catch (err) {
    try { if (fs.existsSync(filepath)) fs.unlinkSync(filepath); } catch (_) {}
    console.error('[/api/generate]', err.message);
    return res.status(500).json({ error: 'TTS failed: ' + (err.message || 'Unknown error') });
  }
});

// ── Health ────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', engine: 'Microsoft Edge Neural TTS', time: new Date().toISOString() })
);

// ── SPA fallback ──────────────────────────────────────────────────────────
app.get('/{*path}', (_req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
);

// ── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎙️  VoiceOver Studio → http://localhost:${PORT}`);
  console.log(`   Engine : Microsoft Edge Neural TTS`);
  console.log(`   Default: Andrew (en-US-AndrewNeural)\n`);
});
