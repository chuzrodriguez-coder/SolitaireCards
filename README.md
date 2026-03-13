# SolitaireCards

Minimal JavaScript Solitaire scaffold.

Quick start

1. Install `serve` globally or use `npx` (no install needed).

2. Start a static server serving the `public` folder:

```bash
npx serve public -l 3000
```

3. Open http://localhost:3000 in your browser.

Project layout

- `public/` – static app served to the browser
- `public/src/` – ES modules used by the browser
- `src/` – source modules (same code as `public/src/` for development)
- `tests/` – simple Node tests
- `scripts/run-tests.js` – runs tests with Node (ESM)

Notes

- This is a small starting point. Game logic is intentionally minimal.

## Card Images

The `public/cards/` directory contains all 52 playing-card PNG assets (222×323 RGBA)
with a **sci-fi alien biotech theme**:

- **Background**: Deep-space per suit (navy/maroon/amber-black/forest-black) + procedural starfield
- **Suit palette**: Spades = neon cyan · Hearts = neon crimson · Diamonds = neon orange-red · Clubs = neon green
- **Number cards (2–10)**: Standard pip layout with glowing suit symbols + hex circuit motif
- **Aces**: Oversized glowing suit sigil + orbital circuit node ring
- **Face cards (J/Q/K)**: Alien humanoid — 3-eyed spiked-crown King · arc-crown Queen · cyclops-visor Jack — with neon armour and biotech tentacle appendages
- **Corner indices**: Rank + suit glyph top-left and bottom-right (rotated)

### Regenerating all 52 cards

Requires Python 3 with [Pillow](https://pillow.readthedocs.io/):

```bash
pip install Pillow
python3 scripts/generate-scifi-cards.py
```

A legacy Node.js generator is also available (produces a simpler pixel-art style):

```bash
npm run generate-cards
```
