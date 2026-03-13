const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');

const outDir = path.resolve('public/cards');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const WIDTH = 200;  // higher resolution canvas
const HEIGHT = 300;

// patterns for drawing characters (simple pixel art)
const charPatterns = {
  // ranks
  'A': [
    [0,1,0],
    [1,0,1],
    [1,1,1],
    [1,0,1],
    [1,0,1]
  ],
  'J': [
    [0,1,1],
    [0,0,1],
    [0,0,1],
    [0,0,1],
    [1,0,1],
    [0,1,0]
  ],
  'Q': [
    [1,1,1],
    [1,0,1],
    [1,0,1],
    [1,1,1],
    [0,0,1],
    [0,1,0]
  ],
  'K': [
    [1,0,1],
    [1,1,0],
    [1,0,0],
    [1,1,0],
    [1,0,1]
  ],
  '0':[ [1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1] ],
  '1':[ [0,1,0],[1,1,0],[0,1,0],[0,1,0],[1,1,1] ],
  '2':[ [1,1,1],[0,0,1],[0,0,1],[1,1,1],[1,0,0],[1,1,1] ],
  '3':[ [1,1,1],[0,0,1],[0,1,1],[0,0,1],[1,1,1] ],
  '4':[ [1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1] ],
  '5':[ [1,1,1],[1,0,0],[1,1,1],[0,0,1],[1,1,1] ],
  '6':[ [1,1,1],[1,0,0],[1,1,1],[1,0,1],[1,1,1] ],
  '7':[ [1,1,1],[0,0,1],[0,0,1],[0,0,1],[0,0,1] ],
  '8':[ [1,1,1],[1,0,1],[1,1,1],[1,0,1],[1,1,1] ],
  '9':[ [1,1,1],[1,0,1],[1,1,1],[0,0,1],[1,1,1] ],
  // suit letters use same shapes as rank letters S/H/D/C
  'S': [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,0],
    [0,1,1,1,0],
    [0,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0]
  ],
  'H': [
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,1],
    [1,0,0,0,1],
    [1,0,0,0,1]
  ],
  'D': [
    [0,1,0],
    [1,0,1],
    [1,0,1],
    [0,1,0]
  ],
  'C': [
    [0,1,1],
    [1,0,0],
    [1,0,0],
    [1,0,0],
    [0,1,1]
  ]
};

const suits = ['S', 'H', 'D', 'C'];
const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

function setColor(png,x,y,color){
  if(x<0||y<0||x>=WIDTH||y>=HEIGHT) return;
  const idx=(WIDTH*y+x)<<2;
  const r=(color>>24)&0xff;
  const g=(color>>16)&0xff;
  const b=(color>>8)&0xff;
  const a=color&0xff;
  png.data[idx]=r; png.data[idx+1]=g; png.data[idx+2]=b; png.data[idx+3]=a;
}

function drawPattern(png, pattern, x0, y0, width, height, color=0x000000ff) {
  if (!pattern) return;
  const ph = pattern.length;
  const pw = pattern[0].length;
  const scaleX = width / pw;
  const scaleY = height / ph;
  for (let py = 0; py < ph; py++) {
    for (let px = 0; px < pw; px++) {
      if (pattern[py][px]) {
        const startX = Math.floor(x0 + px * scaleX);
        const startY = Math.floor(y0 + py * scaleY);
        for (let y = startY; y < startY + Math.ceil(scaleY); y++) {
          for (let x = startX; x < startX + Math.ceil(scaleX); x++) {
            setColor(png,x,y,color);
          }
        }
      }
    }
  }
}

