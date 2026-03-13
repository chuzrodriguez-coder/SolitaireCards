export function createDeck(){
  // use plain-letter suit codes for ids and file names; keep symbols for clarity if needed
  const suitMap = [
    {code:'S', symbol:'♠'},
    {code:'H', symbol:'♥'},
    {code:'D', symbol:'♦'},
    {code:'C', symbol:'♣'},
  ];
  const ranks=["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
  const deck=[];
  for(const {code,symbol} of suitMap){
    for(const r of ranks){
      const color = (code==='S' || code==='C') ? 'black' : 'red';
      deck.push({id:`${r}${code}`,suit:code,rank:r,color,faceUp:false, symbol});
    }
  }
  return deck;
}

export function shuffle(deck){
  const a=deck.slice();
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

export function deal(deck, count){
  return deck.splice(0,count);
}
