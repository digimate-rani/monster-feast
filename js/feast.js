/**
 * Feast gameplay controller (Section 3 & Section 8):
 * - Manages level orders (6 per level)
 * - Pointer-based drag and drop with tilt, shadow, snap-back, and parabolic spit-back
 * - Monster mouth tracking & proximity mouth opening
 * - Serving plate + Done bell for multi-item orders
 * - Particle FX canvas (hearts, stars, sparkles, confetti)
 */

import { COLOR_STYLES } from './items.js';
import { ORDERS_PER_LEVEL, generateOrder } from './orders.js';
import {
  getProgress,
  addTreats,
  incrementMonsterEaten,
  recordStageStars,
  getSettings
} from './progress.js';
import { playSfx, speak, stopSpeech } from './audio.js';
import { MonsterRig } from './monster.js';

// ======================================================
// Particle FX System
// ======================================================
const particles = [];
let fxCanvas = null;
let fxCtx = null;
let fxRaf = null;

export function initFxCanvas(canvasEl) {
  fxCanvas = canvasEl;
  fxCtx = canvasEl ? canvasEl.getContext('2d') : null;
  resizeFxCanvas();
  window.addEventListener('resize', resizeFxCanvas);
}

function resizeFxCanvas() {
  if (!fxCanvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  fxCanvas.width = window.innerWidth * dpr;
  fxCanvas.height = window.innerHeight * dpr;
  if (fxCtx) {
    fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}

export function spawnParticles(x, y, type = 'celebrate', count = 20) {
  if (!fxCtx) return;
  const colors = ['#FF5A5F', '#FFD166', '#4ADE80', '#4CC9F0', '#C084FC', '#FF85B3'];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = type === 'confetti' ? 3 + Math.random() * 7 : 2 + Math.random() * 5;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (type === 'confetti' ? 5 : 3.2),
      size: type === 'confetti' ? 7 + Math.random() * 6 : 10 + Math.random() * 8,
      color: colors[i % colors.length],
      shape: type === 'confetti'
        ? (i % 2 === 0 ? 'rect' : 'circle')
        : (i % 2 === 0 ? 'heart' : 'star'),
      alpha: 1,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.2,
      gravity: type === 'confetti' ? 0.16 : 0.12,
      life: 0,
      maxLife: type === 'confetti' ? 75 + Math.random() * 35 : 46 + Math.random() * 20
    });
  }
  if (!fxRaf) {
    fxRaf = requestAnimationFrame(tickParticles);
  }
}

function tickParticles() {
  if (!fxCtx || !fxCanvas || document.hidden) {
    fxRaf = null;
    return;
  }
  fxCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life += 1;
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.rot += p.vrot;
    p.alpha = Math.max(0, 1 - p.life / p.maxLife);

    if (p.life >= p.maxLife) {
      particles.splice(i, 1);
      continue;
    }

    fxCtx.save();
    fxCtx.globalAlpha = p.alpha;
    fxCtx.translate(p.x, p.y);
    fxCtx.rotate(p.rot);
    fxCtx.fillStyle = p.color;

    if (p.shape === 'heart') {
      const s = p.size * 0.45;
      fxCtx.beginPath();
      fxCtx.moveTo(0, s * 0.7);
      fxCtx.bezierCurveTo(-s * 1.4, -s * 0.4, -s * 0.7, -s * 1.5, 0, -s * 0.6);
      fxCtx.bezierCurveTo(s * 0.7, -s * 1.5, s * 1.4, -s * 0.4, 0, s * 0.7);
      fxCtx.fill();
    } else if (p.shape === 'star') {
      const r1 = p.size * 0.52;
      const r2 = p.size * 0.24;
      fxCtx.beginPath();
      for (let k = 0; k < 10; k++) {
        const r = k % 2 === 0 ? r1 : r2;
        const a = (k * Math.PI) / 5;
        if (k === 0) fxCtx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else fxCtx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      fxCtx.closePath();
      fxCtx.fill();
    } else if (p.shape === 'rect') {
      fxCtx.fillRect(-p.size / 2, -p.size * 0.3, p.size, p.size * 0.6);
    } else {
      fxCtx.beginPath();
      fxCtx.arc(0, 0, p.size * 0.38, 0, Math.PI * 2);
      fxCtx.fill();
    }
    fxCtx.restore();
  }

  if (particles.length > 0) {
    fxRaf = requestAnimationFrame(tickParticles);
  } else {
    fxCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    fxRaf = null;
  }
}

