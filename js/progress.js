/**
 * LocalStorage persistence for Monster Feast.
 */

const STORAGE_KEY = 'monster_feast_v1_progress';

export const MONSTERS_META = [
  {
    id: 'purple',
    he: 'גוגו',
    descHe: 'עגול, סגול ותמיד רעב',
    unlockTreats: 0,
    pitch: 1.1,
    eggColor: '#9B6DFF',
    eggSpots: '#D8B4FE'
  },
  {
    id: 'green',
    he: 'ציפי',
    descHe: 'גבוה וירוק עם עין אחת גדולה',
    unlockTreats: 30,
    pitch: 0.85,
    eggColor: '#38C172',
    eggSpots: '#BBF7D0'
  },
  {
    id: 'orange',
    he: 'פלאפי',
    descHe: 'כתום, פרוותי ומתוק במיוחד',
    unlockTreats: 80,
    pitch: 1.25,
    eggColor: '#FF8C42',
    eggSpots: '#FED7AA'
  },
  {
    id: 'blue',
    he: 'סקיי',
    descHe: 'כחול עם כנפיים קטנטנות',
    unlockTreats: 150,
    pitch: 1.38,
    eggColor: '#3B82F6',
    eggSpots: '#BFDBFE'
  }
];

export function getMonsterMeta(id) {
  return MONSTERS_META.find((m) => m.id === id) || MONSTERS_META[0];
}

function defaultProgress() {
  return {
    treats: 0,
    selectedMonster: 'purple',
    stageStars: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    monsterEaten: { purple: 0, green: 0, orange: 0, blue: 0 },
    hatchedSeen: { purple: true, green: false, orange: false, blue: false },
    settings: {
      sound: true,
      music: true,
      speed: 'normal', // 'normal' | 'slow'
      listenMode: false
    }
  };
}

let state = loadProgress();

export function loadProgress() {
  const def = defaultProgress();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return def;
    const parsed = JSON.parse(raw);
    return {
      treats: typeof parsed.treats === 'number' ? Math.max(0, parsed.treats) : def.treats,
      selectedMonster: parsed.selectedMonster && MONSTERS_META.some((m) => m.id === parsed.selectedMonster)
        ? parsed.selectedMonster
        : def.selectedMonster,
      stageStars: { ...def.stageStars, ...(parsed.stageStars || {}) },
      monsterEaten: { ...def.monsterEaten, ...(parsed.monsterEaten || {}) },
      hatchedSeen: { ...def.hatchedSeen, ...(parsed.hatchedSeen || {}) },
      settings: { ...def.settings, ...(parsed.settings || {}) }
    };
  } catch {
    return def;
  }
}

export function saveProgress() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota or private mode issues
  }
}

export function getProgress() {
  return state;
}

export function getSettings() {
  return state.settings;
}

export function updateSettings(patch) {
  state.settings = { ...state.settings, ...patch };
  saveProgress();
  return state.settings;
}

export function addTreats(amount) {
  state.treats = Math.max(0, state.treats + amount);
  saveProgress();
  return state.treats;
}

export function incrementMonsterEaten(monsterId, amount = 1) {
  state.monsterEaten[monsterId] = (state.monsterEaten[monsterId] || 0) + amount;
  saveProgress();
  return state.monsterEaten[monsterId];
}

export function getMonsterSize(monsterId) {
  const eaten = state.monsterEaten[monsterId] || 0;
  if (eaten >= 30) return 'big';
  if (eaten >= 12) return 'medium';
  return 'small';
}

export function getMonsterSizeLabelHe(size) {
  if (size === 'big') return 'גדול';
  if (size === 'medium') return 'בינוני';
  return 'קטן';
}

export function isMonsterUnlocked(monsterId) {
  const meta = getMonsterMeta(monsterId);
  return state.treats >= meta.unlockTreats;
}

export function markMonsterHatchedSeen(monsterId) {
  state.hatchedSeen[monsterId] = true;
  saveProgress();
}

export function selectMonster(monsterId) {
  if (!isMonsterUnlocked(monsterId)) return false;
  state.selectedMonster = monsterId;
  state.hatchedSeen[monsterId] = true;
  saveProgress();
  return true;
}

export function recordStageStars(stage, stars) {
  const prev = state.stageStars[stage] || 0;
  if (stars > prev) {
    state.stageStars[stage] = stars;
    saveProgress();
  }
  return state.stageStars[stage];
}

export function isStageUnlocked(stage) {
  if (stage <= 1) return true;
  return (state.stageStars[stage - 1] || 0) >= 2;
}

export function getTotalStars() {
  return Object.values(state.stageStars).reduce((sum, s) => sum + (s || 0), 0);
}

export function resetProgress() {
  state = defaultProgress();
  saveProgress();
  return state;
}
