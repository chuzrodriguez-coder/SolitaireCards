export type Suit = "S" | "H" | "D" | "C";
export type Color = "black" | "red";
export type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  color: Color;
  faceUp: boolean;
  symbol: string;
}

export interface GameState {
  foundations: Card[][];
  waste: Card[];
  stock: Card[];
  tableau: Card[][];
}

export type SelectionType = "tableau" | "waste";

export interface Selection {
  type: SelectionType;
  pile?: number;
  cardIndex?: number;
}