// ======================================================
// Feast Controller
// ======================================================
export class FeastController {
  constructor(callbacks) {
    this.callbacks = callbacks; // { onHudChange, onLevelComplete }
    this.stage = 1;
    this.orderIndex = 0;
    this.currentOrder = null;
    this.usedTargets = new Set();
    this.trayItems = [];
    this.plateItems = [];
    this.wrongTries = 0;
    this.firstTryCorrect = 0;
    this.treatsEarned = 0;
    this.levelSentences = [];
    this.busy = false;
    this.paused = false;
    this.advanceTimer = null;
    this.fxTimers = [];

    this.dragState = null;
    this.monsterRig = null;

    this.els = {
      hudPlates: document.getElementById('hud-plates'),
      hudGrowthFill: document.getElementById('hud-growth-fill'),
      hudTreats: document.getElementById('hud-treats-count'),
      speechBubble: document.getElementById('speech-bubble'),
      speechText: document.getElementById('speech-text'),
      monsterSlot: document.getElementById('feast-monster-slot'),
      mouthDropHint: document.getElementById('mouth-drop-hint'),
      servingStation: document.getElementById('serving-station'),
      servingPlate: document.getElementById('serving-plate'),
      plateItems: document.getElementById('plate-items'),
      btnBell: document.getElementById('btn-bell'),
      foodTray: document.getElementById('food-tray'),
      dragLayer: document.getElementById('drag-layer')
    };

    this.bindEvents();
  }

  bindEvents() {
    this.els.speechBubble?.addEventListener('click', () => {
      playSfx('click');
      this.speakCurrentOrder(false);
    });

    this.els.monsterSlot?.addEventListener('click', () => {
      if (this.dragState) return;
      playSfx('squeak');
      this.speakCurrentOrder(false);
    });

    this.els.btnBell?.addEventListener('click', () => {
      this.handleRingBell(false);
    });

    // Global mouse look when not dragging
    document.addEventListener('pointermove', (e) => {
      if (this.paused || !this.monsterRig || this.dragState) return;
      const screen = document.getElementById('screen-feast');
      if (!screen?.classList.contains('active')) return;
      this.monsterRig.lookAt(e.clientX, e.clientY);
    });
  }

  startLevel(stage) {
    this.cleanupTimers();
    this.stage = Math.max(1, Math.min(6, Number(stage) || 1));
    this.orderIndex = 0;
    this.usedTargets = new Set();
    this.wrongTries = 0;
    this.firstTryCorrect = 0;
    this.treatsEarned = 0;
    this.levelSentences = [];
    this.busy = false;
    this.paused = false;

    const progress = getProgress();
    if (this.monsterRig) this.monsterRig.destroy();
    this.monsterRig = new MonsterRig(this.els.monsterSlot, progress.selectedMonster, { interactive: true });

    this.renderHud();
    this.loadOrder(0);
  }

  cleanupTimers() {
    if (this.advanceTimer) {
      clearTimeout(this.advanceTimer);
      this.advanceTimer = null;
    }
    if (this.fxTimers && this.fxTimers.length) {
      for (const t of this.fxTimers) clearTimeout(t);
      this.fxTimers = [];
    }
    this.cancelActiveDrag();
  }

  scheduleFx(fn, delay) {
    const id = setTimeout(fn, delay);
    this.fxTimers.push(id);
    return id;
  }

  setPaused(isPaused) {
    this.paused = isPaused;
    if (isPaused) {
      stopSpeech();
      this.cancelActiveDrag();
    }
  }

  loadOrder(index) {
    this.cleanupTimers();
    this.orderIndex = index;
    this.wrongTries = 0;
    this.busy = false;
    this.currentOrder = generateOrder(this.stage, index, this.usedTargets);
    this.trayItems = this.currentOrder.tray.map((item) => ({ ...item, onPlate: false }));
    this.plateItems = [];

    this.monsterRig?.setExpression('idle');
    this.renderHud();
    this.renderSpeechBubble(false);
    this.renderServingStation();
    this.renderTray();
    this.speakCurrentOrder(false);
  }

