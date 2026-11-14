/**
 * SVG Monster Rig (Section 4.6 & Section 8):
 * - 4 distinct plush monsters: purple (round), green (tall 1-eye), orange (fluffy), blue (winged)
 * - 3 growth sizes: small, medium, big
 * - Expressions: idle, happy, open, wide, chewing, yuck, celebrate
 * - Random blinking, idle breathing, eye pupil tracking toward cursor/dragged item
 */

import { getMonsterSize } from './progress.js';

let nextRigUid = 0;

const MONSTER_THEMES = {
  purple: {
    bodyMain: '#9B6DFF',
    bodyDark: '#7542E5',
    belly: '#EDE0FF',
    cheek: '#FF85B3',
    outline: '#5B2CC7'
  },
  green: {
    bodyMain: '#4ADE80',
    bodyDark: '#22A855',
    belly: '#DCFCE7',
    cheek: '#FF94A8',
    outline: '#15803D'
  },
  orange: {
    bodyMain: '#FF9642',
    bodyDark: '#E66B19',
    belly: '#FFF0DC',
    cheek: '#FF6B8B',
    outline: '#C2510A'
  },
  blue: {
    bodyMain: '#4CC9F0',
    bodyDark: '#2589E6',
    belly: '#E0F7FF',
    cheek: '#FF8FA3',
    outline: '#1D62C2'
  }
};

export class MonsterRig {
  constructor(container, monsterId = 'purple', options = {}) {
    this.container = container;
    this.monsterId = monsterId;
    this.interactive = options.interactive !== false;
    this.sizeOverride = options.size || null;
    this.expression = 'idle';
    this.blinkTimer = null;
    this.destroyed = false;

    this.render();
    if (this.interactive) {
      this.startBlinking();
    }
  }

  setMonster(monsterId) {
    this.monsterId = monsterId;
    this.render();
  }

  getSizeClass() {
    const size = this.sizeOverride || getMonsterSize(this.monsterId);
    return `monster-size-${size}`;
  }

  render() {
    if (!this.container) return;
    const id = this.monsterId;
    const t = MONSTER_THEMES[id] || MONSTER_THEMES.purple;
    const sizeClass = this.getSizeClass();

    this.container.innerHTML = `
      <div class="monster-rig ${sizeClass} monster-${id} expr-${this.expression}" data-monster="${id}">
        <svg class="monster-svg" viewBox="0 0 240 240" width="100%" height="100%" aria-hidden="true">
          <defs>
            <radialGradient id="grad-${id}-${this.uid()}" cx="38%" cy="30%" r="68%">
              <stop offset="0%" stop-color="${t.bodyMain}" />
              <stop offset="100%" stop-color="${t.bodyDark}" />
            </radialGradient>
          </defs>

          <!-- Ground shadow -->
          <ellipse class="m-shadow" cx="120" cy="222" rx="68" ry="12" fill="rgba(75, 45, 25, 0.16)" />

          <g class="m-body-group">
            ${this.renderBodySvg(id, t)}
            ${this.renderCheeksSvg(id, t)}
            ${this.renderEyesSvg(id, t)}
            ${this.renderMouthSvg(id, t)}
          </g>
        </svg>
      </div>
    `;

    this.rigEl = this.container.querySelector('.monster-rig');
    this.pupils = Array.from(this.container.querySelectorAll('.m-pupil'));
    this.eyelids = Array.from(this.container.querySelectorAll('.m-eyelid'));
    this.mouthGroup = this.container.querySelector('.m-mouth-wrap');
  }

  uid() {
    if (!this._uid) {
      nextRigUid += 1;
      this._uid = nextRigUid;
    }
    return this._uid;
  }

