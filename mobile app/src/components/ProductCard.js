import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';
import Card from './Card';
import ScoreBadge from './ScoreBadge';
import NutriGradeBadge from './NutriGradeBadge';

/**
 * Horizontal product list row — image, name/brand/meta, optional badge.
 * Pass `imageUrl` for a real product image, or `imageColors` for a gradient placeholder.
 * Pass `score` (0-100) for a circular safety badge OR `grade` (A-E) for a square nutri badge.
 */
export default function ProductCard({
  name,
  brand,
  meta,
  score,
  grade,
  imageUrl,
  imageColors,
  onPress,
}) {
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        {/* Product image */}
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : imageColors && imageColors.length === 2 ? (
          <LinearGradient
            colors={imageColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.image}
          />
        ) : (
          <View
            style={[
              styles.image,
              {
                backgroundColor:
                  imageColors && imageColors[0] ? imageColors[0] : theme.colors.green100,
              },
            ]}
          />
        )}

        {/* Text column */}
        <View style={styles.textColumn}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {brand ? (
            <Text style={styles.brand} numberOfLines={1}>
              {brand}
            </Text>
          ) : null}
          {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        </View>

        {/* Badge */}
        {score != null && <ScoreBadge score={score} size={44} />}
        {grade != null && score == null && (
          <NutriGradeBadge grade={grade} size={36} />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.md,
    flexShrink: 0,
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },
  brand: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  meta: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.xs,
    color: theme.colors.textDim,
    marginTop: 2,
  },
});
