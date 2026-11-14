# Monster Feast

English comprehension game for kids (6-10) with basic English. A hungry monster asks for food in
English; drag the right food into its mouth. 6 grammar stages (nouns, colors, numbers, color+number,
and, not), 4 collectable monsters.

- Run: any static server from this folder, e.g. `python -m http.server 8000`, then open http://localhost:8000
- Spec: [SPEC.md](SPEC.md)
- Voice: 1022 Kokoro af_heart clips in `audio/clips/` (manifest maps 8750 sentences; "and" orders play 2 clips back to back), made by `../tools/tts/generate.py monster-feast`. Browser speech is only a fallback.
- Test hooks: `window.__game` (SPEC section 10).