// draw a more realistic suit shape using parametric formulas
function drawSuitShape(png, suit, x0, y0, w, h, color) {
  function insideHeart(nx,ny){
    return Math.pow(nx*nx + ny*ny -1,3) - nx*nx*ny*ny*ny <= 0;
  }
  function insideDiamond(nx,ny){return Math.abs(nx)+Math.abs(ny)<=1;}
  function insideSpade(nx,ny){
    // upside down heart for top half
    if(!insideHeart(nx, -ny)) return false;
    // stem
    if(ny>0.6 && Math.abs(nx)<0.2) return true;
    return true;
  }
  function insideClub(nx,ny){
    const r=0.3;
    const centers=[[-0.2,-0.2],[0.2,-0.2],[0,0.1]];
    for(const [cx,cy] of centers){ if((nx-cx)*(nx-cx)+(ny-cy)*(ny-cy)<=r*r) return true; }
    if(ny>0.3 && Math.abs(nx)<0.1) return true;
    return false;
  }
  for(let py=0;py<h;py++){
    for(let px=0;px<w;px++){
      const x = x0 + px;
      const y = y0 + py;
      const nx = (px/(w-1))*2 -1;
      const ny = (py/(h-1))*2 -1;
      let hit=false;
      if(suit==='H') hit=insideHeart(nx,ny);
      else if(suit==='D') hit=insideDiamond(nx,ny);
      else if(suit==='S') hit=insideSpade(nx,ny);
      else if(suit==='C') hit=insideClub(nx,ny);
      if(hit) setColor(png,x,y,color);
    }
  }
}

function createCardBuffer(rank, suit) {
  const png = new PNG({ width: WIDTH, height: HEIGHT });
  png.data.fill(255);
  if (suit === 'H' || suit === 'D') {
    for (let i = 0; i < png.data.length; i += 4) {
      png.data[i] = Math.min(255, png.data[i] + 50);
    }
  }
  // draw rank/letter in upper-left quarter
  let rankKey = rank === '10' ? '1' : rank;
  drawPattern(png, charPatterns[rankKey], 0, 0, WIDTH * 0.5, HEIGHT * 0.5, 0x000000ff);
  // draw suit icon as larger background shape towards bottom-right
  const suitColor = (suit === 'H' || suit === 'D') ? 0xff0000ff : 0x000000ff;
  const suitSizeW = WIDTH * 0.6;
  const suitSizeH = HEIGHT * 0.6;
  const suitX = WIDTH - suitSizeW - WIDTH * 0.05; // small margin
  const suitY = HEIGHT - suitSizeH - HEIGHT * 0.05;
  drawSuitShape(png, suit, suitX, suitY, suitSizeW, suitSizeH, suitColor);
  return PNG.sync.write(png);
}

// rudimentary 10x15 bitmap patterns for characters (simpler and very small)
function getPatternFor(ch){
  const map={
    'S': [
      [0,1,1,1,0],
      [1,0,0,0,1],
      [1,0,0,0,0],
      [0,1,1,1,0],
      [0,0,0,0,1],
      [1,0,0,0,1],
      [0,1,1,1,0]
    ],
    'H': [
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,1,1,1,1],
      [1,0,0,0,1],
      [1,0,0,0,1]
    ],
    'D': [
      [0,1,0],
      [1,0,1],
      [1,0,1],
      [0,1,0]
    ],
    'C': [
      [0,1,1],
      [1,0,0],
      [1,0,0],
      [1,0,0],
      [0,1,1]
    ],
    'A': [
      [0,1,0],
      [1,0,1],
      [1,1,1],
      [1,0,1],
      [1,0,1]
    ],
    '2': null, '3':null,'4':null,'5':null,'6':null,'7':null,'8':null,'9':null,'10':null,
    'J': [[1,1,1],[0,1,0],[0,1,0],[0,1,0],[1,0,1]],
    'Q': [[1,1,1],[1,0,1],[1,1,1],[0,0,1],[1,1,0]],
    'K': [[1,0,1],[1,1,0],[1,0,0],[1,1,0],[1,0,1]]
  };
  return map[ch] || null;
}

// generate and write all cards
for (const suit of suits) {
  for (const rank of ranks) {
    const id = `${rank}${suit}`;
    const buffer = createCardBuffer(rank, suit);
    const outPath = path.join(outDir, `${id}.png`);
    fs.writeFileSync(outPath, buffer);
    console.log('written', outPath);
  }
}
console.log('done all cards');
