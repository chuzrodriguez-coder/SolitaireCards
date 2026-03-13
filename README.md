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

## Card Thumbnails
A script is included to generate 52 small PNG thumbnails for each card in the deck.
Face cards receive a simple **sci-fi / astrology‑style blue star**.
They are written to `public/cards` and can be used as background images or
`<img>` elements in the UI.

To re‑generate the set after editing the script:

```bash
npm run generate-cards
```

Feel free to replace the generated images with more elaborate artwork!