  speakCurrentOrder(slow = false) {
    if (!this.currentOrder || this.paused) return;
    const monsterId = getProgress().selectedMonster;
    speak(this.currentOrder.sentence, { monsterId, slow });
  }

  renderHud() {
    const progress = getProgress();
    if (this.els.hudTreats) {
      this.els.hudTreats.textContent = String(progress.treats);
    }

    if (this.els.hudPlates) {
      let html = '';
      for (let i = 0; i < ORDERS_PER_LEVEL; i++) {
        const done = i < this.orderIndex;
        const active = i === this.orderIndex;
        html += `<div class="hud-plate ${done ? 'done' : ''} ${active ? 'active' : ''}" aria-hidden="true">${done ? '✓' : ''}</div>`;
      }
      this.els.hudPlates.innerHTML = html;
    }

    if (this.els.hudGrowthFill) {
      const pct = Math.round((this.orderIndex / ORDERS_PER_LEVEL) * 100);
      this.els.hudGrowthFill.style.width = `${pct}%`;
    }
  }

  renderSpeechBubble(pulseHighlight = false) {
    if (!this.currentOrder || !this.els.speechBubble || !this.els.speechText) return;
    const settings = getSettings();
    this.els.speechBubble.classList.toggle('listen-mode', Boolean(settings.listenMode));

    const html = this.currentOrder.tokens
      .map((tok, idx) => {
        const cls = tok.highlight
          ? `highlight-word${pulseHighlight ? ' pulsing' : ''}`
          : '';
        const space = idx > 0 && !tok.attachLeft ? ' ' : '';
        return `${space}<span class="${cls}">${escapeHtml(tok.text)}</span>`;
      })
      .join('');

    this.els.speechText.innerHTML = html;
  }

  renderServingStation() {
    if (!this.currentOrder || !this.els.servingStation) return;
    const isPlateMode = this.currentOrder.mode === 'plate';
    this.els.servingStation.classList.toggle('hidden', !isPlateMode);
    if (isPlateMode) {
      this.renderPlateItems();
    }
  }

  renderPlateItems() {
    if (!this.els.plateItems || !this.els.servingPlate || !this.els.btnBell) return;
    this.els.servingPlate.classList.toggle('has-items', this.plateItems.length > 0);
    this.els.btnBell.classList.toggle('ready', this.plateItems.length > 0);

    this.els.plateItems.innerHTML = '';
    for (const item of this.plateItems) {
      const el = this.createFoodVisual(item, 'plate-food-chip');
      el.dataset.instanceId = item.instanceId;
      el.addEventListener('pointerdown', (e) => this.startDrag(e, item, 'plate', el));
      this.els.plateItems.appendChild(el);
    }
  }

  renderTray() {
    if (!this.els.foodTray) return;
    const hintIds = this.wrongTries >= 2
      ? new Set(this.currentOrder.getHintIds(
          this.trayItems.filter((t) => !t.onPlate),
          this.plateItems.map((p) => p.id)
        ))
      : new Set();

    this.els.foodTray.innerHTML = '';
    for (const item of this.trayItems) {
      const card = this.createFoodVisual(item, 'food-card');
      card.setAttribute('role', 'listitem');
      card.setAttribute('aria-label', item.en);
      card.dataset.instanceId = item.instanceId;
      card.dataset.itemId = item.id;

      if (item.onPlate) {
        card.classList.add('on-plate-placeholder');
      } else {
        if (hintIds.has(item.instanceId)) {
          card.classList.add('hint-glow');
        }
        card.addEventListener('pointerdown', (e) => this.startDrag(e, item, 'tray', card));
      }

      this.els.foodTray.appendChild(card);
    }
  }

