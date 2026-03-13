import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  ZoomIn,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CardView, EmptySlot, FaceDownCard } from "@/components/CardView";
import Colors from "@/constants/colors";
import { useGame } from "@/context/GameContext";
import { Card } from "@/game/types";

const SIDE_PAD = 7;
const COL_GAP = 4;
const NUM_COLS = 7;

export default function GameScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const {
    gameState,
    selection,
    moves,
    foundationCount,
    won,
    startNewGame,
    handleDrawStock,
    handleAutoMove: doAutoMove,
    selectWaste,
    selectTableauCard,
    tapFoundation,
    tapTableauPile,
    clearSelection,
  } = useGame();

  const cardW = Math.floor((screenWidth - SIDE_PAD * 2 - COL_GAP * (NUM_COLS - 1)) / NUM_COLS);
  const cardH = Math.round(cardW * (323 / 222));
  const faceDownOffset = Math.round(cardH * 0.18);
  const faceUpOffset = Math.round(cardH * 0.34);

  const suitOrder = ["S", "H", "D", "C"];

  const handleFoundationPress = useCallback(
    (idx: number) => {
      if (selection) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        tapFoundation(idx);
      }
    },
    [selection, tapFoundation]
  );

  const handleTableauCardPress = useCallback(
    (pileIdx: number, cardIdx: number, card: Card) => {
      if (!card.faceUp) return;
      if (selection) {
        if (
          selection.type === "tableau" &&
          selection.pile === pileIdx &&
          selection.cardIndex === cardIdx
        ) {
          clearSelection();
          return;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        selectTableauCard(pileIdx, cardIdx);
      } else {
        Haptics.selectionAsync();
        selectTableauCard(pileIdx, cardIdx);
      }
    },
    [selection, selectTableauCard, clearSelection]
  );

  const handlePilePress = useCallback(
    (pileIdx: number) => {
      if (!selection) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      tapTableauPile(pileIdx);
    },
    [selection, tapTableauPile]
  );

  const handleWastePress = useCallback(() => {
    if (gameState.waste.length === 0) return;
    if (selection?.type === "waste") {
      clearSelection();
      return;
    }
    Haptics.selectionAsync();
    selectWaste();
  }, [gameState.waste.length, selection, selectWaste, clearSelection]);

  const handleNewGame = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    startNewGame();
  }, [startNewGame]);

  const handleAutoMovePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    doAutoMove();
  }, [doAutoMove]);

  const progressPct = (foundationCount / 52) * 100;

  const tableauColumnHeights = useMemo(
    () =>
      gameState.tableau.map((pile) => {
        if (pile.length === 0) return cardH;
        let h = 0;
        for (let i = 0; i < pile.length; i++) {
          if (i < pile.length - 1) {
            h += pile[i].faceUp ? faceUpOffset : faceDownOffset;
          } else {
            h += cardH;
          }
        }
        return h;
      }),
    [gameState.tableau, cardH, faceUpOffset, faceDownOffset]
  );

  const maxColHeight = Math.max(...tableauColumnHeights, cardH);

  return (
    <LinearGradient
      colors={[Colors.background, Colors.felt, "#0a1a0c"]}
      style={[styles.root, { paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>SOLITAIRE</Text>
        <View style={styles.headerRight}>
          <Text style={styles.movesText}>{moves} moves</Text>
          <Pressable
            onPress={handleAutoMovePress}
            style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.headerBtnText}>AUTO</Text>
          </Pressable>
          <Pressable
            onPress={handleNewGame}
            style={({ pressed }) => [styles.headerBtn, styles.newGameBtn, pressed && { opacity: 0.6 }]}
          >
            <Text style={[styles.headerBtnText, { color: Colors.background }]}>NEW</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[styles.progressFill, { width: `${progressPct}%` }]}
          />
        </View>
        <Text style={styles.progressLabel}>{foundationCount}/52</Text>
      </View>

      <View style={[styles.topRow, { paddingHorizontal: SIDE_PAD }]}>
        <Pressable onPress={handleDrawStock} style={{ width: cardW, height: cardH }}>
          {gameState.stock.length > 0 ? (
            <FaceDownCard width={cardW} height={cardH} />
          ) : (
            <EmptySlot width={cardW} height={cardH} onPress={handleDrawStock} label="↺" />
          )}
          {gameState.stock.length > 0 && (
            <View style={[styles.stockBadge]}>
              <Text style={styles.stockBadgeText}>{gameState.stock.length}</Text>
            </View>
          )}
        </Pressable>

        <Pressable
          onPress={handleWastePress}
          style={[
            { width: cardW, height: cardH },
            selection?.type === "waste" && styles.glowEffect,
          ]}
        >
          {gameState.waste.length > 0 ? (
            <CardView
              card={gameState.waste[0]}
              selected={selection?.type === "waste"}
              width={cardW}
              height={cardH}
              disabled
            />
          ) : (
            <EmptySlot width={cardW} height={cardH} />
          )}
        </Pressable>

        <View style={{ flex: 1 }} />

        {gameState.foundations.map((pile, idx) => {
          const topCard = pile[pile.length - 1];
          const isTargeted = !!selection;
          return (
            <Pressable
              key={idx}
              onPress={() => handleFoundationPress(idx)}
              style={{ width: cardW, height: cardH, marginLeft: COL_GAP }}
            >
              {topCard ? (
                <View style={isTargeted ? styles.targetedSlot : undefined}>
                  <CardView card={topCard} width={cardW} height={cardH} disabled />
                </View>
              ) : (
                <EmptySlot width={cardW} height={cardH} onPress={() => handleFoundationPress(idx)} label={suitOrder[idx]} />
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.divider, { marginHorizontal: SIDE_PAD }]} />

      <ScrollView
        style={styles.tableauScroll}
        contentContainerStyle={[
          styles.tableauContent,
          { paddingHorizontal: SIDE_PAD, paddingBottom: insets.bottom + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.tableauRow, { height: maxColHeight + 8 }]}>
          {gameState.tableau.map((pile, pileIdx) => (
            <Pressable
              key={pileIdx}
              onPress={() => handlePilePress(pileIdx)}
              style={[
                styles.tableauColumn,
                { width: cardW, height: tableauColumnHeights[pileIdx] },
                pileIdx > 0 && { marginLeft: COL_GAP },
              ]}
            >
              {pile.length === 0 ? (
                <EmptySlot width={cardW} height={cardH} onPress={() => handlePilePress(pileIdx)} />
              ) : (
                pile.map((card, cardIdx) => {
                  const isTopCard = cardIdx === pile.length - 1;
                  const isSelected =
                    selection?.type === "tableau" &&
                    selection.pile === pileIdx &&
                    selection.cardIndex !== undefined &&
                    cardIdx >= selection.cardIndex;
                  const offset =
                    cardIdx === 0
                      ? 0
                      : pile[cardIdx - 1].faceUp
                      ? faceUpOffset
                      : faceDownOffset;
                  const topPos = pile
                    .slice(0, cardIdx)
                    .reduce(
                      (acc, c, i) =>
                        acc + (i === cardIdx - 1 ? 0 : c.faceUp ? faceUpOffset : faceDownOffset),
                      0
                    );

                  let accTop = 0;
                  for (let i = 0; i < cardIdx; i++) {
                    accTop += pile[i].faceUp ? faceUpOffset : faceDownOffset;
                  }

                  return (
                    <View
                      key={card.id}
                      style={[
                        styles.tableauCard,
                        { top: accTop, width: cardW, height: cardH },
                      ]}
                    >
                      {card.faceUp ? (
                        <CardView
                          card={card}
                          selected={isSelected}
                          onPress={() => handleTableauCardPress(pileIdx, cardIdx, card)}
                          width={cardW}
                          height={cardH}
                        />
                      ) : (
                        <FaceDownCard width={cardW} height={cardH} />
                      )}
                    </View>
                  );
                })
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {won && (
        <Animated.View
          entering={ZoomIn.springify()}
          exiting={FadeOut}
          style={[styles.wonOverlay, { paddingBottom: insets.bottom }]}
        >
          <LinearGradient
            colors={["rgba(0,0,0,0.92)", "rgba(0,20,10,0.97)"]}
            style={styles.wonCard}
          >
            <Text style={styles.wonTitle}>YOU WIN!</Text>
            <Text style={styles.wonSub}>Completed in {moves} moves</Text>
            <Pressable
              onPress={handleNewGame}
              style={({ pressed }) => [styles.wonBtn, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.wonBtnText}>Play Again</Text>
            </Pressable>
          </LinearGradient>
        </Animated.View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIDE_PAD + 4,
    paddingVertical: 8,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    letterSpacing: 4,
    color: Colors.accent,
    textShadowColor: Colors.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  movesText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  headerBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  newGameBtn: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  headerBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIDE_PAD + 4,
    marginBottom: 8,
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  progressLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
    width: 34,
    textAlign: "right",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  stockBadge: {
    position: "absolute",
    top: 3,
    right: 3,
    backgroundColor: Colors.accentMuted,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  stockBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    color: Colors.accent,
  },
  glowEffect: {
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 10,
  },
  targetedSlot: {
    opacity: 0.75,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.accentDim,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 8,
    opacity: 0.5,
  },
  tableauScroll: {
    flex: 1,
  },
  tableauContent: {
    flexGrow: 1,
  },
  tableauRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  tableauColumn: {
    position: "relative",
  },
  tableauCard: {
    position: "absolute",
    left: 0,
  },
  wonOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    zIndex: 99,
  },
  wonCard: {
    width: 280,
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  wonTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 42,
    color: Colors.accent,
    letterSpacing: 6,
    textShadowColor: Colors.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
    marginBottom: 8,
  },
  wonSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 28,
  },
  wonBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 12,
  },
  wonBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.background,
    letterSpacing: 1,
  },
});
