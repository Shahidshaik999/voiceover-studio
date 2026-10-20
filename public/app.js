/* ============================================================
   VoiceOver Studio — app.js (Professional UI v3)
   Microsoft Edge Neural TTS · Default: Andrew
============================================================ */

const SAMPLE = `Hey everyone, welcome back to the channel.

Today we are diving into something that completely changed how I approach my daily routine. Over the past three months, I have been testing a productivity system that most people have never heard of, and the results have honestly been remarkable.

By the end of this video you will have everything you need to try it yourself. So stay until the end, because the last tip made the biggest difference for me.

Let us get into it.`;

const LANG_FLAGS = {
  'en-US':'🇺🇸','en-GB':'🇬🇧','en-AU':'🇦🇺','en-IN':'🇮🇳',
  'en-CA':'🇨🇦','en-HK':'🇭🇰','en-IE':'🇮🇪','en-NZ':'🇳🇿',
  'en-SG':'🇸🇬','en-ZA':'🇿🇦','en-NG':'🇳🇬','en-PH':'🇵🇭',
  'hi-IN':'🇮🇳','te-IN':'🇮🇳','ta-IN':'🇮🇳','kn-IN':'🇮🇳',
  'ml-IN':'🇮🇳','mr-IN':'🇮🇳','bn-IN':'🇮🇳','gu-IN':'🇮🇳','pa-IN':'🇮🇳',
  'es-ES':'🇪🇸','fr-FR':'🇫🇷','de-DE':'🇩🇪','it-IT':'🇮🇹',
  'pt-BR':'🇧🇷','ar-SA':'🇸🇦','zh-CN':'🇨🇳','ja-JP':'🇯🇵','ko-KR':'🇰🇷',
};
const flagFor = lang => LANG_FLAGS[lang] || '🌐';

// ── State ─────────────────────────────────────────────────────────────────
let allVoices       = [];
let filteredVoices  = [];
let selectedVoiceId = 'en-US-AndrewNeural';
let currentFilter   = 'English';
let rateValue       = '+0%';
let pitchValue      = '+0Hz';
let currentAudioUrl = null;
let currentFilename = null;

// ── DOM refs ──────────────────────────────────────────────────────────────
const scriptInput     = document.getElementById('scriptInput');
const charCount       = document.getElementById('charCount');
const voiceList       = document.getElementById('voiceList');
const voiceCountBadge = document.getElementById('voiceCountBadge');
const voiceSearch     = document.getElementById('voiceSearch');
const generateBtn     = document.getElementById('generateBtn');
const loadingState    = document.getElementById('loadingState');
const loadingMsg      = document.getElementById('loadingMsg');
const errorState      = document.getElementById('errorState');
const errorMsg        = document.getElementById('errorMessage');
const resultCard      = document.getElementById('resultCard');
const audioPlayer     = document.getElementById('audioPlayer');
const resultMeta      = document.getElementById('resultMeta');
const downloadBtn     = document.getElementById('downloadBtn');
const rateSlider      = document.getElementById('rateSlider');
const rateDisplay     = document.getElementById('rateDisplay');
const pitchSlider     = document.getElementById('pitchSlider');
const pitchDisplay    = document.getElementById('pitchDisplay');

// ── Load voices ────────────────────────────────────────────────────────────
async function loadVoices() {
  try {
    const res  = await fetch('/api/voices');
    const data = await res.json();
    allVoices  = data;
    applyFilter(currentFilter);
  } catch (err) {
    voiceList.innerHTML = `<p class="no-voices-msg">Could not load voices — ${err.message}</p>`;
    voiceCountBadge.textContent = 'Error';
  }
}
loadVoices();

// ── Filter + render ────────────────────────────────────────────────────────
function applyFilter(filter) {
  currentFilter = filter;
  const q = (voiceSearch.value || '').toLowerCase().trim();

  filteredVoices = allVoices.filter(v => {
    const regionOk = filter === 'All' || (v.region || '') === filter;
    const searchOk = !q ||
      (v.name || '').toLowerCase().includes(q) ||
      (v.lang || '').toLowerCase().includes(q) ||
      (v.gender || '').toLowerCase().includes(q);
    return regionOk && searchOk;
  });

  renderVoices();
}

function renderVoices() {
  voiceList.innerHTML = '';

  if (!filteredVoices.length) {
    voiceList.innerHTML = '<p class="no-voices-msg">No voices match your search.</p>';
    voiceCountBadge.textContent = '0 voices';
    return;
  }

  voiceCountBadge.textContent = `${filteredVoices.length} voices`;

  const frag = document.createDocumentFragment();
  filteredVoices.forEach(v => {
    const card = document.createElement('div');
    card.className = 'voice-card' + (v.id === selectedVoiceId ? ' voice-card--selected' : '');
    card.setAttribute('role', 'option');
    card.setAttribute('aria-selected', v.id === selectedVoiceId ? 'true' : 'false');
    card.dataset.id = v.id;

    card.innerHTML = `
      <div class="voice-card__top">
        <span class="voice-card__flag" aria-hidden="true">${flagFor(v.lang)}</span>
        <span class="voice-card__check" aria-hidden="true">
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </div>
      <span class="voice-card__name">${v.name}</span>
      <span class="voice-card__meta">${v.lang} &middot; ${v.gender}</span>
    `;

    card.addEventListener('click', () => selectVoice(v.id));
    frag.appendChild(card);
  });
  voiceList.appendChild(frag);
}

