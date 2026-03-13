import SolitaireGame from './game.js';
import {renderGame} from './ui.js';

const SAVE_KEY = 'solitaire-save-v1';

let game = new SolitaireGame();
let selection = null; // {type:'tableau'|'waste', pile:index, cardIndex}

function saveGame(){
  try{ localStorage.setItem(SAVE_KEY, game.serialize()); }
  catch(e){ console.error(e); alert('Save failed'); }
}

function loadGame(){
  const s = localStorage.getItem(SAVE_KEY);
  if(!s) return false;
  try{ game = SolitaireGame.deserialize(s); return true; }
  catch(e){ console.error(e); return false; }
}

function refresh(){
  renderGame(game);
}

function highlightSelection(){
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

function initUI(){
  document.getElementById('newGame').addEventListener('click', ()=>{ game.reset(); selection=null; refresh(); });
  document.getElementById('saveGame').addEventListener('click', ()=>{ saveGame(); });
  document.getElementById('loadGame').addEventListener('click', ()=>{
    if(loadGame()){ selection=null; refresh(); alert('Loaded saved game'); }
    else alert('No saved game');
  });
  document.getElementById('autoMove').addEventListener('click', ()=>{ game.autoMoveToFoundations(); selection=null; refresh(); });
  document.getElementById('stock').addEventListener('click', ()=>{ game.drawFromStock(); selection=null; refresh(); });

  document.addEventListener('click', (e)=>{
    const t = e.target;

    // Tableau card clicked
    if(t.classList.contains('card') && t.dataset.pile !== undefined && t.dataset.index !== undefined){
      const pi = Number(t.dataset.pile);
      const ci = Number(t.dataset.index);
      const card = game.tableau[pi][ci];
      if(!card.faceUp) return;

      if(selection && selection.type==='tableau'){
        if(game.moveTableauToTableau(selection.pile, selection.cardIndex, pi)){
          selection=null; refresh(); saveGame(); return;
        }
      } else if(selection && selection.type==='waste'){
        if(game.moveWasteToTableau(pi)){
          selection=null; refresh(); saveGame(); return;
        }
      }
      // Select this card/sequence
      selection = {type:'tableau', pile:pi, cardIndex:ci};
      highlightSelection();
      return;
    }

    // Foundation clicked
    if(t.classList.contains('foundation') || t.closest('.foundation')){
      const el = t.classList.contains('foundation') ? t : t.closest('.foundation');
      const fi = Number(el.dataset.foundation);
      if(selection && selection.type==='tableau'){
        if(game.moveTableauToFoundation(selection.pile, fi)){
          selection=null; refresh(); saveGame(); return;
        }
      } else if(selection && selection.type==='waste'){
        if(game.moveWasteToFoundation(fi)){ selection=null; refresh(); saveGame(); return; }
      }
      return;
    }

    // Tableau column (empty slot) clicked
    if(t.classList.contains('tableau-col') || t.classList.contains('empty')){
      const col = t.dataset.pile !== undefined ? Number(t.dataset.pile) : Number(t.parentElement.dataset.pile);
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
      selection=null; refresh();
      return;
    }

    // Waste clicked
    if(t.id==='waste' || t.closest('#waste')){
      if(game.waste.length){ selection={type:'waste'}; highlightSelection(); }
      else selection=null;
      return;
    }
  });
}

initUI();
refresh();