  renderBodySvg(id, t) {
    const gradId = `url(#grad-${id}-${this.uid()})`;

    if (id === 'green') {
      // Tall green cyclops with cute antenna
      return `
        <g class="m-arms">
          <path d="M55 135 Q25 122 26 146 Q28 164 56 158" fill="${t.bodyDark}" stroke="${t.outline}" stroke-width="4" stroke-linecap="round"/>
          <path d="M185 135 Q215 122 214 146 Q212 164 184 158" fill="${t.bodyDark}" stroke="${t.outline}" stroke-width="4" stroke-linecap="round"/>
        </g>
        <!-- Antenna -->
        <path d="M120 34 Q126 14 140 16" fill="none" stroke="${t.outline}" stroke-width="5" stroke-linecap="round"/>
        <circle cx="143" cy="17" r="9" fill="#FDE047" stroke="${t.outline}" stroke-width="3.5"/>
        <!-- Tall bean body -->
        <path d="M62 85 C62 34, 178 34, 178 85 C186 135, 186 212, 120 212 C54 212, 54 135, 62 85 Z"
              fill="${gradId}" stroke="${t.outline}" stroke-width="4.5"/>
        <!-- Belly -->
        <ellipse class="m-belly" cx="120" cy="172" rx="38" ry="30" fill="${t.belly}" opacity="0.92"/>
        <!-- Feet -->
        <ellipse cx="90" cy="212" rx="18" ry="10" fill="${t.bodyDark}" stroke="${t.outline}" stroke-width="4"/>
        <ellipse cx="150" cy="212" rx="18" ry="10" fill="${t.bodyDark}" stroke="${t.outline}" stroke-width="4"/>
      `;
    }

    if (id === 'orange') {
      // Fluffy scalloped orange monster
      return `
        <g class="m-arms">
          <path d="M46 130 Q18 110 22 140 Q26 160 52 152" fill="${t.bodyDark}" stroke="${t.outline}" stroke-width="4" stroke-linecap="round"/>
          <path d="M194 130 Q222 110 218 140 Q214 160 188 152" fill="${t.bodyDark}" stroke="${t.outline}" stroke-width="4" stroke-linecap="round"/>
        </g>
        <!-- Fluffy ear tufts -->
        <path d="M64 62 Q48 28 84 44" fill="${t.bodyMain}" stroke="${t.outline}" stroke-width="4" stroke-linejoin="round"/>
        <path d="M176 62 Q192 28 156 44" fill="${t.bodyMain}" stroke="${t.outline}" stroke-width="4" stroke-linejoin="round"/>
        <!-- Scalloped cloud-like plush body -->
        <path d="M120 36
                 C144 36, 158 46, 168 58
                 C186 64, 198 84, 192 108
                 C204 128, 200 154, 186 168
                 C186 196, 160 214, 120 214
                 C80 214, 54 196, 54 168
                 C40 154, 36 128, 48 108
                 C42 84, 54 64, 72 58
                 C82 46, 96 36, 120 36 Z"
              fill="${gradId}" stroke="${t.outline}" stroke-width="4.5"/>
        <ellipse class="m-belly" cx="120" cy="170" rx="46" ry="34" fill="${t.belly}" opacity="0.92"/>
        <ellipse cx="88" cy="212" rx="18" ry="10" fill="${t.bodyDark}" stroke="${t.outline}" stroke-width="4"/>
        <ellipse cx="152" cy="212" rx="18" ry="10" fill="${t.bodyDark}" stroke="${t.outline}" stroke-width="4"/>
      `;
    }

    if (id === 'blue') {
      // Cute blue monster with tiny wings
      return `
        <g class="m-wings">
          <path class="m-wing-left" d="M52 120 C14 96, 10 138, 46 146 Z" fill="#BAE6FD" stroke="${t.outline}" stroke-width="3.5" stroke-linejoin="round"/>
          <path class="m-wing-right" d="M188 120 C226 96, 230 138, 194 146 Z" fill="#BAE6FD" stroke="${t.outline}" stroke-width="3.5" stroke-linejoin="round"/>
        </g>
        <g class="m-arms">
          <path d="M52 145 Q28 140 34 162 Q40 174 58 164" fill="${t.bodyDark}" stroke="${t.outline}" stroke-width="4" stroke-linecap="round"/>
          <path d="M188 145 Q212 140 206 162 Q200 174 182 164" fill="${t.bodyDark}" stroke="${t.outline}" stroke-width="4" stroke-linecap="round"/>
        </g>
        <!-- Round pear-plush body -->
        <path d="M56 128 C56 56, 184 56, 184 128 C184 186, 162 214, 120 214 C78 214, 56 186, 56 128 Z"
              fill="${gradId}" stroke="${t.outline}" stroke-width="4.5"/>
        <!-- Forehead star mark -->
        <path d="M120 62 L124 72 L135 72 L126 78 L129 88 L120 82 L111 88 L114 78 L105 72 L116 72 Z" fill="#FDE047" stroke="${t.outline}" stroke-width="2"/>
        <ellipse class="m-belly" cx="120" cy="170" rx="44" ry="33" fill="${t.belly}" opacity="0.92"/>
        <ellipse cx="90" cy="212" rx="17" ry="10" fill="${t.bodyDark}" stroke="${t.outline}" stroke-width="4"/>
        <ellipse cx="150" cy="212" rx="17" ry="10" fill="${t.bodyDark}" stroke="${t.outline}" stroke-width="4"/>
      `;
    }

    // Default: purple round starter monster
    return `
      <g class="m-arms">
        <path class="m-arm-left" d="M50 132 Q18 112 24 142 Q28 162 54 154" fill="${t.bodyDark}" stroke="${t.outline}" stroke-width="4" stroke-linecap="round"/>
        <path class="m-arm-right" d="M190 132 Q222 112 216 142 Q212 162 186 154" fill="${t.bodyDark}" stroke="${t.outline}" stroke-width="4" stroke-linecap="round"/>
      </g>
      <!-- Tiny round ears/horns -->
      <circle cx="68" cy="64" r="16" fill="${t.bodyMain}" stroke="${t.outline}" stroke-width="4"/>
      <circle cx="68" cy="64" r="7" fill="${t.belly}"/>
      <circle cx="172" cy="64" r="16" fill="${t.bodyMain}" stroke="${t.outline}" stroke-width="4"/>
      <circle cx="172" cy="64" r="7" fill="${t.belly}"/>
      <!-- Round plush body -->
      <ellipse cx="120" cy="134" rx="74" ry="78" fill="${gradId}" stroke="${t.outline}" stroke-width="4.5"/>
      <ellipse class="m-belly" cx="120" cy="170" rx="48" ry="34" fill="${t.belly}" opacity="0.94"/>
      <ellipse cx="88" cy="212" rx="18" ry="10" fill="${t.bodyDark}" stroke="${t.outline}" stroke-width="4"/>
      <ellipse cx="152" cy="212" rx="18" ry="10" fill="${t.bodyDark}" stroke="${t.outline}" stroke-width="4"/>
    `;
  }

