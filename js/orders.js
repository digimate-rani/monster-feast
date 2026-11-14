/**
 * Grammar stages & deterministic order generation (Section 5).
 */

import { ITEMS, getItem, getItemsByBase, getMultiColorBases } from './items.js';

export const ORDERS_PER_LEVEL = 6;

export const STAGES_META = [
  { stage: 1, titleHe: 'שמות מאכלים', icon: '🍌', color: '#FF8A65', descEn: 'apple, banana' },
  { stage: 2, titleHe: 'צבעים', icon: '🎨', color: '#4FC3F7', descEn: 'red apple' },
  { stage: 3, titleHe: 'מספרים 1-5', icon: '🔢', color: '#81C784', descEn: 'three cookies' },
  { stage: 4, titleHe: 'צבע + מספר', icon: '🌈', color: '#BA68C8', descEn: 'two green apples' },
  { stage: 5, titleHe: 'וגם (and)', icon: '➕', color: '#FFD54F', descEn: 'banana and two eggs' },
  { stage: 6, titleHe: 'לא (not)', icon: '🚫', color: '#F06292', descEn: 'fruit, not bananas' }
];

const NUMBER_WORDS = {
  1: 'one',
  2: 'two',
  3: 'three',
  4: 'four',
  5: 'five'
};

const STARTERS_SHORT = [
  { text: 'I want', isQuestion: false },
  { text: 'Give me', isQuestion: false },
  { text: 'Can I have', isQuestion: true },
  { text: "I'm hungry for", isQuestion: false }
];

const STARTER_NEXT = { text: 'Yummy! Now I want', isQuestion: false };

// Mulberry32 PRNG for deterministic order generation when seeded
let rngState = null;

export function setSeed(n) {
  const num = Number(n);
  rngState = (Number.isFinite(num) ? Math.floor(num) : 1) >>> 0;
}

export function clearSeed() {
  rngState = null;
}

function rand() {
  if (rngState === null) {
    return Math.random();
  }
  rngState = (rngState + 0x6D2B79F5) >>> 0;
  let t = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function randInt(min, max) {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(rand() * arr.length)];
}

