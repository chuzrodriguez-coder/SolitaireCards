import * as JimpModule from 'jimp';
const { Jimp } = JimpModule;
import fs from 'fs';
import path from 'path';

// ensure output folder exists
const outDir = path.resolve('public/cards');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// card dimensions
const WIDTH = 100;
const HEIGHT = 150;

// suit symbols
const suitSymbols = {
  S: '♠',
  H: '♥',
  D: '♦',
  C: '♣'
};

// helper to build a simplified card image with large text filling the canvas
async function makeCard(rank, suit) {
  const id = `${rank}${suit}`;
  const img = await new Jimp({ width: WIDTH, height: HEIGHT, color: 0xFFFFFFFF });

  // choose a large font so text nearly fills card
  const bigFont = await JimpModule.loadFont(JimpModule.FONT_SANS_128_BLACK);
  const smallFont = await JimpModule.loadFont(JimpModule.FONT_SANS_32_BLACK);

  // determine main symbol (number/face)
  const main = ['J','Q','K'].includes(rank) ? rank : suitSymbols[suit];

  // fill center with the big character (rank or suit)
  img.print(bigFont, 0, 0, {
    text: main,
    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
    alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
  }, WIDTH, HEIGHT);

  // draw rank+code in small font at top-left just for identification
  img.print(smallFont, 6, 6, rank + suit);

  // tint red cards slightly
  if (suit === 'H' || suit === 'D') {
    img.scan(0, 0, WIDTH, HEIGHT, function (x, y, idx) {
      this.bitmap.data[idx + 0] = Math.min(255, this.bitmap.data[idx + 0] + 100);
    });
  }

  const outPath = path.join(outDir, `${id}.png`);
  await img.writeAsync(outPath);
  console.log('created', outPath);
}

(async () => {
  const suits = ['S', 'H', 'D', 'C'];
  const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  for (const suit of suits) {
    for (const rank of ranks) {
      await makeCard(rank, suit);
    }
  }
  console.log('all cards generated');
})();