  renderCheeksSvg(id, t) {
    const cy = id === 'green' ? 124 : 122;
    return `
      <ellipse cx="68" cy="${cy}" rx="12" ry="7" fill="${t.cheek}" opacity="0.62"/>
      <ellipse cx="172" cy="${cy}" rx="12" ry="7" fill="${t.cheek}" opacity="0.62"/>
    `;
  }

  renderEyesSvg(id, t) {
    if (id === 'green') {
      // Single giant cyclops eye
      return `
        <g class="m-eyes">
          <g class="m-eye" transform="translate(120, 88)">
            <circle cx="0" cy="0" r="28" fill="#FFFFFF" stroke="${t.outline}" stroke-width="4"/>
            <g class="m-pupil">
              <circle cx="0" cy="0" r="14" fill="#1E293B"/>
              <circle cx="5" cy="-5" r="5" fill="#FFFFFF"/>
              <circle cx="-4" cy="5" r="2.5" fill="#FFFFFF"/>
            </g>
            <ellipse class="m-eyelid" cx="0" cy="0" rx="28" ry="28" fill="${t.bodyMain}"/>
            <path class="m-yuck-eye" d="M-12 -10 L12 10 M12 -10 L-12 10" stroke="#1E293B" stroke-width="4.5" stroke-linecap="round"/>
          </g>
        </g>
      `;
    }

    const eyeY = id === 'blue' ? 106 : 98;
    const eyeSpread = id === 'orange' ? 32 : 34;

    return `
      <g class="m-eyes">
        <g class="m-eye" transform="translate(${120 - eyeSpread}, ${eyeY})">
          <circle cx="0" cy="0" r="19" fill="#FFFFFF" stroke="${t.outline}" stroke-width="3.5"/>
          <g class="m-pupil">
            <circle cx="0" cy="0" r="10" fill="#1E293B"/>
            <circle cx="3.5" cy="-3.5" r="3.8" fill="#FFFFFF"/>
          </g>
          <ellipse class="m-eyelid" cx="0" cy="0" rx="19" ry="19" fill="${t.bodyMain}"/>
          <path class="m-yuck-eye" d="M-8 -7 L8 7 M8 -7 L-8 7" stroke="#1E293B" stroke-width="3.8" stroke-linecap="round"/>
        </g>
        <g class="m-eye" transform="translate(${120 + eyeSpread}, ${eyeY})">
          <circle cx="0" cy="0" r="19" fill="#FFFFFF" stroke="${t.outline}" stroke-width="3.5"/>
          <g class="m-pupil">
            <circle cx="0" cy="0" r="10" fill="#1E293B"/>
            <circle cx="3.5" cy="-3.5" r="3.8" fill="#FFFFFF"/>
          </g>
          <ellipse class="m-eyelid" cx="0" cy="0" rx="19" ry="19" fill="${t.bodyMain}"/>
          <path class="m-yuck-eye" d="M-8 -7 L8 7 M8 -7 L-8 7" stroke="#1E293B" stroke-width="3.8" stroke-linecap="round"/>
        </g>
      </g>
    `;
  }