function shuffle(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

let instanceCounter = 0;
function makeTrayEntry(item) {
  instanceCounter += 1;
  return {
    instanceId: `tray_${instanceCounter}_${item.id}`,
    ...item
  };
}

function pickStarter(orderIndex, allowYummy = true) {
  if (allowYummy && orderIndex > 0 && rand() < 0.25) {
    return STARTER_NEXT;
  }
  return pick(STARTERS_SHORT);
}

function buildSentence(starter, phraseParts, endingPunct) {
  const punct = starter.isQuestion ? '?' : (endingPunct || '.');
  const fullPhrase = phraseParts.map((p) => p.text).join(' ');
  const sentence = `${starter.text} ${fullPhrase}${punct}`;
  const tokens = [
    { text: starter.text, highlight: false },
    ...phraseParts,
    { text: punct, highlight: false, attachLeft: true }
  ];
  return { sentence, tokens };
}

function nounWithArticle(item) {
  if (!item.article) return item.en;
  return `${item.article} ${item.en}`;
}

function nounWithCount(item, count) {
  if (count === 1) {
    return rand() < 0.5 && item.article ? `${item.article} ${item.en}` : `one ${item.en}`;
  }
  return `${NUMBER_WORDS[count]} ${item.plural}`;
}

function countBaseMap(ids) {
  const map = {};
  for (const id of ids) {
    const item = getItem(id);
    if (!item) return null;
    map[item.baseId] = (map[item.baseId] || 0) + 1;
  }
  return map;
}

function isOrangeConflict(item, forbiddenColor) {
  if (forbiddenColor === 'orange' && item.baseId === 'orange') return true;
  if (item.baseId === 'orange' && forbiddenColor === 'orange') return true;
  return false;
}

/**
 * Generate one order for the given stage (1-6) and orderIndex (0-5).
 */
export function generateOrder(stage, orderIndex = 0, usedTargets = new Set()) {
  switch (stage) {
    case 1:
      return generateStage1(orderIndex, usedTargets);
    case 2:
      return generateStage2(orderIndex, usedTargets);
    case 3:
      return generateStage3(orderIndex, usedTargets);
    case 4:
      return generateStage4(orderIndex, usedTargets);
    case 5:
      return generateStage5(orderIndex, usedTargets);
    case 6:
      return generateStage6(orderIndex, usedTargets);
    default:
      return generateStage1(orderIndex, usedTargets);
  }
}

// Stage 1: Just the food (single item, no color named - match by baseId)
function generateStage1(orderIndex, usedTargets) {
  const singleColorItems = ITEMS.filter((i) => !i.multiColor);
  const onePerMultiBase = getMultiColorBases().map((base) => pick(getItemsByBase(base)));
  const pool = [...singleColorItems, ...onePerMultiBase];
  const fresh = pool.filter((i) => !usedTargets.has(i.baseId));
  const target = pick(fresh.length ? fresh : pool);
  usedTargets.add(target.baseId);

  const starter = pickStarter(orderIndex, true);
  const phrase = nounWithArticle(target);
  const { sentence, tokens } = buildSentence(starter, [{ text: phrase, highlight: true }], '.');

  // Distractors: different baseId items
  const distractorPool = shuffle(
    ITEMS.filter((i) => i.baseId !== target.baseId)
  );
  const seenBases = new Set([target.baseId]);
  const distractors = [];
  for (const cand of distractorPool) {
    if (!seenBases.has(cand.baseId)) {
      seenBases.add(cand.baseId);
      distractors.push(cand);
      if (distractors.length >= 6) break;
    }
  }

  const tray = shuffle([target, ...distractors]).map(makeTrayEntry);

  return {
    stage: 1,
    mode: 'single',
    sentence,
    tokens,
    tray,
    answer: [target.id],
    validate: (ids) => ids.length === 1 && getItem(ids[0])?.baseId === target.baseId,
    getHintIds: (currentTray) => currentTray.filter((t) => t.baseId === target.baseId).map((t) => t.instanceId)
  };
}

// Stage 2: Colors (single item)
function generateStage2(orderIndex, usedTargets) {
  const multiItems = ITEMS.filter((i) => i.multiColor);
  const fresh = multiItems.filter((i) => !usedTargets.has(i.id));
  const target = pick(fresh.length ? fresh : multiItems);
  usedTargets.add(target.id);

  const starter = pickStarter(orderIndex, true);
  let phraseParts;
  if (target.article) {
    // "a red apple" (note: article matches color's sound; none of red/green/yellow/purple/blue/pink start with vowel, only orange does and orange juice is uncountable)
    phraseParts = [
      { text: 'a', highlight: false },
      { text: target.color, highlight: true },
      { text: target.en, highlight: true }
    ];
  } else {
    phraseParts = [
      { text: target.color, highlight: true },
      { text: target.en, highlight: true }
    ];
  }
  const { sentence, tokens } = buildSentence(starter, phraseParts, '.');

  // Distractors: same food in other colors + other foods in same color + extras
  const sameFoodOtherColor = ITEMS.filter(
    (i) => i.baseId === target.baseId && i.id !== target.id
  );
  const sameColorOtherFood = shuffle(
    ITEMS.filter(
      (i) => i.color === target.color && i.baseId !== target.baseId && !isOrangeConflict(i, target.color)
    )
  ).slice(0, 2);

  const usedIds = new Set([target.id, ...sameFoodOtherColor.map((i) => i.id), ...sameColorOtherFood.map((i) => i.id)]);
  const extras = shuffle(
    ITEMS.filter((i) => !usedIds.has(i.id) && !isOrangeConflict(i, target.color))
  ).slice(0, Math.max(2, 7 - (1 + sameFoodOtherColor.length + sameColorOtherFood.length)));

  const tray = shuffle([target, ...sameFoodOtherColor, ...sameColorOtherFood, ...extras]).map(makeTrayEntry);

  return {
    stage: 2,
    mode: 'single',
    sentence,
    tokens,
    tray,
    answer: [target.id],
    validate: (ids) => ids.length === 1 && ids[0] === target.id,
    getHintIds: (currentTray) => currentTray.filter((t) => t.id === target.id).map((t) => t.instanceId)
  };
}

// Stage 3: Numbers 1-5 (plate + bell, no color named - match by baseId)
function generateStage3(orderIndex, usedTargets) {
  const countableBases = Array.from(
    new Set(ITEMS.filter((i) => i.countable).map((i) => i.baseId))
  );
  const freshBases = countableBases.filter((b) => !usedTargets.has(b));
  const chosenBase = pick(freshBases.length ? freshBases : countableBases);
  usedTargets.add(chosenBase);

  const targetVariants = getItemsByBase(chosenBase);
  const target = targetVariants[0];

  // Numbers 1-5, leaning toward 2-5 so plural -s/-es is practiced
  const countPool = [1, 2, 2, 3, 3, 4, 4, 5];
  const count = pick(countPool);

  const starter = pickStarter(orderIndex, true);
  const numWord = NUMBER_WORDS[count];
  const nounWord = count === 1 ? target.en : target.plural;
  const phraseParts = [
    { text: numWord, highlight: true },
    { text: nounWord, highlight: false }
  ];
  const { sentence, tokens } = buildSentence(starter, phraseParts, '.');

  // Put enough target copies on tray (allowing any color variant of the base food)
  const targetCopies = Math.min(count + 1, 6);
  const trayRaw = [];
  for (let i = 0; i < targetCopies; i++) {
    trayRaw.push(pick(targetVariants));
  }

  // Add distractors (distinct other foods, 1-2 copies each, total 8-10)
  const otherFoods = shuffle(
    ITEMS.filter((i) => i.baseId !== chosenBase && i.countable)
  );
  const seenBases = new Set([chosenBase]);
  for (const cand of otherFoods) {
    if (trayRaw.length >= 9) break;
    if (seenBases.has(cand.baseId)) continue;
    seenBases.add(cand.baseId);
    const copies = trayRaw.length <= 7 && rand() < 0.5 ? 2 : 1;
    for (let c = 0; c < copies && trayRaw.length < 10; c++) {
      trayRaw.push(cand);
    }
  }

  const tray = shuffle(trayRaw).map(makeTrayEntry);
  const answer = tray.filter((t) => t.baseId === chosenBase).slice(0, count).map((t) => t.id);

  return {
    stage: 3,
    mode: 'plate',
    sentence,
    tokens,
    tray,
    answer,
    validate: (ids) => {
      if (ids.length !== count) return false;
      return ids.every((id) => getItem(id)?.baseId === chosenBase);
    },
    getHintIds: (currentTray, plateIds) => {
      const alreadyOnPlate = plateIds.filter((id) => getItem(id)?.baseId === chosenBase).length;
      if (alreadyOnPlate >= count) return [];
      return currentTray
        .filter((t) => t.baseId === chosenBase)
        .map((t) => t.instanceId);
    }
  };
}

// Stage 4: Color + number (plate + bell)
function generateStage4(orderIndex, usedTargets) {
  const countableMulti = ITEMS.filter((i) => i.multiColor && i.countable);
  const fresh = countableMulti.filter((i) => !usedTargets.has(i.id));
  const target = pick(fresh.length ? fresh : countableMulti);
  usedTargets.add(target.id);

  const count = pick([2, 2, 3, 3, 4]);
  const starter = pickStarter(orderIndex, true);
  const phraseParts = [
    { text: NUMBER_WORDS[count], highlight: true },
    { text: target.color, highlight: true },
    { text: target.plural, highlight: false }
  ];
  const { sentence, tokens } = buildSentence(starter, phraseParts, '.');

  const targetCopies = Math.min(count + 1, 5);
  const trayRaw = Array(targetCopies).fill(target);

  // Distractors: same food in another color (1-2 copies) + same color in other foods
  const sameFoodOtherColors = shuffle(
    ITEMS.filter((i) => i.baseId === target.baseId && i.id !== target.id)
  );
  for (const alt of sameFoodOtherColors) {
    if (trayRaw.length >= 8) break;
    trayRaw.push(alt);
    if (trayRaw.length < 8 && rand() < 0.5) trayRaw.push(alt);
  }

  const sameColorOtherFoods = shuffle(
    ITEMS.filter((i) => i.color === target.color && i.baseId !== target.baseId && !isOrangeConflict(i, target.color))
  );
  for (const alt of sameColorOtherFoods) {
    if (trayRaw.length >= 10) break;
    trayRaw.push(alt);
  }

  const extras = shuffle(
    ITEMS.filter((i) => i.baseId !== target.baseId && i.color !== target.color && !isOrangeConflict(i, target.color))
  );
  for (const alt of extras) {
    if (trayRaw.length >= 9) break;
    trayRaw.push(alt);
  }

  const tray = shuffle(trayRaw.slice(0, 10)).map(makeTrayEntry);
  const answer = Array(count).fill(target.id);

  return {
    stage: 4,
    mode: 'plate',
    sentence,
    tokens,
    tray,
    answer,
    validate: (ids) => ids.length === count && ids.every((id) => id === target.id),
    getHintIds: (currentTray, plateIds) => {
      const already = plateIds.filter((id) => id === target.id).length;
      if (already >= count) return [];
      return currentTray.filter((t) => t.id === target.id).map((t) => t.instanceId);
    }
  };
}

// Stage 5: "And" (plate + bell, no color named - match by baseId)
function generateStage5(orderIndex) {
  const countableBases = shuffle(
    Array.from(new Set(ITEMS.filter((i) => i.countable).map((i) => i.baseId)))
  );
  const baseA = countableBases[0];
  const baseB = countableBases[1];
  const variantsA = getItemsByBase(baseA);
  const variantsB = getItemsByBase(baseB);
  const itemA = variantsA[0];
  const itemB = variantsB[0];

  const countA = pick([1, 1, 2]);
  const countB = countA === 1 ? pick([1, 2, 3]) : pick([1, 2]);

  const starter = pickStarter(orderIndex, false);
  const phraseA = nounWithCount(itemA, countA);
  const phraseB = nounWithCount(itemB, countB);
  const phraseParts = [
    { text: phraseA, highlight: true },
    { text: 'and', highlight: true },
    { text: phraseB, highlight: true }
  ];
  const { sentence, tokens } = buildSentence(starter, phraseParts, '.');

  const trayRaw = [];
  for (let i = 0; i < countA + 1; i++) trayRaw.push(pick(variantsA));
  for (let i = 0; i < countB + 1; i++) trayRaw.push(pick(variantsB));

  const others = shuffle(
    ITEMS.filter((i) => i.baseId !== baseA && i.baseId !== baseB && i.countable)
  );
  for (const other of others) {
    if (trayRaw.length >= 9) break;
    trayRaw.push(other);
  }

  const tray = shuffle(trayRaw.slice(0, 10)).map(makeTrayEntry);
  const expectedBases = { [baseA]: countA, [baseB]: countB };
  const answer = [
    ...tray.filter((t) => t.baseId === baseA).slice(0, countA).map((t) => t.id),
    ...tray.filter((t) => t.baseId === baseB).slice(0, countB).map((t) => t.id)
  ];

  return {
    stage: 5,
    mode: 'plate',
    sentence,
    tokens,
    tray,
    answer,
    validate: (ids) => {
      if (ids.length !== countA + countB) return false;
      const gotBases = countBaseMap(ids);
      if (!gotBases) return false;
      return gotBases[baseA] === countA && gotBases[baseB] === countB && Object.keys(gotBases).length === 2;
    },
    getHintIds: (currentTray, plateIds) => {
      const gotBases = countBaseMap(plateIds) || {};
      const neededBaseSet = new Set();
      for (const [base, neededTotal] of Object.entries(expectedBases)) {
        if ((gotBases[base] || 0) < neededTotal) {
          neededBaseSet.add(base);
        }
      }
      return currentTray
        .filter((t) => neededBaseSet.has(t.baseId))
        .map((t) => t.instanceId);
    }
  };
}

// Stage 6: "Not" (category exclusions + color exclusions)
function generateStage6(orderIndex) {
  // Alternate between category-not (single) and color-not (plate)
  const useColorNot = orderIndex % 2 === 1;

  if (!useColorNot) {
    const categories = [
      { cat: 'fruit', label: 'fruit', excludedPool: ['banana', 'apple', 'strawberry'] },
      { cat: 'vegetables', label: 'vegetables', excludedPool: ['carrot', 'tomato', 'pepper'] },
      { cat: 'sweets', label: 'sweets', excludedPool: ['cookie', 'candy', 'cupcake'] }
    ];
    const chosen = pick(categories);
    const catItems = ITEMS.filter((i) => i.category === chosen.cat);
    const excludedBase = pick(chosen.excludedPool);
    const excludedItems = catItems.filter((i) => i.baseId === excludedBase);
    const validCatItems = shuffle(catItems.filter((i) => i.baseId !== excludedBase));
    const otherCatItems = shuffle(ITEMS.filter((i) => i.category !== chosen.cat));

    // Avoid duplicate baseId in tray for clarity
    const trayRaw = [];
    const seenBases = new Set();
    if (excludedItems.length) {
      trayRaw.push(excludedItems[0]);
      seenBases.add(excludedItems[0].baseId);
    }
    for (const v of validCatItems) {
      if (seenBases.has(v.baseId)) continue;
      seenBases.add(v.baseId);
      trayRaw.push(v);
      if (trayRaw.length >= 4) break;
    }
    for (const o of otherCatItems) {
      if (seenBases.has(o.baseId)) continue;
      seenBases.add(o.baseId);
      trayRaw.push(o);
      if (trayRaw.length >= 8) break;
    }

    const tray = shuffle(trayRaw).map(makeTrayEntry);
    const excludedPlural = excludedItems[0] ? excludedItems[0].plural : `${excludedBase}s`;
    const starter = pickStarter(orderIndex, false);
    const phraseParts = [
      { text: `${chosen.label}, but`, highlight: false },
      { text: `not ${excludedPlural}`, highlight: true }
    ];
    const { sentence, tokens } = buildSentence(starter, phraseParts, '!');

    const isValidItem = (item) => item && item.category === chosen.cat && item.baseId !== excludedBase;
    const validOnTray = tray.filter(isValidItem);
    const answer = validOnTray.length ? [validOnTray[0].id] : [];

    return {
      stage: 6,
      mode: 'single',
      sentence,
      tokens,
      tray,
      answer,
      validate: (ids) => {
        if (ids.length !== 1) return false;
        const item = getItem(ids[0]);
        return isValidItem(item);
      },
      getHintIds: (currentTray) => currentTray.filter(isValidItem).map((t) => t.instanceId)
    };
  }

  // Color "not" with count: "Give me three things that are not red."
  const forbiddenColor = pick(['red', 'yellow', 'green']);
  const count = pick([2, 3]);

  // Exclude 'mixed' items so color rule is 100% unambiguous, and apply orange rule
  const matchingColorPool = shuffle(
    ITEMS.filter((i) => i.color === forbiddenColor && !isOrangeConflict(i, forbiddenColor))
  );
  const nonMatchingPool = shuffle(
    ITEMS.filter(
      (i) => i.color !== forbiddenColor && i.color !== 'mixed' && !isOrangeConflict(i, forbiddenColor)
    )
  );

  const trayRaw = [];
  const seenBases = new Set();
  for (const m of matchingColorPool) {
    if (seenBases.has(m.baseId)) continue;
    seenBases.add(m.baseId);
    trayRaw.push(m);
    if (trayRaw.length >= 3) break;
  }
  for (const v of nonMatchingPool) {
    if (seenBases.has(v.baseId)) continue;
    seenBases.add(v.baseId);
    trayRaw.push(v);
    if (trayRaw.length >= 8) break;
  }

  const tray = shuffle(trayRaw).map(makeTrayEntry);
  const starter = pick([
    { text: 'Give me', isQuestion: false },
    { text: 'I want', isQuestion: false }
  ]);
  const phraseParts = [
    { text: NUMBER_WORDS[count], highlight: true },
    { text: 'things that are', highlight: false },
    { text: `not ${forbiddenColor}`, highlight: true }
  ];
  const { sentence, tokens } = buildSentence(starter, phraseParts, '.');

  const isValidItem = (item) => item && item.color !== forbiddenColor && item.color !== 'mixed';
  const validOnTray = tray.filter(isValidItem);
  const answer = validOnTray.slice(0, count).map((t) => t.id);

  return {
    stage: 6,
    mode: 'plate',
    sentence,
    tokens,
    tray,
    answer,
    validate: (ids) => {
      if (ids.length !== count) return false;
      return ids.every((id) => {
        const item = getItem(id);
        return isValidItem(item);
      });
    },
    getHintIds: (currentTray, plateIds) => {
      if (plateIds.length >= count) return [];
      return currentTray.filter(isValidItem).map((t) => t.instanceId);
    }
  };
}
