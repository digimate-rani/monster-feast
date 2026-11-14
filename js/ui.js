/**
 * Screen rendering & UI management for Monster Feast (Section 4).
 */

import {
  getProgress,
  getSettings,
  updateSettings,
  MONSTERS_META,
  getMonsterMeta,
  getMonsterSize,
  getMonsterSizeLabelHe,
  isMonsterUnlocked,
  markMonsterHatchedSeen,
  selectMonster,
  isStageUnlocked,
  resetProgress
} from './progress.js';
import { STAGES_META } from './orders.js';
import { MonsterRig } from './monster.js';
import { playSfx, speak, syncMusicState } from './audio.js';
import { spawnParticles } from './feast.js';

export class UIManager {
  constructor(actions) {
    this.actions = actions; // { navigate, startStage, restartStage, resumeFeast, pauseFeast, onProgressReset }
    this.titleRig = null;
    this.resultsRig = null;
    this.collectionRigs = [];

    this.bindStaticButtons();
  }

  bindStaticButtons() {
    // Title screen
    document.getElementById('btn-play')?.addEventListener('click', () => {
      playSfx('click');
      this.actions.navigate('map');
    });
    document.getElementById('btn-monsters')?.addEventListener('click', () => {
      playSfx('click');
      this.actions.navigate('monsters');
    });
    document.getElementById('btn-settings')?.addEventListener('click', () => {
      playSfx('click');
      this.actions.navigate('settings');
    });
    document.getElementById('title-monster-slot')?.addEventListener('click', () => {
      const m = getProgress().selectedMonster;
      playSfx('squeak');
      this.titleRig?.setExpression('happy');
      speak("Hi! I'm hungry!", { monsterId: m });
      setTimeout(() => this.titleRig?.setExpression('idle'), 900);
    });

    // Map screen
    document.getElementById('btn-map-back')?.addEventListener('click', () => {
      playSfx('click');
      this.actions.navigate('title');
    });
    document.getElementById('btn-map-monsters')?.addEventListener('click', () => {
      playSfx('click');
      this.actions.navigate('monsters');
    });

    // Feast HUD & Pause modal
    document.getElementById('btn-pause')?.addEventListener('click', () => {
      playSfx('click');
      this.actions.pauseFeast();
    });
    document.getElementById('btn-resume')?.addEventListener('click', () => {
      playSfx('click');
      this.actions.resumeFeast();
    });
    document.getElementById('btn-restart')?.addEventListener('click', () => {
      playSfx('click');
      this.actions.restartStage();
    });
    document.getElementById('btn-pause-map')?.addEventListener('click', () => {
      playSfx('click');
      this.actions.navigate('map');
    });
    document.getElementById('btn-pause-sound')?.addEventListener('click', () => {
      const s = getSettings();
      updateSettings({ sound: !s.sound });
      playSfx('click');
      this.syncSettingsUI();
    });
    document.getElementById('btn-pause-music')?.addEventListener('click', () => {
      const s = getSettings();
      updateSettings({ music: !s.music });
      playSfx('click');
      syncMusicState();
      this.syncSettingsUI();
    });

    // Results screen
    document.getElementById('btn-results-next')?.addEventListener('click', () => {
      playSfx('click');
      const next = Number(document.getElementById('btn-results-next').dataset.nextStage || 1);
      this.actions.startStage(next);
    });
    document.getElementById('btn-results-again')?.addEventListener('click', () => {
      playSfx('click');
      this.actions.restartStage();
    });
    document.getElementById('btn-results-map')?.addEventListener('click', () => {
      playSfx('click');
      this.actions.navigate('map');
    });

    // Monsters screen
    document.getElementById('btn-monsters-back')?.addEventListener('click', () => {
      playSfx('click');
      this.actions.navigate('title');
    });

    // Settings screen
    document.getElementById('btn-settings-back')?.addEventListener('click', () => {
      playSfx('click');
      this.actions.navigate('title');
    });
    document.getElementById('toggle-sound')?.addEventListener('click', () => {
      const s = getSettings();
      updateSettings({ sound: !s.sound });
      playSfx('click');
      this.syncSettingsUI();
    });
    document.getElementById('toggle-music')?.addEventListener('click', () => {
      const s = getSettings();
      updateSettings({ music: !s.music });
      playSfx('click');
      syncMusicState();
      this.syncSettingsUI();
    });
    document.getElementById('speed-normal')?.addEventListener('click', () => {
      updateSettings({ speed: 'normal' });
      playSfx('click');
      this.syncSettingsUI();
    });
    document.getElementById('speed-slow')?.addEventListener('click', () => {
      updateSettings({ speed: 'slow' });
      playSfx('click');
      this.syncSettingsUI();
    });
    document.getElementById('toggle-listen')?.addEventListener('click', () => {
      const s = getSettings();
      updateSettings({ listenMode: !s.listenMode });
      playSfx('click');
      this.syncSettingsUI();
    });

    // Reset modal
    const resetModal = document.getElementById('reset-confirm-modal');
    document.getElementById('btn-reset-progress')?.addEventListener('click', () => {
      playSfx('click');
      resetModal?.classList.add('active');
    });
    document.getElementById('btn-reset-cancel')?.addEventListener('click', () => {
      playSfx('click');
      resetModal?.classList.remove('active');
    });
    document.getElementById('btn-reset-confirm')?.addEventListener('click', () => {
      playSfx('click');
      resetProgress();
      resetModal?.classList.remove('active');
      syncMusicState();
      this.syncSettingsUI();
      this.actions.onProgressReset();
    });
  }

