// downloads a full deck of realistic card images from a public GitHub repo
// and stores them under public/cards with IDs like "AS.png", "10H.png", etc.
// run once with `node scripts/download-real-cards.js` (requires network access).

import fs from 'fs';
import path from 'path';
import https from 'https';

const outDir = path.resolve('public/cards');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const suits = { S: 'spades', H: 'hearts', D: 'diamonds', C: 'clubs' };
const ranks = [ 'A','2','3','4','5','6','7','8','9','10','J','Q','K' ];
const rankNames = { A:'ace', J:'jack', Q:'queen', K:'king' };

function rankToName(r) {
  return rankNames[r] || r;
}

async function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', err => {
      fs.unlink(dest, ()=>{});
      reject(err);
    });
  });
}

(async ()=>{
  console.log('starting download of real card images');
  for (const code in suits) {
    const suitName = suits[code];
    for (const r of ranks) {
      const rankName = rankToName(r);
      // using hayeah/playing-cards-assets repo as source
      const url = `https://raw.githubusercontent.com/hayeah/playing-cards-assets/master/png/${rankName}_of_${suitName}.png`;
      const dest = path.join(outDir, `${r}${code}.png`);
      try {
        await download(url, dest);
        console.log('fetched', dest);
      } catch(e) {
        console.error('failed to fetch', url, e.message);
      }
    }
  }
  console.log('finished downloading real cards');
})();
