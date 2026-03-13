import {createDeck,shuffle} from '../src/deck.js';

function assert(cond,msg){ if(!cond) throw new Error(msg||'Assertion failed'); }

export default function run(){
  const d = createDeck();
  assert(d.length===52,'deck should have 52 cards');
  const ids = new Set(d.map(c=>c.id));
  assert(ids.size===52,'cards should be unique');

  // every id should be rank followed by one of SHDC
  const idPattern = /^([A2-9JQK]|10)[SHDC]$/;
  for(const card of d){
    assert(idPattern.test(card.id), `bad id ${card.id}`);
    assert(['S','H','D','C'].includes(card.suit), `invalid suit ${card.suit}`);
    const expectedColor = (card.suit==='S' || card.suit==='C')?'black':'red';
    assert(card.color===expectedColor, `color mismatch for ${card.id}`);
    // ensure no unicode suit symbol creeping into id or suit
    assert(!/[^ -~]/.test(card.id), `id contains non-ascii: ${card.id}`);
    assert(!/[^ -~]/.test(card.suit), `suit contains non-ascii: ${card.suit}`);
  }

  const s = shuffle(d);
  assert(s.length===52,'shuffled deck size preserved');
  console.log('deck.test.js passed');
}

run();
