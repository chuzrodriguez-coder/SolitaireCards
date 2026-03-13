const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');

// output directory
const outDir = path.resolve('public/cards');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const WIDTH = 100;
const HEIGHT = 150;

// suit symbols
const suitSymbols = {
  S: '♠',
  H: '♥',
  D: '♦',
  C: '♣'
};

async function makeCard(rank, suit) {
  const id = `${rank}${suit}`;
  // construct a blank image
  const img = new Jimp({ width: WIDTH, height: HEIGHT, color: 0xFFFFFFFF });

  // large font for main text
  const bigFont = await Jimp.loadFont(Jimp.FONT_SANS_128_BLACK);
  const smallFont = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);

  // determine what to draw large: number or suit symbol
  const mainText = (['J','Q','K','A'].includes(rank) ? rank : suitSymbols[suit]);

  // print big centered
  img.print(bigFont, 0, 0, {
    text: mainText,
    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
    alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
  }, WIDTH, HEIGHT);

  // label rank+code small in corner
  img.print(smallFont, 6, 6, rank + suit);

  // red tint for hearts/diamonds
  if (suit === 'H' || suit === 'D') {
    img.scan(0, 0, WIDTH, HEIGHT, function (x, y, idx) {
      this.bitmap.data[idx + 0] = Math.min(255, this.bitmap.data[idx + 0] + 50);
    });
  }

  const outPath = path.join(outDir, `${id}.png`);
  await img.writeAsync(outPath);
  console.log('created', outPath);
}

(async () => {
  const suits = ['S','H','D','C'];
  const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  for (const suit of suits) {
    for (const rank of ranks) {
      await makeCard(rank, suit);
    }
  }
  console.log('all cards generated with large text');
})();