  renderMouthSvg(id, t) {
    const my = id === 'green' ? 140 : 134;
    return `
      <g class="m-mouth-wrap" transform="translate(120, ${my})">
        <!-- Closed / Happy smile -->
        <g class="mouth-state mouth-closed">
          <path d="M-24 0 Q0 20 24 0" fill="none" stroke="#3B1D36" stroke-width="5" stroke-linecap="round"/>
          <path d="M-12 7 L-8 14 L-4 7" fill="#FFFFFF" stroke="#3B1D36" stroke-width="2" stroke-linejoin="round"/>
        </g>

        <!-- Open (approaching food) -->
        <g class="mouth-state mouth-open">
          <ellipse cx="0" cy="6" rx="26" ry="18" fill="#5A102E" stroke="#3B1D36" stroke-width="4"/>
          <ellipse cx="0" cy="17" rx="15" ry="7" fill="#FF7B9C"/>
          <path d="M-14 -7 L-9 2 L-4 -7" fill="#FFFFFF"/>
          <path d="M4 -7 L9 2 L14 -7" fill="#FFFFFF"/>
        </g>

        <!-- Wide open (ready to drop!) -->
        <g class="mouth-state mouth-wide">
          <ellipse cx="0" cy="8" rx="34" ry="26" fill="#4A0B24" stroke="#3B1D36" stroke-width="4.5"/>
          <ellipse cx="0" cy="24" rx="20" ry="9" fill="#FF6B91"/>
          <path d="M-18 -13 L-12 -2 L-6 -14" fill="#FFFFFF"/>
          <path d="M6 -14 L12 -2 L18 -13" fill="#FFFFFF"/>
        </g>

        <!-- Chewing -->
        <g class="mouth-state mouth-chewing">
          <path d="M-24 4 Q-12 -6 0 4 Q12 -6 24 4 Q12 18 0 12 Q-12 18 -24 4 Z" fill="#5A102E" stroke="#3B1D36" stroke-width="4"/>
        </g>

        <!-- Happy / Celebrate -->
        <g class="mouth-state mouth-happy">
          <path d="M-28 -4 Q0 32 28 -4 Z" fill="#5A102E" stroke="#3B1D36" stroke-width="4" stroke-linejoin="round"/>
          <ellipse cx="0" cy="11" rx="15" ry="7" fill="#FF7B9C"/>
          <path d="M-14 -4 L-9 4 L-4 -4 M4 -4 L9 4 L14 -4" fill="#FFFFFF"/>
        </g>

        <!-- Yuck face -->
        <g class="mouth-state mouth-yuck">
          <path d="M-26 6 Q-13 -4 0 6 Q13 -4 26 6" fill="none" stroke="#3B1D36" stroke-width="5" stroke-linecap="round"/>
          <path d="M-9 5 L-9 22 C-9 29, 9 29, 9 22 L9 5 Z" fill="#FF7B9C" stroke="#3B1D36" stroke-width="3.5"/>
          <line x1="0" y1="8" x2="0" y2="21" stroke="#D9486D" stroke-width="2.5" stroke-linecap="round"/>
        </g>
      </g>
    `;
  }

  setExpression(expr) {
    this.expression = expr;
    if (!this.rigEl) return;
    this.rigEl.classList.remove(
      'expr-idle',
      'expr-open',
      'expr-wide',
      'expr-chewing',
      'expr-happy',
      'expr-yuck',
      'expr-celebrate'
    );
    this.rigEl.classList.add(`expr-${expr}`);
  }

  lookAt(clientX, clientY) {
    if (!this.container || !this.pupils || !this.pupils.length) return;
    const rect = this.container.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height * 0.44;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.hypot(dx, dy) || 1;
    const maxOffset = this.monsterId === 'green' ? 8 : 6;
    const factor = Math.min(1, dist / 180);
    const ox = (dx / dist) * maxOffset * factor;
    const oy = (dy / dist) * maxOffset * factor;

    for (const p of this.pupils) {
      p.style.transform = `translate(${ox.toFixed(1)}px, ${oy.toFixed(1)}px)`;
    }
  }

  resetLook() {
    if (!this.pupils) return;
    for (const p of this.pupils) {
      p.style.transform = 'translate(0px, 0px)';
    }
  }

  getMouthCenter() {
    if (!this.mouthGroup) {
      const rect = this.container.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height * 0.56 };
    }
    const r = this.mouthGroup.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  startBlinking() {
    const scheduleNext = () => {
      if (this.destroyed) return;
      const delay = 2200 + Math.random() * 2800;
      this.blinkTimer = setTimeout(() => {
        if (this.destroyed) return;
        if (this.expression !== 'yuck' && this.eyelids && this.eyelids.length) {
          this.rigEl?.classList.add('is-blinking');
          setTimeout(() => {
            this.rigEl?.classList.remove('is-blinking');
          }, 150);
        }
        scheduleNext();
      }, delay);
    };
    scheduleNext();
  }

  destroy() {
    this.destroyed = true;
    if (this.blinkTimer) {
      clearTimeout(this.blinkTimer);
      this.blinkTimer = null;
    }
  }
}
