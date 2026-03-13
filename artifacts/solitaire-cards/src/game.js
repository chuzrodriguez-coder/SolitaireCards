import {createDeck,shuffle} from './deck.js';

function rankValue(rank){
  if(rank==='A') return 1;
  if(rank==='J') return 11;
  if(rank==='Q') return 12;
  if(rank==='K') return 13;
  return Number(rank);
}

export default class SolitaireGame{
  constructor(){
    this.reset();
  }

  reset(){
    const d = shuffle(createDeck());
    this.foundations = [[],[],[],[]];
    this.waste = [];
    this.stock = d.slice();
    this.tableau = Array.from({length:7},()=>[]);
    for(let i=0;i<7;i++){
      for(let j=0;j<=i;j++){
        const card = this.stock.shift();
        card.faceUp = (j===i);
        this.tableau[i].push(card);
      }
    }
  }

  drawFromStock(){
    if(this.stock.length===0){
      this.stock = this.waste.map(c=>{c.faceUp=false; return c;}).reverse();
      this.waste = [];
      return false;
    }
    const c = this.stock.shift();
    c.faceUp = true;
    this.waste.unshift(c);
    return true;
  }

  canPlaceOnTableau(card, destPile){
    if(destPile.length===0) return rankValue(card.rank)===13;
    const top = destPile[destPile.length-1];
    return (top.color !== card.color) && (rankValue(top.rank) === rankValue(card.rank)+1);
  }

  canPlaceOnFoundation(card, foundationPile){
    if(foundationPile.length===0) return card.rank==='A';
    const top = foundationPile[foundationPile.length-1];
    return (top.suit===card.suit) && (rankValue(card.rank) === rankValue(top.rank)+1);
  }

  moveTableauToTableau(fromIndex, cardIndex, toIndex){
    const from = this.tableau[fromIndex];
    const moving = from.slice(cardIndex);
    if(!moving.length) return false;
    if(!moving[0].faceUp) return false;
    if(this.canPlaceOnTableau(moving[0], this.tableau[toIndex])){
      this.tableau[toIndex].push(...moving);
      this.tableau[fromIndex] = from.slice(0,cardIndex);
      const f = this.tableau[fromIndex];
      if(f.length && !f[f.length-1].faceUp) f[f.length-1].faceUp = true;
      return true;
    }
    return false;
  }

  moveTableauToFoundation(fromIndex, foundationIndex){
    const from = this.tableau[fromIndex];
    if(!from.length) return false;
    const card = from[from.length-1];
    if(!card.faceUp) return false;
    if(this.canPlaceOnFoundation(card, this.foundations[foundationIndex])){
      this.foundations[foundationIndex].push(card);
      from.pop();
      if(from.length && !from[from.length-1].faceUp) from[from.length-1].faceUp = true;
      return true;
    }
    return false;
  }

  moveWasteToFoundation(foundationIndex){
    if(!this.waste.length) return false;
    const card = this.waste[0];
    if(this.canPlaceOnFoundation(card, this.foundations[foundationIndex])){
      this.foundations[foundationIndex].push(card);
      this.waste.shift();
      return true;
    }
    return false;
  }

  moveWasteToTableau(toIndex){
    if(!this.waste.length) return false;
    const card = this.waste[0];
    if(this.canPlaceOnTableau(card, this.tableau[toIndex])){
      this.tableau[toIndex].push(card);
      this.waste.shift();
      return true;
    }
    return false;
  }

  autoMoveToFoundations(){
    let moved = true;
    while(moved){
      moved = false;
      if(this.waste.length){
        for(let i=0;i<4;i++){
          if(this.moveWasteToFoundation(i)){ moved=true; break; }
        }
      }
      for(let t=0;t<7 && !moved;t++){
        if(this.tableau[t].length){
          for(let f=0;f<4;f++){
            if(this.moveTableauToFoundation(t,f)){ moved=true; break; }
          }
        }
      }
    }
  }

  serialize(){
    return JSON.stringify({foundations:this.foundations, waste:this.waste, stock:this.stock, tableau:this.tableau});
  }

  static deserialize(json){
    const obj = JSON.parse(json);
    const g = new SolitaireGame();
    g.foundations = obj.foundations;
    g.waste = obj.waste;
    g.stock = obj.stock;
    g.tableau = obj.tableau;
    return g;
  }
}
