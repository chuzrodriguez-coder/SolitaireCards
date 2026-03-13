const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

// ensure output folder exists
const outDir = path.resolve('public/cards');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// card dimensions (higher-quality)
const WIDTH = 200;
const HEIGHT = 300;

// suit symbols for basic cards
const suitSymbols = {
  S: '♠',
  H: '♥',
  D: '♦',
  C: '♣'
};

// for face cards we want a sci-fi astrology theme, choose some unicode icons
const faceIcons = {
  J: '♈', // Aries
  Q: '♌', // Leo
  K: '♒'  // Aquarius
};

// helper to build a card image
async function makeCard(rank, suit) {
  const id = `${rank}${suit}`;
  // debug
  //console.log('making', id);
  // Jimp constructor expects options object {width,height,color}
  const img = new Jimp.Jimp({ width: WIDTH, height: HEIGHT, color: 0xFFFFFFFF });

  // draw rank letter/number in upper-left quarter
  const rankColor = (suit === 'H' || suit === 'D') ? 0xFF0000FF : 0x000000FF;
  const rankFont = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK);
  img.print(rankFont, 0, 0, {
    text: rank,
    alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT,
    alignmentY: Jimp.VERTICAL_ALIGN_TOP
  }, WIDTH * 0.5, HEIGHT * 0.5);
  // recolor rank by drawing a filled rectangle behind? easier to recolor separately
  // create separate rank layer to tint if needed
  if (rankColor !== 0x000000FF) {
    // simple: tint whole image red then overlay rank text again in black? skip for now
  }

  // draw big suit symbol toward bottom right
  const suitColor = (suit === 'H' || suit === 'D') ? 0xFF0000FF : 0x000000FF;
  const suitFont = await Jimp.loadFont(Jimp.FONT_SANS_256_BLACK);
  const suitImg = new Jimp(WIDTH * 0.6, HEIGHT * 0.6, 0x00000000);
  suitImg.print(suitFont, 0, 0, {
    text: suitSymbols[suit],
    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
    alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
  }, suitImg.bitmap.width, suitImg.bitmap.height);
  // tint suit if red
  if (suitColor === 0xFF0000FF) {
    suitImg.color([{ apply: 'red', params: [100] }]);
  }
  const suitX = WIDTH - suitImg.bitmap.width - WIDTH * 0.05;
  const suitY = HEIGHT - suitImg.bitmap.height - HEIGHT * 0.05;
  img.composite(suitImg, suitX, suitY);

  const outPath = path.join(outDir, `${id}.png`);
  // obtain PNG buffer and write manually to avoid unreliable callback
  const buf = await new Promise((resolve, reject) => {
    img.getBuffer('image/png', (err, buffer) => err ? reject(err) : resolve(buffer));
  });
  fs.writeFileSync(outPath, buf);
  console.log('created', outPath);
}

(async () => {
  console.log('starting generation');
  const suits = ['S', 'H', 'D', 'C'];
  const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  for (const suit of suits) {
    console.log('suit', suit);
    for (const rank of ranks) {
      try {
        await makeCard(rank, suit);
        console.log('created', rank + suit);
      } catch (err) {
        console.error('error creating', rank + suit, err);
      }
    }
  }
  console.log('all cards generated');
})();