function selectVoice(id) {
  selectedVoiceId = id;
  document.querySelectorAll('.voice-card').forEach(c => {
    const selected = c.dataset.id === id;
    c.classList.toggle('voice-card--selected', selected);
    c.setAttribute('aria-selected', selected ? 'true' : 'false');
  });
}

// ── Filter buttons ─────────────────────────────────────────────────────────
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('filter-btn--active'));
    btn.classList.add('filter-btn--active');
    applyFilter(btn.dataset.filter);
  });
});
voiceSearch.addEventListener('input', () => applyFilter(currentFilter));

// ── Character counter ──────────────────────────────────────────────────────
scriptInput.addEventListener('input', () => {
  const len = scriptInput.value.length;
  charCount.textContent = len.toLocaleString();
  charCount.style.color = len > 9000 ? '#f87171' : '';
});

// ── Script buttons ─────────────────────────────────────────────────────────
document.getElementById('clearBtn').addEventListener('click', () => {
  scriptInput.value = ''; charCount.textContent = '0';
});
document.getElementById('pasteBtn').addEventListener('click', async () => {
  try {
    const t = await navigator.clipboard.readText();
    scriptInput.value = t; charCount.textContent = t.length.toLocaleString();
  } catch { showError('Clipboard permission denied — use Ctrl+V to paste.'); }
});
document.getElementById('sampleBtn').addEventListener('click', () => {
  scriptInput.value = SAMPLE;
  charCount.textContent = SAMPLE.length.toLocaleString();
});

// ── Rate slider ────────────────────────────────────────────────────────────
function updateRateDisplay(val) {
  const n = parseInt(val, 10);
  if (n === 0)       rateDisplay.textContent = 'Normal';
  else if (n > 0)    rateDisplay.textContent = `+${n}% Faster`;
  else               rateDisplay.textContent = `${n}% Slower`;
  rateValue = (n >= 0 ? '+' : '') + n + '%';
}
rateSlider.addEventListener('input', () => updateRateDisplay(rateSlider.value));

// ── Pitch slider ───────────────────────────────────────────────────────────
function updatePitchDisplay(val) {
  const n = parseInt(val, 10);
  if (n === 0)       pitchDisplay.textContent = 'Normal';
  else if (n > 0)    pitchDisplay.textContent = `+${n}Hz Higher`;
  else               pitchDisplay.textContent = `${n}Hz Lower`;
  pitchValue = (n >= 0 ? '+' : '') + n + 'Hz';
}
pitchSlider.addEventListener('input', () => updatePitchDisplay(pitchSlider.value));

// ── Preset buttons ─────────────────────────────────────────────────────────
document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const slow = btn.dataset.slow === 'true';
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('preset-btn--active'));
    btn.classList.add('preset-btn--active');
    rateSlider.value = slow ? '-20' : '0';
    pitchSlider.value = '0';
    updateRateDisplay(rateSlider.value);
    updatePitchDisplay(pitchSlider.value);
  });
});

// ── Generate ───────────────────────────────────────────────────────────────
generateBtn.addEventListener('click', generate);

async function generate() {
  const text = scriptInput.value.trim();
  if (!text)            { showError('Please enter your script first.'); return; }
  if (!selectedVoiceId) { showError('Please select a voice.'); return; }
  if (text.length < 5)  { showError('Script is too short.'); return; }

  hideError();
  hideResult();
  setLoading(true);

  if (currentAudioUrl?.startsWith('blob:')) URL.revokeObjectURL(currentAudioUrl);
  currentAudioUrl = null; currentFilename = null;

  try {
    const res  = await fetch('/api/generate', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice: selectedVoiceId, rate: rateValue, pitch: pitchValue }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);

    currentAudioUrl = data.audioUrl;
    currentFilename = data.filename;

    audioPlayer.src = data.audioUrl;
    audioPlayer.load();
    audioPlayer.play().catch(() => {});

    const voice = allVoices.find(v => v.id === selectedVoiceId);
    resultMeta.innerHTML = `
      <span>Voice: <strong>${voice?.name || selectedVoiceId}</strong></span>
      <span>Language: <strong>${voice?.lang || '—'}</strong></span>
      <span>Speed: <strong>${rateValue}</strong></span>
      <span>Characters: <strong>${data.characters?.toLocaleString()}</strong></span>
      <span>File size: <strong>${data.sizeKb} KB</strong></span>
      <span>Generated in: <strong>${data.durationMs}ms</strong></span>
    `;

    showResult();
  } catch (err) {
    showError(err.message || 'Generation failed. Please try again.');
  } finally {
    setLoading(false);
  }
}

// ── Download ───────────────────────────────────────────────────────────────
downloadBtn.addEventListener('click', () => {
  if (!currentAudioUrl) return;
  const a = document.createElement('a');
  a.href     = currentAudioUrl;
  a.download = currentFilename || `voiceover_${Date.now()}.mp3`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

document.getElementById('regenerateBtn').addEventListener('click', () => { hideResult(); generate(); });
document.getElementById('newScriptBtn').addEventListener('click', () => {
  hideResult();
  scriptInput.value = ''; charCount.textContent = '0';
  scriptInput.focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ── UI state helpers ───────────────────────────────────────────────────────
function setLoading(on) {
  generateBtn.disabled = on;
  generateBtn.querySelector('.generate-btn__label').textContent =
    on ? 'Generating…' : 'Generate Voiceover';
  loadingState.classList.toggle('hidden', !on);
}
function showError(msg)  { errorMsg.textContent = msg; errorState.classList.remove('hidden'); }
function hideError()     { errorState.classList.add('hidden'); }
function showResult()    { resultCard.classList.remove('hidden'); resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
function hideResult()    { resultCard.classList.add('hidden'); }
