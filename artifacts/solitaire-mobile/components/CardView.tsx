import React from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import cardImages from "@/constants/cardImages";
import Colors from "@/constants/colors";
import { Card } from "@/game/types";

interface CardViewProps {
  card: Card;
  selected?: boolean;
  onPress?: () => void;
  width: number;
  height: number;
  disabled?: boolean;
}

export function CardView({ card, selected, onPress, width, height, disabled }: CardViewProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => { scale.value = withSpring(0.95, { damping: 20 }); };
  const handlePressOut = () => { scale.value = withSpring(1, { damping: 20 }); };

  const cardStyle = [
    styles.card,
    { width, height, borderRadius: width * 0.1 },
    selected && styles.selected,
  ];

  if (!card.faceUp) {
    return (
      <Animated.View style={[animStyle, { width, height }]}>
        <View style={[...cardStyle, styles.faceDown, { width, height }]} />
      </Animated.View>
    );
  }

  const img = cardImages[card.id];

  return (
    <Animated.View style={[animStyle, { width, height }]}>
      <Pressable
        onPress={disabled ? undefined : onPress}
        onPressIn={disabled ? undefined : handlePressIn}
        onPressOut={disabled ? undefined : handlePressOut}
        disabled={disabled}
        style={{ width, height }}
      >
        <View style={[...cardStyle, { overflow: "hidden", width, height }]}>
          {img ? (
            <Image
              source={img}
              style={{ width: "100%", height: "100%", borderRadius: width * 0.1 }}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.fallback, { borderRadius: width * 0.1 }]} />
          )}
          {selected && <View style={[styles.selectedOverlay, { borderRadius: width * 0.1 }]} />}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function FaceDownCard({ width, height }: { width: number; height: number }) {
  return (
    <View
      style={[
        styles.card,
        styles.faceDown,
        { width, height, borderRadius: width * 0.1 },
      ]}
    />
  );
}

export function EmptySlot({
  width,
  height,
  onPress,
  label,
}: {
  width: number;
  height: number;
  onPress?: () => void;
  label?: string;
}) {
  return (
    <Pressable onPress={onPress} style={{ width, height }}>
      <View
        style={[
          styles.emptySlot,
          { width, height, borderRadius: width * 0.1 },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cardBack,
  },
  faceDown: {
    backgroundColor: Colors.cardBackAccent,
    borderColor: Colors.border,
    borderWidth: 1,
  },
  selected: {
    borderColor: Colors.selectedBorder,
    borderWidth: 2,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 8,
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.selected,
  },
  emptySlot: {
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    borderStyle: "dashed",
    backgroundColor: Colors.empty,
  },
  fallback: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
  },
});
