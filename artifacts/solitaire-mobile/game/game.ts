import { Card, GameState, Rank } from "./types";
import { createDeck, shuffle } from "./deck";

export function rankValue(rank: Rank): number {
  if (rank === "A") return 1;
  if (rank === "J") return 11;
  if (rank === "Q") return 12;
  if (rank === "K") return 13;
  return Number(rank);
}

export function newGame(): GameState {
  const d = shuffle(createDeck());
  const tableau: Card[][] = Array.from({ length: 7 }, () => []);
  const stock = d.slice();
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j <= i; j++) {
      const card = stock.shift()!;
      card.faceUp = j === i;
      tableau[i].push(card);
    }
  }
  return { foundations: [[], [], [], []], waste: [], stock, tableau };
}

export function drawFromStock(state: GameState): GameState {
  const s = deepClone(state);
  if (s.stock.length === 0) {
    s.stock = s.waste.map((c) => ({ ...c, faceUp: false })).reverse();
    s.waste = [];
    return s;
  }
  const c = s.stock.shift()!;
  c.faceUp = true;
  s.waste.unshift(c);
  return s;
}

export function canPlaceOnTableau(card: Card, destPile: Card[]): boolean {
  if (destPile.length === 0) return rankValue(card.rank) === 13;
  const top = destPile[destPile.length - 1];
  return top.color !== card.color && rankValue(top.rank) === rankValue(card.rank) + 1;
}

export function canPlaceOnFoundation(card: Card, foundationPile: Card[]): boolean {
  if (foundationPile.length === 0) return card.rank === "A";
  const top = foundationPile[foundationPile.length - 1];
  return top.suit === card.suit && rankValue(card.rank) === rankValue(top.rank) + 1;
}

export function moveTableauToTableau(
  state: GameState,
  fromIndex: number,
  cardIndex: number,
  toIndex: number
): GameState | null {
  const s = deepClone(state);
  const from = s.tableau[fromIndex];
  const moving = from.slice(cardIndex);
  if (!moving.length || !moving[0].faceUp) return null;
  if (!canPlaceOnTableau(moving[0], s.tableau[toIndex])) return null;
  s.tableau[toIndex].push(...moving);
  s.tableau[fromIndex] = from.slice(0, cardIndex);
  const f = s.tableau[fromIndex];
  if (f.length && !f[f.length - 1].faceUp) f[f.length - 1].faceUp = true;
  return s;
}

export function moveTableauToFoundation(
  state: GameState,
  fromIndex: number,
  foundationIndex: number
): GameState | null {
  const s = deepClone(state);
  const from = s.tableau[fromIndex];
  if (!from.length) return null;
  const card = from[from.length - 1];
  if (!card.faceUp) return null;
  if (!canPlaceOnFoundation(card, s.foundations[foundationIndex])) return null;
  s.foundations[foundationIndex].push(card);
  from.pop();
  if (from.length && !from[from.length - 1].faceUp) from[from.length - 1].faceUp = true;
  return s;
}

export function moveWasteToFoundation(
  state: GameState,
  foundationIndex: number
): GameState | null {
  const s = deepClone(state);
  if (!s.waste.length) return null;
  const card = s.waste[0];
  if (!canPlaceOnFoundation(card, s.foundations[foundationIndex])) return null;
  s.foundations[foundationIndex].push(card);
  s.waste.shift();
  return s;
}

export function moveWasteToTableau(state: GameState, toIndex: number): GameState | null {
  const s = deepClone(state);
  if (!s.waste.length) return null;
  const card = s.waste[0];
  if (!canPlaceOnTableau(card, s.tableau[toIndex])) return null;
  s.tableau[toIndex].push(card);
  s.waste.shift();
  return s;
}

export function autoMoveToFoundations(state: GameState): GameState {
  let s = deepClone(state);
  let moved = true;
  while (moved) {
    moved = false;
    if (s.waste.length) {
      for (let i = 0; i < 4; i++) {
        const next = moveWasteToFoundation(s, i);
        if (next) { s = next; moved = true; break; }
      }
    }
    for (let t = 0; t < 7 && !moved; t++) {
      for (let f = 0; f < 4; f++) {
        const next = moveTableauToFoundation(s, t, f);
        if (next) { s = next; moved = true; break; }
      }
    }
  }
  return s;
}

export function isWon(state: GameState): boolean {
  return state.foundations.every((f) => f.length === 13);
}

export function countFoundationCards(state: GameState): number {
  return state.foundations.reduce((s, f) => s + f.length, 0);
}

export function serializeGame(state: GameState): string {
  return JSON.stringify(state);
}

export function deserializeGame(json: string): GameState {
  return JSON.parse(json);
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
