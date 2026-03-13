let JSDOM;
try {
  ({JSDOM} = await import('jsdom'));
} catch(e){
  // jsdom not available; tests relying on DOM will be skipped
}
// provide simple globals for node environment running app.js
if(typeof global.localStorage === 'undefined'){
  global.localStorage = { setItem:()=>{}, getItem:()=>null };
}
if(typeof global.alert === 'undefined'){
  global.alert = ()=>{};
}
import {game, handleClick, selection} from '../public/app.js';
import {renderGame} from '../src/ui.js';

function assert(cond, msg){ if(!cond) throw new Error(msg||'Assertion failed'); }

export default async function run(){
  // if jsdom isn't available, skip the DOM interactions
  if(!JSDOM){
    console.log('ui.test.js skipped (jsdom not installed)');
    return;
  }

  // create a simple DOM environment
  const dom = new JSDOM(`<!doctype html><html><body>
    <div id="foundations"></div>
    <div id="tableau"></div>
    <div id="stock"></div>
    <div id="waste"></div>
    <div id="progress"></div>
    <div id="selectedInfo"></div>
    <button id="newGame"></button>
    <button id="saveGame"></button>
    <button id="loadGame"></button>
    <button id="autoMove"></button>
  </body></html>`, { runScripts: "outside-only" });

  global.document = dom.window.document;
  global.window = dom.window;

  // initialize game and render
  game.reset();
  renderGame(game);

  // simulate selecting a card from pile 0 and moving it onto a valid destination
  // force a simple situation: pile0 has a face-up card 5 clubs, pile1 has face-up 6 hearts
  const cardA = {id:'5C', rank:'5', suit:'C', color:'black', faceUp:true};
  const cardB = {id:'6H', rank:'6', suit:'H', color:'red', faceUp:true};
  game.tableau[0] = [cardA];
  game.tableau[1] = [cardB];
  renderGame(game);

  // locate DOM elements
  const pile0card = document.querySelector('[data-pile="0"][data-index="0"]');
  const pile1card = document.querySelector('[data-pile="1"][data-index="0"]');
  assert(pile0card && pile1card, 'cards should exist in DOM');
  // cards should have img children showing their faces
  assert(pile0card.querySelector('img') && pile1card.querySelector('img'), 'face-up cards should contain an img');

  // click pile0card to select
  handleClick({target: pile0card});
  assert(selection && selection.pile===0 && selection.cardIndex===0, 'selection should be set');

  // click pile1card to move onto it (legal move)
  handleClick({target: pile1card});

  // after move, pile1 should contain cardA at end and pile0 should be empty
  assert(game.tableau[1].length===2 && game.tableau[1][1]===cardA, 'cardA should have moved to pile1');
  assert(game.tableau[0].length===0, 'pile0 should be empty after move');

  // --- new: king from waste onto empty column ---
  // set up waste king
  const king = {id:'KH', rank:'K', suit:'H', color:'red', faceUp:true};
  game.waste = [king];
  // empty a pile completely
  game.tableau[2] = [];
  renderGame(game);
  // click waste to select
  const wasteEl = document.getElementById('waste');
  handleClick({target: wasteEl});
  assert(selection && selection.type==='waste', 'waste should be selected');
  // click the empty slot inside tableau-col 3
  const emptySlot = document.querySelector('[data-pile="2"] .pile.empty');
  assert(emptySlot, 'empty slot should exist');
  handleClick({target: emptySlot});
  // king should now be on pile2
  assert(game.tableau[2].length===1 && game.tableau[2][0]===king, 'king should move from waste to empty pile');

  // --- verify color styling for red suits in waste and foundations ---
  // put a diamond in foundation 0
  const redCard = {id:'2D', rank:'2', suit:'D', color:'red', faceUp:true};
  game.foundations[0] = [redCard];
  // ensure waste contains a red card (king moved earlier)
  const redWaste = {id:'QH', rank:'Q', suit:'H', color:'red', faceUp:true};
  game.waste = [redWaste];
  renderGame(game);
  const fEl = document.querySelector('[data-foundation="0"]');
  assert(fEl, 'foundation element should exist');
  const fColor = fEl.style.color;
  assert(fColor && (fColor.includes('187') || fColor.includes('b00')), 'foundation card should be colored red');
  const fImg = fEl.querySelector('img');
  assert(fImg && fImg.src && fImg.src.includes('cards/2D.png'), 'foundation should show card image');
  const wasteElem = document.getElementById('waste');
  assert(wasteElem, 'waste element should exist');
  const wColor = wasteElem.style.color;
  assert(wColor && (wColor.includes('187') || wColor.includes('b00')), 'waste card should be colored red');
  const wImg = wasteElem.querySelector('img');
  assert(wImg && wImg.src && wImg.src.includes('cards/QH.png'), 'waste should show card image');

  // switch to a black suit in both piles and verify the color resets
  game.foundations[0] = [{id:'3C', rank:'3', suit:'C', color:'black', faceUp:true}];
  game.waste = [{id:'9S', rank:'9', suit:'S', color:'black', faceUp:true}];
  renderGame(game);
  const fColor2 = document.querySelector('[data-foundation="0"]').style.color;
  const wColor2 = document.getElementById('waste').style.color;
  assert(fColor2 && fColor2.includes('0') && !fColor2.includes('187'), 'foundation card with black suit should not be red');
  assert(wColor2 && wColor2.includes('0') && !wColor2.includes('187'), 'waste card with black suit should not be red');
  // ensure backgrounds still point to card images
  const fImg2 = document.querySelector('[data-foundation="0"]').querySelector('img');
  assert(fImg2 && fImg2.src.includes('cards/3C.png'), 'foundation still uses card image');
  const wImg2 = document.getElementById('waste').querySelector('img');
  assert(wImg2 && wImg2.src.includes('cards/9S.png'), 'waste still uses card image');

  console.log('ui.test.js passed');
}

// run immediately when imported
run();
