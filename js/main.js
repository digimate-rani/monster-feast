/**
 * Main entry point, screen router, and test hooks (Section 10).
 */

import { initAudio, unlockAudio, syncMusicState, stopSpeech } from './audio.js';
import { getProgress, getTotalStars } from './progress.js';
import { setSeed } from './orders.js';
import { initFxCanvas, FeastController } from './feast.js';
import { UIManager } from './ui.js';

let currentScreen = 'title';
let lastStage = 1;
let lastLevelStars = 0;

initFxCanvas(document.getElementById('fx-canvas'));

const feast = new FeastController({
  onLevelComplete: (summary) => {
    lastLevelStars = summary.stars;
    currentScreen = 'results';
    ui.showScreen('results');
    ui.renderResults(summary);
  }
});

const ui = new UIManager({
  navigate: (screen) => {
    if (currentScreen === 'feast' || currentScreen === 'pause') {
      feast.cleanupTimers();
      feast.setPaused(false);
      stopSpeech();
    }
    currentScreen = screen;
    ui.showScreen(screen);
  },
  startStage: (stage) => {
    lastStage = Math.max(1, Math.min(6, Number(stage) || 1));
    currentScreen = 'feast';
    ui.showScreen('feast');
    feast.startLevel(lastStage);
  },
  restartStage: () => {
    currentScreen = 'feast';
    ui.showScreen('feast');
    feast.startLevel(lastStage);
  },
  pauseFeast: () => {
    if (currentScreen !== 'feast') return;
    feast.setPaused(true);
    currentScreen = 'pause';
    ui.showScreen('pause');
  },
  resumeFeast: () => {
    if (currentScreen !== 'pause') return;
    currentScreen = 'feast';
    ui.showScreen('feast');
    feast.setPaused(false);
  },
  onProgressReset: () => {
    currentScreen = 'title';
    ui.showScreen('title');
  }
});

function setupAudioUnlock() {
  const onFirstGesture = () => {
    unlockAudio();
    syncMusicState();
    window.removeEventListener('pointerdown', onFirstGesture);
    window.removeEventListener('keydown', onFirstGesture);
  };
  window.addEventListener('pointerdown', onFirstGesture, { passive: true });
  window.addEventListener('keydown', onFirstGesture, { passive: true });
}

// Boot
initAudio();
setupAudioUnlock();
ui.showScreen('title');

// ======================================================
// Section 10: Automated Test Hooks
// ======================================================
window.__game = {
  state() {
    const progress = getProgress();
    const fState = feast.getPublicState();
    const inFeast = currentScreen === 'feast' || currentScreen === 'pause';
    return {
      screen: currentScreen,
      stage: inFeast || currentScreen === 'results' ? fState.stage : lastStage,
      monster: progress.selectedMonster,
      orderIndex: inFeast ? fState.orderIndex : 0,
      sentence: inFeast ? fState.sentence : '',
      plate: inFeast ? fState.plate : [],
      treats: progress.treats,
      stars: getTotalStars(),
      levelStars: lastLevelStars,
      stageStars: { ...progress.stageStars }
    };
  },

  start(stage = 1) {
    lastStage = Math.max(1, Math.min(6, Number(stage) || 1));
    currentScreen = 'feast';
    ui.showScreen('feast');
    feast.startLevel(lastStage);
    return this.state();
  },

  order() {
    return feast.getOrderHook();
  },

  feed(id) {
    return feast.feedById(id);
  },

  ring() {
    return feast.ringBellHook();
  },

  seed(n) {
    setSeed(n);
    return n;
  },

  finish() {
    if (currentScreen !== 'feast' && currentScreen !== 'pause') {
      this.start(lastStage);
    }
    feast.finishLevel();
    return this.state();
  }
};
