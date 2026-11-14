/**
 * Audio engine for Monster Feast (Section 7):
 * - Speech (manifest.json clip lookup -> Web Speech API fallback)
 * - Synthesized Web Audio SFX (zero audio files required)
 * - Light bouncy background music loop with automatic speech ducking
 */

import { getSettings, getMonsterMeta } from './progress.js';

const PREFERRED_VOICES = [
  'Google US English',
  'Samantha',
  'Aria',
  'Jenny'
];

let manifest = {};
let audioCtx = null;
let masterGain = null;
let sfxGain = null;
let musicGain = null;
let musicTimer = null;
let musicStep = 0;
let isDucked = false;
let duckSafetyTimer = null;
let currentClipAudio = null;
let unlocked = false;
let cachedVoice = null;

// Load manifest silently (empty {} is valid in v1)
export async function initAudio() {
  try {
    if (window.location.protocol !== 'file:') {
      const res = await fetch('audio/manifest.json', { cache: 'no-cache' });
      if (res.ok) {
        manifest = await res.json();
      }
    }
  } catch {
    manifest = {};
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    refreshVoice();
    window.speechSynthesis.onvoiceschanged = refreshVoice;
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopMusicLoop();
      stopSpeech();
    } else {
      syncMusicState();
    }
  });
}

function refreshVoice() {
  try {
    if (!('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || !voices.length) return;

    for (const preferred of PREFERRED_VOICES) {
      const found = voices.find((v) => v.name.includes(preferred));
      if (found) {
        cachedVoice = found;
        return;
      }
    }
    const enUs = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('en-us'));
    if (enUs) {
      cachedVoice = enUs;
      return;
    }
    const anyEn = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('en'));
    if (anyEn) {
      cachedVoice = anyEn;
    }
  } catch {
    // Ignore speech synthesis inspection errors
  }
}

function ensureContext() {
  if (audioCtx) return audioCtx;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  try {
    audioCtx = new Ctx();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.85;
    masterGain.connect(audioCtx.destination);

    sfxGain = audioCtx.createGain();
    sfxGain.gain.value = 0.75;
    sfxGain.connect(masterGain);

    musicGain = audioCtx.createGain();
    musicGain.gain.value = 0.16;
    musicGain.connect(masterGain);
    return audioCtx;
  } catch {
    return null;
  }
}

export function unlockAudio() {
  if (unlocked && audioCtx && audioCtx.state === 'running') return;
  unlocked = true;
  const ctx = ensureContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  syncMusicState();
}

export function syncMusicState() {
  const settings = getSettings();
  if (!settings.music || document.hidden) {
    stopMusicLoop();
    return;
  }
  if (!unlocked) return;
  startMusicLoop();
}

function setMusicDuck(duck) {
  isDucked = duck;
  if (duckSafetyTimer) {
    clearTimeout(duckSafetyTimer);
    duckSafetyTimer = null;
  }
  if (!audioCtx || !musicGain) return;
  const target = duck ? 0.045 : 0.16;
  const now = audioCtx.currentTime;
  musicGain.gain.cancelScheduledValues(now);
  musicGain.gain.setTargetAtTime(target, now, 0.08);
  if (duck) {
    duckSafetyTimer = setTimeout(() => setMusicDuck(false), 4500);
  }
}

// Light bouncy marimba melody in C major (108 BPM eighth notes)
const MELODY_NOTES = [
  523.25, 0, 659.25, 783.99, 659.25, 0, 587.33, 523.25,
  440.00, 0, 523.25, 659.25, 587.33, 0, 493.88, 392.00,
  523.25, 659.25, 783.99, 0, 880.00, 783.99, 659.25, 523.25,
  587.33, 0, 659.25, 587.33, 523.25, 0, 392.00, 0
];

const BASS_NOTES = [
  130.81, 0, 196.00, 0, 130.81, 0, 196.00, 0,
  110.00, 0, 164.81, 0, 98.00, 0, 146.83, 0,
  130.81, 0, 196.00, 0, 174.61, 0, 130.81, 0,
  146.83, 0, 98.00, 0, 130.81, 0, 130.81, 0
];

