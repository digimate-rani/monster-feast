# Monster Feast - Game Spec (v1)

An English comprehension game for Israeli kids aged 6-10 who know basic English.
A cute hungry monster asks for food in English ("I want two red apples!"). The child drags the right
food into its mouth. Right = the monster munches happily, grows, and earns a star. Wrong = the monster
makes a funny face and spits it out, and the request is repeated.

The learning is in understanding the full request: nouns, then colors, numbers, "and", "not".
It must feel like caring for a funny pet, not like a test.

---

## 1. Goals and "done"
- A child opens the page and is feeding a monster within 2 taps, without reading anything to start.
- One level = 6 orders, ~2-3 minutes. Ends with a results screen: stars (1-3), treats earned,
  a short monster celebration.
- Feels premium: smooth animation, expressive monster (idle breathing, blinking, eyes follow the
  dragged food, chewing, burping), satisfying drag-and-drop with physics feel, sound everywhere.
- Done when: all screens in section 4 work, all 6 grammar stages playable, 4 monsters collectable,
  progress saves, works with mouse and touch (tablet + phone), no console errors, test hooks
  (section 10) work.

## 2. Tech
- Static site, no build step, no server, no API keys. Opens from `index.html` via any static server.
- Vanilla JS (ES modules). DOM + CSS + SVG for the monster and food (SVG monster parts animated
  with CSS/JS so it can blink, open mouth, change expression). Canvas only for particles if needed.
  Libraries allowed only from cdn.jsdelivr.net with an exact version (e.g. GSAP for animation is fine).
- Files:
  ```
  index.html
  css/style.css
  js/main.js          boot, screen router
  js/feast.js         order generation, drag/drop, checking
  js/monster.js       monster rig: expressions, states, growth, skins
  js/items.js         food data (section 6)
  js/orders.js        sentence templates per stage (section 5)
  js/audio.js         speech + SFX + music (section 7)
  js/progress.js      localStorage save/load
  js/ui.js            menus, HUD, results
  audio/manifest.json sentence/word -> clip file map (empty {} in v1 is fine)
  audio/clips/        pre-generated clips (added later)
  ```
- Food pictures: emoji with the "Noto Color Emoji" Google Font, so they look the same everywhere.
  Colored variants (red apple / green apple, yellow / red pepper) need a clear visual: use the emoji
  plus a color tint or a colored plate/wrapper, so color is never ambiguous.
- Fonts: "Fredoka" (English) and "Rubik" (Hebrew UI) from Google Fonts.
- Responsive: landscape tablet/desktop primary (monster center-left, food table right/bottom);
  phone portrait works (monster top, food tray bottom, scrollable if needed).

## 3. Core loop
- Scene: the monster sits behind a table. A food tray/table holds 6-10 food items (a mix of the
  right answer and distractors).
- The monster says the order: a speech bubble with the English sentence + the sentence is spoken.
  Tap the bubble or the monster to hear it again. In the "Listen" setting the bubble shows only a
  speaker icon (pure listening).
- The child drags items into the monster's mouth (or onto its plate for multi-item orders, then taps
  a big "Done" bell). While an item is dragged, the monster's eyes follow it and the mouth opens
  wider as it gets close.
- Checking:
  - Single-item orders: checked on drop.
  - Multi-item orders (numbers, "and"): items go onto the plate; the child presses the bell; the
    order is checked as a whole. Items on the plate can be dragged back off before ringing.
  - Correct: monster chomps (squash/stretch), happy dance, hearts/sparkles, "Yummy!" spoken,
    +1 treat, the monster's growth bar fills.
  - Wrong: monster makes a funny "yuck" face, spits the item back to the tray (bouncy arc), the
    order is spoken again slower, and the key word is highlighted in the bubble (e.g. "**two**"
    pulses). After 2 wrong tries on the same order, the correct items glow softly as a hint.
    No lives, no fail state.
- Every 6 orders = level end -> results.

## 4. Screens
1. **Title**: logo "MONSTER FEAST", the current monster waving and blinking, big Play button, small
   buttons: Monsters, Settings. Music starts on first tap.
2. **Stage map**: 6 stages (section 5) as stepping stones / cupcakes. Locked stages greyed.
   Each shows stars (0-3). Tap a stage -> play.
3. **Feast** (section 3) with HUD: order counter as 6 small plates (filled when done), treats,
   growth bar, pause button.
4. **Pause**: resume, restart, back to map.
5. **Results**: stars animate in, the monster celebrates (bigger dance at 3 stars), list of the
   level's sentences, tap any to hear it again. Buttons: Play again, Map.