  showScreen(screenName) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach((el) => el.classList.remove('active'));

    const pauseModal = document.getElementById('screen-pause');
    if (screenName === 'pause') {
      document.getElementById('screen-feast')?.classList.add('active');
      pauseModal?.classList.add('active');
      this.syncSettingsUI();
      return;
    }

    pauseModal?.classList.remove('active');
    const target = document.getElementById(`screen-${screenName}`);
    target?.classList.add('active');

    if (screenName === 'title') this.renderTitle();
    if (screenName === 'map') this.renderMap();
    if (screenName === 'monsters') this.renderMonsters();
    if (screenName === 'settings') this.syncSettingsUI();
  }

  renderTitle() {
    const progress = getProgress();
    const slot = document.getElementById('title-monster-slot');
    if (this.titleRig) this.titleRig.destroy();
    this.titleRig = new MonsterRig(slot, progress.selectedMonster, { interactive: true });
    this.titleRig.setExpression('happy');
  }

  renderMap() {
    const progress = getProgress();
    const meta = getMonsterMeta(progress.selectedMonster);
    const nameEl = document.getElementById('map-monster-name');
    const treatsEl = document.getElementById('map-treats-count');
    if (nameEl) nameEl.textContent = meta.he;
    if (treatsEl) treatsEl.textContent = String(progress.treats);

    const grid = document.getElementById('stage-map-grid');
    if (!grid) return;
    grid.innerHTML = '';

    for (const s of STAGES_META) {
      const unlocked = isStageUnlocked(s.stage);
      const stars = progress.stageStars[s.stage] || 0;

      const card = document.createElement('button');
      card.type = 'button';
      card.className = `cupcake-stage ${unlocked ? 'unlocked' : 'locked'}`;
      card.style.setProperty('--stage-accent', s.color);
      card.disabled = !unlocked;
      card.setAttribute('aria-label', `שלב ${s.stage}: ${s.titleHe}`);

      const starsHtml = [1, 2, 3]
        .map((n) => `<span class="map-star ${stars >= n ? 'filled' : ''}">★</span>`)
        .join('');

      card.innerHTML = `
        <div class="cupcake-frosting">
          <span class="stage-num">${s.stage}</span>
          <span class="stage-emoji" aria-hidden="true">${unlocked ? s.icon : '🔒'}</span>
        </div>
        <div class="cupcake-wrapper">
          <div class="stage-title">${s.titleHe}</div>
          <div class="stage-example" dir="ltr" lang="en">${s.descEn}</div>
          <div class="map-stars">${starsHtml}</div>
        </div>
      `;

      if (unlocked) {
        card.addEventListener('click', () => {
          playSfx('click');
          this.actions.startStage(s.stage);
        });
      }

      grid.appendChild(card);
    }
  }

  renderResults({ stage, stars, treatsEarned, sentences }) {
    const progress = getProgress();
    const heading = document.getElementById('results-heading');
    if (heading) {
      heading.textContent = stars === 3 ? 'מושלם! אלופים!' : (stars === 2 ? 'כל הכבוד!' : 'סיימתם את השלב!');
    }

    const starEls = document.querySelectorAll('#results-stars .res-star');
    starEls.forEach((el, idx) => {
      el.classList.remove('earned', 'pop-in');
      if (idx < stars) {
        setTimeout(() => {
          el.classList.add('earned', 'pop-in');
          playSfx('sparkle');
        }, 160 + idx * 240);
      }
    });

    const monsterSlot = document.getElementById('results-monster-slot');
    if (this.resultsRig) this.resultsRig.destroy();
    this.resultsRig = new MonsterRig(monsterSlot, progress.selectedMonster, { interactive: true });
    this.resultsRig.setExpression('celebrate');
    monsterSlot?.classList.toggle('big-celebrate', stars === 3);

    const treatsEl = document.getElementById('results-treats-earned');
    if (treatsEl) {
      treatsEl.textContent = `+${treatsEarned} חטיפים! (סה"כ ${progress.treats})`;
    }

    const list = document.getElementById('results-sentences');
    if (list) {
      list.innerHTML = '';
      for (const item of sentences) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'sentence-replay-chip';
        btn.setAttribute('dir', 'ltr');
        btn.setAttribute('lang', 'en');
        btn.innerHTML = `<span class="chip-speaker" aria-hidden="true">🔊</span><span>${escapeHtml(item.sentence)}</span>`;
        btn.addEventListener('click', () => {
          playSfx('click');
          speak(item.sentence, { monsterId: progress.selectedMonster });
        });
        list.appendChild(btn);
      }
    }

    const nextBtn = document.getElementById('btn-results-next');
    if (nextBtn) {
      const hasNext = stage < 6 && isStageUnlocked(stage + 1);
      nextBtn.classList.toggle('hidden', !hasNext);
      nextBtn.dataset.nextStage = String(stage + 1);
    }

    // Victory confetti burst
    setTimeout(() => {
      spawnParticles(window.innerWidth * 0.5, window.innerHeight * 0.35, 'confetti', stars === 3 ? 42 : 24);
      if (stars === 3) playSfx('squeak');
    }, 220);
  }

  renderMonsters() {
    for (const rig of this.collectionRigs) rig.destroy();
    this.collectionRigs = [];

    const progress = getProgress();
    const treatsEl = document.getElementById('monsters-treats-count');
    if (treatsEl) treatsEl.textContent = String(progress.treats);

    const grid = document.getElementById('monsters-grid');
    if (!grid) return;
    grid.innerHTML = '';

    for (const m of MONSTERS_META) {
      const unlocked = isMonsterUnlocked(m.id);
      const hatched = Boolean(progress.hatchedSeen[m.id]);
      const selected = progress.selectedMonster === m.id;

      const card = document.createElement('div');
      card.className = `monster-card ${unlocked ? 'unlocked' : 'locked'} ${selected ? 'selected' : ''}`;

      if (!unlocked || !hatched) {
        // Egg view (locked or ready to hatch!)
        const ratio = Math.min(1, progress.treats / Math.max(1, m.unlockTreats));
        let wobbleClass = '';
        if (unlocked && !hatched) {
          wobbleClass = 'egg-ready';
        } else if (ratio >= 0.75) {
          wobbleClass = 'egg-wobble-fast';
        } else if (ratio >= 0.35) {
          wobbleClass = 'egg-wobble-med';
        } else if (ratio > 0) {
          wobbleClass = 'egg-wobble-gentle';
        }

        const pct = Math.round(ratio * 100);
        card.innerHTML = `
          <div class="egg-wrap ${wobbleClass}">
            ${renderEggSvg(m.eggColor, m.eggSpots, unlocked && !hatched)}
          </div>
          <div class="monster-card-name">${unlocked ? 'ביצה מוכנה!' : 'ביצה מסתורית'}</div>
          <div class="egg-progress-track">
            <div class="egg-progress-fill" style="width: ${pct}%"></div>
          </div>
          <div class="egg-progress-label">
            ${unlocked
              ? 'לחצו לבקוע!'
              : `${progress.treats} / ${m.unlockTreats} 🍬`}
          </div>
        `;

        card.addEventListener('click', () => {
          if (unlocked && !hatched) {
            playSfx('eggCrack');
            markMonsterHatchedSeen(m.id);
            selectMonster(m.id);
            const r = card.getBoundingClientRect();
            spawnParticles(r.left + r.width / 2, r.top + r.height / 2, 'confetti', 30);
            speak('Hello!', { monsterId: m.id });
            this.renderMonsters();
          } else {
            playSfx('eggWobble');
            const egg = card.querySelector('.egg-wrap');
            egg?.classList.remove('egg-tap-shake');
            void egg?.offsetWidth;
            egg?.classList.add('egg-tap-shake');
          }
        });
      } else {
        // Hatched monster view
        const size = getMonsterSize(m.id);
        const sizeLabel = getMonsterSizeLabelHe(size);
        const eaten = progress.monsterEaten[m.id] || 0;

        card.innerHTML = `
          <div class="monster-card-stage"></div>
          <div class="monster-card-name">${m.he}</div>
          <div class="monster-card-desc">${m.descHe}</div>
          <div class="monster-card-badges">
            <span class="size-badge size-${size}">גודל: ${sizeLabel}</span>
            <span class="eaten-badge">🍽️ ${eaten}</span>
          </div>
          <button type="button" class="btn ${selected ? 'btn-primary' : 'btn-secondary'} btn-pick-monster">
            ${selected ? '✓ נבחר' : 'בחר בי'}
          </button>
        `;

        const stageEl = card.querySelector('.monster-card-stage');
        const rig = new MonsterRig(stageEl, m.id, { interactive: true, size });
        if (selected) rig.setExpression('happy');
        this.collectionRigs.push(rig);

        const pickBtn = card.querySelector('.btn-pick-monster');
        pickBtn?.addEventListener('click', () => {
          selectMonster(m.id);
          playSfx('squeak');
          speak("Let's eat!", { monsterId: m.id });
          this.renderMonsters();
        });
      }

      grid.appendChild(card);
    }
  }

  syncSettingsUI() {
    const s = getSettings();
    const setSwitch = (id, val) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.toggle('on', Boolean(val));
      el.setAttribute('aria-checked', String(Boolean(val)));
    };
    setSwitch('toggle-sound', s.sound);
    setSwitch('toggle-music', s.music);
    setSwitch('toggle-listen', s.listenMode);

    document.getElementById('speed-normal')?.classList.toggle('active', s.speed === 'normal');
    document.getElementById('speed-slow')?.classList.toggle('active', s.speed === 'slow');

    const pSound = document.getElementById('btn-pause-sound');
    const pMusic = document.getElementById('btn-pause-music');
    if (pSound) {
      pSound.classList.toggle('off', !s.sound);
      pSound.textContent = s.sound ? '🔊 צלילים: פועל' : '🔇 צלילים: כבוי';
    }
    if (pMusic) {
      pMusic.classList.toggle('off', !s.music);
      pMusic.textContent = s.music ? '🎵 מוזיקה: פועל' : '🎵 מוזיקה: כבוי';
    }
  }
}

function renderEggSvg(color, spotColor, ready) {
  return `
    <svg viewBox="0 0 120 140" width="96" height="112" aria-hidden="true">
      <ellipse cx="60" cy="128" rx="34" ry="8" fill="rgba(60,35,15,0.14)" />
      <path d="M60 12 C88 12, 104 54, 104 84 C104 114, 84 126, 60 126 C36 126, 16 114, 16 84 C16 54, 32 12, 60 12 Z"
            fill="${color}" stroke="#4A2C2A" stroke-width="4"/>
      <circle cx="42" cy="56" r="9" fill="${spotColor}" opacity="0.85"/>
      <circle cx="78" cy="48" r="7" fill="${spotColor}" opacity="0.85"/>
      <circle cx="70" cy="92" r="11" fill="${spotColor}" opacity="0.85"/>
      <circle cx="38" cy="96" r="6" fill="${spotColor}" opacity="0.85"/>
      <path d="M40 28 Q50 20 62 22" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" opacity="0.55"/>
      ${ready ? '<path d="M36 68 L52 78 L62 64 L78 76 L92 66" fill="none" stroke="#FFFBEB" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>' : ''}
    </svg>
  `;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