function playMusicNote(freq, duration, type, gainScale) {
  if (!audioCtx || !musicGain || audioCtx.state !== 'running' || !freq) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);

  g.gain.setValueAtTime(0.0001, now);
  g.gain.linearRampToValueAtTime(gainScale, now + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(g);
  g.connect(musicGain);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function startMusicLoop() {
  if (musicTimer || !getSettings().music || document.hidden) return;
  const ctx = ensureContext();
  if (!ctx) return;

  musicTimer = setInterval(() => {
    if (!getSettings().music || document.hidden) {
      stopMusicLoop();
      return;
    }
    if (!audioCtx || audioCtx.state !== 'running') return;

    const idx = musicStep % MELODY_NOTES.length;
    const mel = MELODY_NOTES[idx];
    const bass = BASS_NOTES[idx];
    if (mel) playMusicNote(mel, 0.22, 'triangle', 0.35);
    if (bass) playMusicNote(bass, 0.28, 'sine', 0.28);
    musicStep += 1;
  }, 260);
}

export function stopMusicLoop() {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}

export function stopSpeech() {
  if (currentClipAudio) {
    try {
      currentClipAudio.pause();
      currentClipAudio.currentTime = 0;
    } catch {
      // Ignore
    }
    currentClipAudio = null;
  }
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  } catch {
    // Ignore
  }
  setMusicDuck(false);
}

/**
 * Speak an English phrase using manifest clips first, else Web Speech API.
 */
export function speak(text, options = {}) {
  if (!text) return;
  const settings = getSettings();
  const monsterId = options.monsterId || 'purple';
  const pitch = options.pitch || getMonsterMeta(monsterId).pitch || 1.0;
  const isSlow = Boolean(options.slow) || settings.speed === 'slow';

  stopSpeech();

  // Check audio/manifest.json exact match
  const clipPath = manifest[text] || manifest[text.toLowerCase()];
  if (clipPath) {
    try {
      setMusicDuck(true);
      const audio = new Audio(`audio/clips/${clipPath}`);
      currentClipAudio = audio;
      audio.playbackRate = isSlow ? 0.8 : 1.0;
      audio.onended = () => setMusicDuck(false);
      audio.onerror = () => {
        setMusicDuck(false);
        speakWithSynth(text, pitch, isSlow);
      };
      audio.play().catch(() => {
        setMusicDuck(false);
        speakWithSynth(text, pitch, isSlow);
      });
      return;
    } catch {
      setMusicDuck(false);
    }
  }

  speakWithSynth(text, pitch, isSlow);
}

function speakWithSynth(text, pitch, isSlow) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    if (!cachedVoice) refreshVoice();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    if (cachedVoice) utter.voice = cachedVoice;
    utter.rate = isSlow ? 0.7 : 0.9;
    utter.pitch = Math.max(0.8, Math.min(1.4, pitch));
    utter.volume = 1.0;

    setMusicDuck(true);
    utter.onend = () => setMusicDuck(false);
    utter.onerror = () => setMusicDuck(false);

    window.speechSynthesis.speak(utter);
  } catch {
    setMusicDuck(false);
  }
}

// ======================================================
// Synthesized Web Audio SFX (Section 7)
// ======================================================

function canPlaySfx() {
  if (!getSettings().sound) return false;
  if (!unlocked) return false;
  const ctx = ensureContext();
  if (!ctx) return false;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx.state === 'running';
}

