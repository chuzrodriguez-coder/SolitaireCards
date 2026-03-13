import SolitaireGame from './src/game.js';
import {renderGame} from './src/ui.js';

export const SAVE_KEY = 'solitaire-save-v1';

export let game = new SolitaireGame();
export let selection = null; // {type:'tableau'|'waste',pile:index,cardIndex}

export function saveGame(){
  try{ localStorage.setItem(SAVE_KEY, game.serialize()); void(0); }catch(e){console.error(e); alert('Save failed');}
}

export function loadGame(){
  const s = localStorage.getItem(SAVE_KEY);
  if(!s) return false;
  try{ game = SolitaireGame.deserialize(s); return true;}catch(e){console.error(e); return false}
}

export function refresh(){
  renderGame(game);
}

export function initUI(){
  // attach handlers for normal operation; caller must ensure document exists
  document.getElementById('newGame').addEventListener('click',()=>{ game.reset(); refresh(); });
  document.getElementById('saveGame').addEventListener('click',()=>{ saveGame(); });
  document.getElementById('loadGame').addEventListener('click',()=>{ if(loadGame()){ refresh(); alert('Loaded saved game'); } else alert('No saved game'); });
  document.getElementById('autoMove').addEventListener('click',()=>{ game.autoMoveToFoundations(); refresh(); });
  document.getElementById('stock').addEventListener('click',()=>{ game.drawFromStock(); refresh(); });
  // handle clicks for tableau cards and foundations
  document.addEventListener('click', handleClick);
}

// handle clicks for tableau cards and foundations

export function handleClick(ev){
  const t = ev.target;
  // card clicked
  if(t.classList.contains('card')){
    const pile = Number(t.dataset.pile);
    const index = Number(t.dataset.index);
    // if there's an existing selection, try to use this click as a destination
    if(selection){
      if(selection.type==='tableau'){
        if(game.moveTableauToTableau(selection.pile, selection.cardIndex, pile)){
          selection = null;
          refresh();
          saveGame();
          return;
        }
      } else if(selection.type==='waste'){
        // clicking any tableau card should count as clicking that pile
        if(game.moveWasteToTableau(pile)){
          selection = null;
          refresh();
          saveGame();
          return;
        }
      }
      // if move wasn't valid, fall through and select this card instead
    }
    selection = {type:'tableau',pile,cardIndex:index};
    refresh();
    highlightSelection();
    return;
  }
  // foundation clicked
  if(t.classList.contains('foundation')){
    const fi = Number(t.dataset.foundation);
    if(selection && selection.type==='tableau'){
      if(game.moveTableauToFoundation(selection.pile,fi)){
        selection=null; refresh(); saveGame(); return;
      }
    } else if(selection && selection.type==='waste'){
      if(game.moveWasteToFoundation(fi)){ selection=null; refresh(); saveGame(); return; }
    }
  }
  // tableau column clicked (empty or to place)
  if(t.classList.contains('tableau-col') || t.classList.contains('pile') && t.parentElement && t.parentElement.classList.contains('tableau-col')){
    const col = t.dataset.pile? Number(t.dataset.pile) : Number(t.parentElement.dataset.pile);
    if(selection){
      if(selection.type==='tableau'){
        if(game.moveTableauToTableau(selection.pile, selection.cardIndex, col)){
          selection=null; refresh(); saveGame(); return;
        }
      } else if(selection.type==='waste'){
        if(game.moveWasteToTableau(col)){
          selection=null; refresh(); saveGame(); return;
        }
      }
    }
    // if clicked empty or move invalid, clear selection
    selection=null; refresh();
  }
  // waste clicked
  if(t.id==='waste'){
    if(game.waste.length){ selection={type:'waste'}; highlightSelection(); }
    else selection=null;
  }
}


export function highlightSelection(){
  // update selectedInfo
  const info = document.getElementById('selectedInfo');
  if(!selection){ info.textContent='None'; return; }
  if(selection.type==='waste'){
    info.textContent = `Waste -> ${game.waste[0].id}`;
    return;
  }
  const pile = game.tableau[selection.pile];
  const seq = pile.slice(selection.cardIndex).map(c=>c.id).join(' ');
  info.textContent = `Pile ${selection.pile+1}: ${seq}`;
}

if(typeof document !== 'undefined'){
  initUI();
  refresh();
}
