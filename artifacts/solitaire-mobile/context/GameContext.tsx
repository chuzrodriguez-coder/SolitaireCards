import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

import {
  autoMoveToFoundations,
  countFoundationCards,
  deserializeGame,
  drawFromStock,
  isWon,
  moveTableauToFoundation,
  moveTableauToTableau,
  moveWasteToFoundation,
  moveWasteToTableau,
  newGame,
  serializeGame,
} from "@/game/game";
import { GameState, Selection } from "@/game/types";

const SAVE_KEY = "solitaire-save-v2";

interface GameContextValue {
  gameState: GameState;
  selection: Selection | null;
  moves: number;
  foundationCount: number;
  won: boolean;
  startNewGame: () => void;
  handleDrawStock: () => void;
  handleAutoMove: () => void;
  selectWaste: () => void;
  selectTableauCard: (pile: number, cardIndex: number) => void;
  tapFoundation: (foundationIndex: number) => void;
  tapTableauPile: (pileIndex: number) => void;
  clearSelection: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(newGame());
  const [selection, setSelection] = useState<Selection | null>(null);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    (async () => {
      if (initialized.current) return;
      initialized.current = true;
      try {
        const saved = await AsyncStorage.getItem(SAVE_KEY);
        if (saved) {
          const parsed = deserializeGame(saved);
          setGameState(parsed);
        }
      } catch {}
    })();
  }, []);

  const save = useCallback(async (state: GameState) => {
    try {
      await AsyncStorage.setItem(SAVE_KEY, serializeGame(state));
    } catch {}
  }, []);

  const applyState = useCallback(
    (state: GameState, clearSel = true) => {
      setGameState(state);
      if (clearSel) setSelection(null);
      setMoves((m) => m + 1);
      setWon(isWon(state));
      save(state);
    },
    [save]
  );

  const startNewGame = useCallback(() => {
    const state = newGame();
    setGameState(state);
    setSelection(null);
    setMoves(0);
    setWon(false);
    save(state);
  }, [save]);

  const handleDrawStock = useCallback(() => {
    const next = drawFromStock(gameState);
    applyState(next);
  }, [gameState, applyState]);

  const handleAutoMove = useCallback(() => {
    const next = autoMoveToFoundations(gameState);
    applyState(next);
  }, [gameState, applyState]);

  const selectWaste = useCallback(() => {
    if (gameState.waste.length === 0) return;
    setSelection({ type: "waste" });
  }, [gameState]);

  const selectTableauCard = useCallback(
    (pile: number, cardIndex: number) => {
      const card = gameState.tableau[pile][cardIndex];
      if (!card?.faceUp) return;

      if (selection) {
        // Try to move to this pile
        let next: GameState | null = null;
        if (selection.type === "tableau" && selection.pile !== undefined && selection.cardIndex !== undefined) {
          next = moveTableauToTableau(gameState, selection.pile, selection.cardIndex, pile);
        } else if (selection.type === "waste") {
          next = moveWasteToTableau(gameState, pile);
        }
        if (next) { applyState(next); return; }
      }
      setSelection({ type: "tableau", pile, cardIndex });
    },
    [gameState, selection, applyState]
  );

  const tapFoundation = useCallback(
    (foundationIndex: number) => {
      if (!selection) return;
      let next: GameState | null = null;
      if (selection.type === "tableau" && selection.pile !== undefined) {
        next = moveTableauToFoundation(gameState, selection.pile, foundationIndex);
      } else if (selection.type === "waste") {
        next = moveWasteToFoundation(gameState, foundationIndex);
      }
      if (next) { applyState(next); return; }
      setSelection(null);
    },
    [gameState, selection, applyState]
  );

  const tapTableauPile = useCallback(
    (pileIndex: number) => {
      if (!selection) return;
      let next: GameState | null = null;
      if (selection.type === "tableau" && selection.pile !== undefined && selection.cardIndex !== undefined) {
        next = moveTableauToTableau(gameState, selection.pile, selection.cardIndex, pileIndex);
      } else if (selection.type === "waste") {
        next = moveWasteToTableau(gameState, pileIndex);
      }
      if (next) { applyState(next); return; }
      setSelection(null);
    },
    [gameState, selection, applyState]
  );

  const clearSelection = useCallback(() => setSelection(null), []);

  const foundationCount = countFoundationCards(gameState);

  return (
    <GameContext.Provider
      value={{
        gameState,
        selection,
        moves,
        foundationCount,
        won,
        startNewGame,
        handleDrawStock,
        handleAutoMove,
        selectWaste,
        selectTableauCard,
        tapFoundation,
        tapTableauPile,
        clearSelection,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside GameProvider");
  return ctx;
}