function createNoiseBuffer(ctx, durationSec) {
  const sampleRate = ctx.sampleRate;
  const length = Math.max(1, Math.floor(sampleRate * durationSec));
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

export function playSfx(name) {
  if (!canPlaySfx()) return;
  const ctx = audioCtx;
  const now = ctx.currentTime;

  switch (name) {
    case 'click': {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.045);
      g.gain.setValueAtTime(0.22, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(g);
      g.connect(sfxGain);
      osc.start(now);
      osc.stop(now + 0.07);
      break;
    }

    case 'pickup': {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.08);
      g.gain.setValueAtTime(0.24, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(g);
      g.connect(sfxGain);
      osc.start(now);
      osc.stop(now + 0.1);
      break;
    }

    case 'drop': {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.1);
      g.gain.setValueAtTime(0.28, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      osc.connect(g);
      g.connect(sfxGain);
      osc.start(now);
      osc.stop(now + 0.12);
      break;
    }

    case 'bell': {
      [1046.5, 1567.98, 2093.0].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        g.gain.setValueAtTime(0.24 / (idx + 1), now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        osc.connect(g);
        g.connect(sfxGain);
        osc.start(now);
        osc.stop(now + 0.58);
      });
      break;
    }

    case 'chomp': {
      // Thud + crunch
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.12);
      g.gain.setValueAtTime(0.45, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
      osc.connect(g);
      g.connect(sfxGain);
      osc.start(now);
      osc.stop(now + 0.14);

      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 0.1);
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.25, now);
      ng.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      noise.connect(filter);
      filter.connect(ng);
      ng.connect(sfxGain);
      noise.start(now);
      break;
    }

    case 'munch': {
      for (let i = 0; i < 4; i++) {
        const t = now + i * 0.13;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220 + (i % 2) * 50, t);
        osc.frequency.exponentialRampToValueAtTime(110, t + 0.08);
        g.gain.setValueAtTime(0.22, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        osc.connect(g);
        g.connect(sfxGain);
        osc.start(t);
        osc.stop(t + 0.1);
      }
      break;
    }

    case 'burp': {
      const osc = ctx.createOscillator();
      const mod = ctx.createOscillator();
      const modGain = ctx.createGain();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(145, now);
      osc.frequency.exponentialRampToValueAtTime(68, now + 0.35);

      mod.frequency.setValueAtTime(26, now);
      modGain.gain.setValueAtTime(32, now);
      mod.connect(modGain);
      modGain.connect(osc.frequency);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(420, now);

      g.gain.setValueAtTime(0.01, now);
      g.gain.linearRampToValueAtTime(0.28, now + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(filter);
      filter.connect(g);
      g.connect(sfxGain);
      mod.start(now);
      osc.start(now);
      mod.stop(now + 0.4);
      osc.stop(now + 0.4);
      break;
    }

    case 'yuck': {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.linearRampToValueAtTime(135, now + 0.28);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(750, now);
      g.gain.setValueAtTime(0.22, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(filter);
      filter.connect(g);
      g.connect(sfxGain);
      osc.start(now);
      osc.stop(now + 0.32);
      break;
    }

    case 'boing': {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.14);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.28);
      g.gain.setValueAtTime(0.26, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(g);
      g.connect(sfxGain);
      osc.start(now);
      osc.stop(now + 0.32);
      break;
    }

    case 'squeak': {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.exponentialRampToValueAtTime(1120, now + 0.09);
      osc.frequency.exponentialRampToValueAtTime(860, now + 0.16);
      g.gain.setValueAtTime(0.22, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(g);
      g.connect(sfxGain);
      osc.start(now);
      osc.stop(now + 0.2);
      break;
    }

    case 'sparkle': {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const t = now + idx * 0.065;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.2, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        osc.connect(g);
        g.connect(sfxGain);
        osc.start(t);
        osc.stop(t + 0.3);
      });
      break;
    }

    case 'eggWobble': {
      [0, 0.12].forEach((offset, idx) => {
        const t = now + offset;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(idx === 0 ? 310 : 370, t);
        osc.frequency.exponentialRampToValueAtTime(220, t + 0.08);
        g.gain.setValueAtTime(0.22, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        osc.connect(g);
        g.connect(sfxGain);
        osc.start(t);
        osc.stop(t + 0.1);
      });
      break;
    }

    case 'eggCrack': {
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 0.14);
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1200, now);
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.32, now);
      ng.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      noise.connect(filter);
      filter.connect(ng);
      ng.connect(sfxGain);
      noise.start(now);

      setTimeout(() => playSfx('sparkle'), 120);
      break;
    }
  }
}