  createFoodVisual(item, className) {
    const el = document.createElement('div');
    el.className = className;

    const colorStyle = COLOR_STYLES[item.color] || COLOR_STYLES.mixed;
    if (item.multiColor || item.badgeColor) {
      el.style.setProperty('--coaster-bg', colorStyle.soft);
      el.style.setProperty('--coaster-ring', colorStyle.ring);
      el.classList.add('has-color-coaster');
    } else {
      el.style.setProperty('--coaster-bg', '#FFFDF8');
      el.style.setProperty('--coaster-ring', '#F0DFC8');
    }

    const emojiSpan = document.createElement('span');
    emojiSpan.className = 'food-emoji';
    emojiSpan.textContent = item.emoji;
    if (item.tint && item.tint !== 'none') {
      emojiSpan.style.filter = item.tint;
    }

    el.appendChild(emojiSpan);

    if (item.multiColor && item.badgeColor) {
      const dot = document.createElement('span');
      dot.className = 'food-color-dot';
      dot.style.backgroundColor = item.badgeColor;
      el.appendChild(dot);
    }

    return el;
  }

  // ======================================================
  // Drag & Drop
  // ======================================================
  startDrag(e, item, source, sourceEl) {
    if (this.busy || this.paused) return;
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();

    this.cancelActiveDrag();
    playSfx('pickup');

    const rect = sourceEl.getBoundingClientRect();
    const ghost = this.createFoodVisual(item, 'food-card drag-ghost');
    ghost.style.width = `${Math.max(72, rect.width)}px`;
    ghost.style.height = `${Math.max(72, rect.height)}px`;
    this.els.dragLayer.appendChild(ghost);

    sourceEl.classList.add('dragging-source');

    const offsetX = e.clientX - (rect.left + rect.width / 2);
    const offsetY = e.clientY - (rect.top + rect.height / 2);

    this.dragState = {
      pointerId: e.pointerId,
      item,
      source,
      sourceEl,
      ghost,
      offsetX,
      offsetY,
      lastX: e.clientX,
      x: e.clientX - offsetX,
      y: e.clientY - offsetY,
      tilt: 0
    };

    this.positionGhost(this.dragState.x, this.dragState.y, 0);
    this.updateDragProximity(this.dragState.x, this.dragState.y);

    this._onMove = (ev) => this.onDragMove(ev);
    this._onUp = (ev) => this.onDragEnd(ev);
    window.addEventListener('pointermove', this._onMove);
    window.addEventListener('pointerup', this._onUp);
    window.addEventListener('pointercancel', this._onUp);
  }

  onDragMove(e) {
    if (!this.dragState || e.pointerId !== this.dragState.pointerId) return;
    const x = e.clientX - this.dragState.offsetX;
    const y = e.clientY - this.dragState.offsetY;
    const dx = e.clientX - this.dragState.lastX;
    this.dragState.lastX = e.clientX;
    this.dragState.x = x;
    this.dragState.y = y;

    const targetTilt = Math.max(-18, Math.min(18, dx * 1.1));
    this.dragState.tilt = this.dragState.tilt * 0.6 + targetTilt * 0.4;

    this.positionGhost(x, y, this.dragState.tilt);
    this.updateDragProximity(x, y);
  }

