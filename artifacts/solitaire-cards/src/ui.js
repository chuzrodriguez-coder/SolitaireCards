export function renderGame(game){
  const foundations = document.getElementById('foundations');
  const tableau = document.getElementById('tableau');
  const stock = document.getElementById('stock');
  const waste = document.getElementById('waste');
  const progress = document.getElementById('progress');

  foundations.innerHTML = '';
  for(let i=0;i<4;i++){
    const el = document.createElement('div');
    el.className='pile foundation';
    el.dataset.foundation = i;
    if(game.foundations[i].length){
      const card = game.foundations[i].slice(-1)[0];
      el.textContent = '';
      const img = document.createElement('img');
      img.src = `cards/${card.id}.png`;
      img.alt = card.id;
      el.appendChild(img);
      el.style.color = (card.suit==='H' || card.suit==='D') ? '#b00' : '#000';
    } else {
      el.textContent = 'Foundation';
      el.style.color = '';
    }
    foundations.appendChild(el);
  }

  tableau.innerHTML = '';
  game.tableau.forEach((pile,pi)=>{
    const col = document.createElement('div');
    col.className='tableau-col';
    col.dataset.pile = pi;
    if(pile.length===0){
      const slot = document.createElement('div'); slot.className='pile empty'; slot.textContent='Empty'; col.appendChild(slot);
    }
    pile.forEach((c,idx)=>{
      const card = document.createElement('div');
      card.className = c.faceUp? 'card faceup' : 'card facedown';
      card.dataset.pile = pi;
      card.dataset.index = idx;
      if(c.faceUp){
        card.textContent = '';
        const img = document.createElement('img');
        img.src = `cards/${c.id}.png`;
        img.alt = c.id;
        card.appendChild(img);
        card.style.color = c.color==='red'? '#b00':'#000';
      } else {
        card.textContent = '';
      }
      col.appendChild(card);
    });
    tableau.appendChild(col);
  });

  stock.textContent = `Stock (${game.stock.length})`;
  if(game.waste.length){
    const w = game.waste[0];
    waste.textContent = '';
    const img = document.createElement('img');
    img.src = `cards/${w.id}.png`;
    img.alt = w.id;
    waste.innerHTML = '';
    waste.appendChild(img);
    waste.style.color = (w.suit==='H' || w.suit==='D') ? '#b00' : '#000';
  } else {
    waste.textContent = 'Waste';
    waste.innerHTML = '';
    waste.style.color = '';
  }

  progress.innerHTML = '';
  const foundationCount = game.foundations.reduce((s,p)=>s+p.length,0);
  const fEl = document.createElement('div'); fEl.textContent = `Foundations: ${foundationCount}/52`; progress.appendChild(fEl);

  game.tableau.forEach((pile,pi)=>{
    let best = 0;
    for(let i=0;i<pile.length;i++){
      if(!pile[i].faceUp) continue;
      let len=1;
      for(let j=i+1;j<pile.length;j++){
        const prev = pile[j-1], cur = pile[j];
        const prevVal = prev.rank==='A'?1:(prev.rank==='J'?11:(prev.rank==='Q'?12:(prev.rank==='K'?13:Number(prev.rank))));
        const curVal = cur.rank==='A'?1:(cur.rank==='J'?11:(cur.rank==='Q'?12:(cur.rank==='K'?13:Number(cur.rank))));
        if(prevVal === curVal+1 && prev.color !== cur.color && cur.faceUp) len++; else break;
      }
      best = Math.max(best,len);
    }
    const el = document.createElement('div'); el.textContent = `Pile ${pi+1}: ${best}`; progress.appendChild(el);
  });
}