6. **Monsters (collection)**: 4 monsters, each with its own color, shape and voice pitch:
   1) a round purple one (starter), 2) a tall green one with one eye, 3) an orange fluffy one,
   4) a blue one with tiny wings. A monster hatches from an egg when you reach a treat total
   (0, 30, 80, 150). The egg wobbles more as you get close. Pick the active monster here.
   Each monster also has 3 growth sizes (small/medium/big) by how much it has eaten.
7. **Settings**: sound, music, voice speed (normal/slow), "Listen mode" (hide the text in the
   bubble), reset progress (with confirm).

UI chrome (menus, buttons, settings) is in **Hebrew, RTL**. The monster's orders and all food
names are **English, LTR**.

## 5. Grammar stages (`js/orders.js`)
Each stage adds one idea. Orders are generated from templates + `items.js`, so they never run out.
1. **Just the food**: "I want a banana." / "Give me an apple." (1 item, noun only)
2. **Colors**: "I want a red apple." (distractors: same food in another color, other foods in the
   same color)
3. **Numbers 1-5**: "I want three cookies." (plate + bell; plural nouns with correct -s/-es,
   irregular avoided)
4. **Color + number**: "I want two green apples."
5. **And**: "I want a banana and two eggs."
6. **Not**: "I want fruit, but not bananas!" / "Give me three things that are not red."
   (category words: fruit, vegetables, sweets, drinks)
- Stars per level: 3 stars = all 6 orders right on the first try, 2 stars = 4-5, 1 star = finished.
- A stage unlocks when the previous stage has 2+ stars.
- Mix sentence starters for variety: "I want...", "Give me...", "Can I have...?", "I'm hungry for...",
  "Yummy! Now I want..." Keep vocabulary simple and the sentence under 10 words.
- Distractors are generated per order so the answer can only be found by understanding the key
  word of the stage (color, number, not).

## 6. Food items (`js/items.js`)
Shape: `{ id, en, plural, he, emoji, color, category }`. ~24 items covering categories fruit,
vegetables, sweets, drinks, other. Must include items that exist in 2+ colors for stage 2/4:
apple (red, green, yellow), pepper (red, green, yellow), grapes (green, purple), candy (red, blue,
pink), juice (orange, purple), cupcake (pink, blue). Plus: banana, egg, carrot, cheese, cookie,
pizza, strawberry, watermelon, bread, milk, ice cream, cake, tomato, orange (the fruit; never in
the same order as the color orange).

## 7. Audio (`js/audio.js`)
- **Speech**: `speak(text)` plays the clip from `audio/manifest.json` if present (exact sentence
  match, or stitched from word clips later); otherwise browser `speechSynthesis`, `lang: en-US`,
  best voice in this order: "Google US English", "Samantha", "Aria", "Jenny", any en-US. Rate 0.9
  (slow 0.7). Pitch per monster (0.8-1.4) so each monster sounds different. Cancel the previous
  utterance before a new one. The game must not change when real clips arrive.
- **SFX** (Web Audio, synthesized, no files): chomp, munch loop, burp, "yuck" blurp, spit boing,
  happy squeak, sparkle chime, bell ding, drag pickup pop, drop thud, egg wobble/crack, button click.
- **Music**: light bouncy loop; ducks while the monster speaks; off switch.
- Unlock audio on the first tap.

## 8. Look and feel
- Soft, round, cute cartoon style (think plush toys): pastel background scene, warm lighting, big
  shadows, thick outlines optional. Food sits on wooden table with a slight shadow.
- The monster is the star: idle breathing (scale 1.00-1.03), random blinks, eyes track the cursor
  or dragged item, different mouth shapes (closed, open, wide, chewing, yuck), tummy jiggle.
- Drag feel: item lifts with a shadow and slight scale-up, tilts in the drag direction, snaps
  back with a bounce if dropped nowhere.
- Big touch targets (min 64px for food), no tiny text, no reading needed to navigate (icons + audio).
- No ads, no external links, no data collection.

## 9. Performance and quality
- 60fps animations on a mid-range laptop and a 3-year-old tablet. Pause when the tab is hidden.
- No console errors or warnings in a full level.
- Works offline once loaded.

## 10. Test hooks (required, for automated checks)
Expose `window.__game` with:
- `state()` -> `{ screen, stage, monster, orderIndex, sentence, plate: [ids], treats, stars }`
- `start(stage)` -> jumps straight into a level
- `order()` -> `{ sentence, answer: [ids] }` for the current order
- `feed(id)` -> drops item id into the mouth / onto the plate
- `ring()` -> presses the bell
- `seed(n)` -> deterministic order generation
- `finish()` -> ends the level and shows results

## 11. Out of scope for v1
Accounts, servers, multiplayer, purchases, teacher dashboards, voice input (the child speaking),
vocabulary racing (that is the other game, Word Race).