  positionGhost(x, y, tilt) {
    if (!this.dragState?.ghost) return;
    this.dragState.ghost.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(1.16) rotate(${tilt.toFixed(1)}deg)`;
  }

  updateDragProximity(x, y) {
    if (!this.monsterRig) return;
    this.monsterRig.lookAt(x, y);

    const mouth = this.monsterRig.getMouthCenter();
    const distMouth = Math.hypot(x - mouth.x, y - mouth.y);

    if (distMouth < 110) {
      this.monsterRig.setExpression('wide');
      this.els.mouthDropHint?.classList.add('active');
    } else if (distMouth < 220) {
      this.monsterRig.setExpression('open');
      this.els.mouthDropHint?.classList.remove('active');
    } else {
      this.monsterRig.setExpression('idle');
      this.els.mouthDropHint?.classList.remove('active');
    }

    if (this.currentOrder?.mode === 'plate' && this.els.servingPlate) {
      const pr = this.els.servingPlate.getBoundingClientRect();
      const overPlate = x >= pr.left - 24 && x <= pr.right + 24 && y >= pr.top - 24 && y <= pr.bottom + 24;
      this.els.servingPlate.classList.toggle('drop-active', overPlate);
    }
  }

  onDragEnd(e) {
    if (!this.dragState || e.pointerId !== this.dragState.pointerId) return;
    const ds = this.dragState;
    this.detachDragListeners();
    this.dragState = null;

    this.monsterRig?.resetLook();
    this.monsterRig?.setExpression('idle');
    this.els.mouthDropHint?.classList.remove('active');
    this.els.servingPlate?.classList.remove('drop-active');

    const x = ds.x;
    const y = ds.y;
    const overMouth = this.isOverMouthZone(x, y);
    const overPlate = this.currentOrder?.mode === 'plate' && this.isOverPlateZone(x, y);

    if (ds.source === 'tray') {
      if (this.currentOrder.mode === 'single') {
        if (overMouth) {
          ds.ghost.remove();
          ds.sourceEl.classList.remove('dragging-source');
          this.handleSingleDrop(ds.item, { x, y }, false);
          return;
        }
      } else {
        // Plate mode: allow dropping on either plate or mouth to place on plate
        if (overPlate || overMouth) {
          ds.ghost.remove();
          ds.sourceEl.classList.remove('dragging-source');
          this.moveTrayItemToPlate(ds.item);
          return;
        }
      }
      // Missed target -> snap back with bounce
      this.animateGhostReturn(ds.ghost, ds.sourceEl);
      playSfx('drop');
      return;
    }

    // Source was 'plate': drag off plate returns item to tray
    if (ds.source === 'plate') {
      ds.ghost.remove();
      ds.sourceEl.classList.remove('dragging-source');
      if (!overPlate) {
        this.removePlateItemToTray(ds.item);
        playSfx('pickup');
      }
    }
  }

  isOverMouthZone(x, y) {
    if (!this.els.monsterSlot) return false;
    const r = this.els.monsterSlot.getBoundingClientRect();
    const pad = 32;
    return x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad;
  }

  isOverPlateZone(x, y) {
    if (!this.els.servingPlate) return false;
    const r = this.els.servingPlate.getBoundingClientRect();
    const pad = 28;
    return x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad;
  }

  animateGhostReturn(ghost, sourceEl) {
    const targetRect = sourceEl.getBoundingClientRect();
    const tx = targetRect.left + targetRect.width / 2;
    const ty = targetRect.top + targetRect.height / 2;
    ghost.style.transition = 'transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 220ms ease';
    ghost.style.transform = `translate3d(${tx}px, ${ty}px, 0) translate(-50%, -50%) scale(1) rotate(0deg)`;
    setTimeout(() => {
      ghost.remove();
      sourceEl.classList.remove('dragging-source');
    }, 270);
  }

  detachDragListeners() {
    if (this._onMove) {
      window.removeEventListener('pointermove', this._onMove);
      this._onMove = null;
    }
    if (this._onUp) {
      window.removeEventListener('pointerup', this._onUp);
      window.removeEventListener('pointercancel', this._onUp);
      this._onUp = null;
    }
  }

  cancelActiveDrag() {
    this.detachDragListeners();
    if (this.dragState) {
      this.dragState.ghost?.remove();
      this.dragState.sourceEl?.classList.remove('dragging-source');
      this.dragState = null;
    }
    this.els.mouthDropHint?.classList.remove('active');
    this.els.servingPlate?.classList.remove('drop-active');
  }

  // ======================================================
  // Plate & Checking Logic
  // ======================================================
  moveTrayItemToPlate(trayItem) {
    trayItem.onPlate = true;
    this.plateItems.push(trayItem);
    playSfx('drop');
    this.renderTray();
    this.renderPlateItems();
  }

  removePlateItemToTray(plateItem) {
    const idx = this.plateItems.findIndex((p) => p.instanceId === plateItem.instanceId);
    if (idx !== -1) {
      this.plateItems.splice(idx, 1);
    }
    const trayMatch = this.trayItems.find((t) => t.instanceId === plateItem.instanceId);
    if (trayMatch) trayMatch.onPlate = false;
    this.renderTray();
    this.renderPlateItems();
  }

  handleSingleDrop(trayItem, dropPos, instant = false) {
    if (this.busy && !instant) return false;
    const ok = this.currentOrder.validate([trayItem.id]);
    if (ok) {
      trayItem.onPlate = true;
      this.renderTray();
      this.handleCorrectOrder(dropPos, instant);
      return true;
    }
    this.handleWrongOrder([trayItem], instant);
    return false;
  }

  handleRingBell(instant = false) {
    if (this.busy && !instant) return false;
    if (!this.currentOrder || this.currentOrder.mode !== 'plate') return false;
    if (this.plateItems.length === 0) {
      playSfx('click');
      this.speakCurrentOrder(false);
      return false;
    }

    playSfx('bell');
    const submittedIds = this.plateItems.map((p) => p.id);
    const ok = this.currentOrder.validate(submittedIds);
    if (ok) {
      const plateRect = this.els.servingPlate?.getBoundingClientRect();
      const pos = plateRect
        ? { x: plateRect.left + plateRect.width / 2, y: plateRect.top + plateRect.height / 2 }
        : null;
      this.handleCorrectOrder(pos, instant);
      return true;
    }

    const wrongItems = [...this.plateItems];
    this.plateItems = [];
    for (const item of wrongItems) {
      const trayEntry = this.trayItems.find((t) => t.instanceId === item.instanceId);
      if (trayEntry) trayEntry.onPlate = false;
    }
    this.renderPlateItems();
    this.renderTray();
    this.handleWrongOrder(wrongItems, instant);
    return false;
  }

  handleCorrectOrder(pos, instant = false) {
    const progress = getProgress();
    const isFirstTry = this.wrongTries === 0;
    if (isFirstTry) this.firstTryCorrect += 1;

    this.levelSentences.push({
      sentence: this.currentOrder.sentence,
      firstTry: isFirstTry
    });

    this.treatsEarned += 1;
    addTreats(1);
    incrementMonsterEaten(progress.selectedMonster, 1);

    const nextIndex = this.orderIndex + 1;
    const isLevelEnd = nextIndex >= ORDERS_PER_LEVEL;

    if (instant) {
      // Programmatic test hook path: advance logically right away
      const mouth = this.monsterRig?.getMouthCenter() || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      spawnParticles(mouth.x, mouth.y, 'celebrate', 16);
      if (isLevelEnd) {
        this.finishLevel();
      } else {
        this.loadOrder(nextIndex);
      }
      return;
    }

    this.busy = true;
    this.monsterRig?.setExpression('chewing');
    this.els.monsterSlot?.classList.add('is-chewing');
    playSfx('chomp');

    this.scheduleFx(() => {
      if (this.paused) return;
      playSfx('munch');
    }, 180);

    this.scheduleFx(() => {
      if (this.paused) return;
      this.els.monsterSlot?.classList.remove('is-chewing');
      this.monsterRig?.setExpression('happy');
      playSfx(isLevelEnd ? 'burp' : 'squeak');
      playSfx('sparkle');

      const mouth = this.monsterRig?.getMouthCenter() || pos || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      spawnParticles(mouth.x, mouth.y, 'celebrate', 24);
      this.spawnFloatingPlusOne(mouth.x, mouth.y - 30);

      speak('Yummy!', { monsterId: progress.selectedMonster });

      if (this.els.hudGrowthFill) {
        this.els.hudGrowthFill.style.width = `${Math.round((nextIndex / ORDERS_PER_LEVEL) * 100)}%`;
      }
      if (this.els.hudTreats) {
        this.els.hudTreats.textContent = String(getProgress().treats);
      }
      this.markHudPlateDone(this.orderIndex);
    }, 520);

    this.advanceTimer = setTimeout(() => {
      this.advanceTimer = null;
      this.busy = false;
      if (isLevelEnd) {
        this.finishLevel();
      } else {
        this.loadOrder(nextIndex);
      }
    }, 1280);
  }

  markHudPlateDone(idx) {
    const plates = this.els.hudPlates?.querySelectorAll('.hud-plate');
    if (!plates || !plates[idx]) return;
    plates[idx].classList.remove('active');
    plates[idx].classList.add('done');
    plates[idx].textContent = '✓';
  }

  spawnFloatingPlusOne(x, y) {
    const el = document.createElement('div');
    el.className = 'floating-treat-pop';
    el.textContent = '+1 🍬';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    this.els.dragLayer?.appendChild(el);
    setTimeout(() => el.remove(), 950);
  }

  handleWrongOrder(spitItems, instant = false) {
    this.wrongTries += 1;
    this.renderSpeechBubble(true);
    this.renderTray();

    if (instant) return;

    this.busy = true;
    this.monsterRig?.setExpression('yuck');
    this.els.monsterSlot?.classList.add('is-yuck');
    playSfx('yuck');

    // Spit parabolic arc from mouth back to tray
    const mouth = this.monsterRig?.getMouthCenter() || { x: window.innerWidth * 0.3, y: window.innerHeight * 0.45 };
    for (const item of spitItems.slice(0, 3)) {
      this.animateSpitArc(item, mouth);
    }

    this.scheduleFx(() => {
      playSfx('boing');
    }, 100);

    this.scheduleFx(() => {
      this.speakCurrentOrder(true);
    }, 360);

    this.scheduleFx(() => {
      this.busy = false;
      this.els.monsterSlot?.classList.remove('is-yuck');
      this.monsterRig?.setExpression('idle');
    }, 900);
  }

  animateSpitArc(item, fromPos) {
    const targetCard = this.els.foodTray?.querySelector(`[data-instance-id="${item.instanceId}"]`);
    if (!targetCard || !this.els.dragLayer) return;

    const tr = targetCard.getBoundingClientRect();
    const toX = tr.left + tr.width / 2;
    const toY = tr.top + tr.height / 2;

    const flyer = this.createFoodVisual(item, 'food-card spit-flyer');
    flyer.style.left = '0px';
    flyer.style.top = '0px';
    this.els.dragLayer.appendChild(flyer);

    const startTime = performance.now();
    const duration = 520;

    const step = (now) => {
      const t = Math.min(1, (now - startTime) / duration);
      const ease = 1 - Math.pow(1 - t, 2);
      const x = fromPos.x + (toX - fromPos.x) * ease;
      const arc = Math.sin(t * Math.PI) * 110;
      const y = fromPos.y + (toY - fromPos.y) * ease - arc;
      const rot = t * 360;
      flyer.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${rot}deg) scale(${1 - t * 0.1})`;
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        flyer.remove();
        targetCard.classList.add('spit-land-bounce');
        setTimeout(() => targetCard.classList.remove('spit-land-bounce'), 320);
      }
    };
    requestAnimationFrame(step);
  }

  finishLevel() {
    this.cleanupTimers();
    stopSpeech();

    // Stars per Section 5: 3 stars = all 6 right on 1st try, 2 stars = 4-5, 1 star = finished
    let stars = 1;
    if (this.firstTryCorrect >= ORDERS_PER_LEVEL) {
      stars = 3;
    } else if (this.firstTryCorrect >= 4) {
      stars = 2;
    }

    recordStageStars(this.stage, stars);

    if (this.callbacks?.onLevelComplete) {
      this.callbacks.onLevelComplete({
        stage: this.stage,
        stars,
        treatsEarned: this.treatsEarned,
        sentences: this.levelSentences.length
          ? this.levelSentences
          : (this.currentOrder ? [{ sentence: this.currentOrder.sentence, firstTry: false }] : [])
      });
    }
  }

  // Test hook helpers
  feedById(id) {
    if (!this.currentOrder) return false;
    const available = this.trayItems.find((t) => t.id === id && !t.onPlate);
    if (!available) return false;

    if (this.currentOrder.mode === 'single') {
      return this.handleSingleDrop(available, null, true);
    }
    this.moveTrayItemToPlate(available);
    return true;
  }

  ringBellHook() {
    return this.handleRingBell(true);
  }

  getPublicState() {
    return {
      stage: this.stage,
      orderIndex: this.orderIndex,
      sentence: this.currentOrder ? this.currentOrder.sentence : '',
      plate: this.plateItems.map((p) => p.id)
    };
  }

  getOrderHook() {
    if (!this.currentOrder) return { sentence: '', answer: [] };
    return {
      sentence: this.currentOrder.sentence,
      answer: this.currentOrder.answer.slice()
    };
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
