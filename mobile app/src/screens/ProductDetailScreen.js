import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';
import Card from '../components/Card';
import Icon from '../components/Icon';
import Button from '../components/Button';
import ScoreBadge from '../components/ScoreBadge';

const SAMPLE_PRODUCT = {
  name: 'Organic Almond Butter',
  brand: 'NaturePath Farms',
  score: 94,
  heroColors: ['#E8DCC4', '#C9986A'],
  nutriGrade: 'A',
  novaGroup: '1',
  ecoScore: 'A',
  ingredients:
    'Organic almonds (100%). No additives, preservatives, or oils.',
  allergens:
    'Tree nuts (almonds). Manufactured in a facility that processes peanuts.',
  certifications:
    'USDA Organic · Non-GMO Project Verified · ISO 17025 Lab-Tested',
};

const INFO_SECTIONS = [
  { title: 'Ingredients', key: 'ingredients' },
  { title: 'Allergens', key: 'allergens' },
  { title: 'Certifications', key: 'certifications' },
];

export default function ProductDetailScreen({ route, navigation }) {
  const product = route?.params?.product || SAMPLE_PRODUCT;
  const heroColors = product.heroColors || SAMPLE_PRODUCT.heroColors;
  const stats = [
    { label: 'Nutri', value: product.nutriGrade || 'A', bg: '#1E8449' },
    { label: 'NOVA', value: product.novaGroup || '1', bg: '#2D7A52' },
    { label: 'Eco', value: product.ecoScore || 'A', bg: '#1E8449' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Hero section */}
      <LinearGradient
        colors={heroColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroImagePlaceholder} />
        <Text style={styles.heroName}>{product.name}</Text>
        <Text style={styles.heroBrand}>{product.brand}</Text>
      </LinearGradient>

      {/* Score section */}
      <Card style={styles.scoreCard}>
        <View style={styles.scoreRow}>
          <ScoreBadge score={product.score || 94} size={64} />
          <View style={styles.scoreTextColumn}>
            <Text style={styles.scoreLabel}>CHOOSEPURE SCORE</Text>
            <Text style={styles.scoreDescription}>
              Excellent · Recommended
            </Text>
          </View>
          <Icon
            name="shield-check"
            size={24}
            color={theme.colors.scoreGood}
          />
        </View>
      </Card>

      {/* Quick stats */}
      <View style={styles.statsRow}>
        {stats.map((stat) => (
          <Card key={stat.label} style={styles.statCard}>
            <Text style={styles.statLabel}>{stat.label.toUpperCase()}</Text>
            <View
              style={[styles.statBadge, { backgroundColor: stat.bg }]}
            >
              <Text style={styles.statBadgeText}>{stat.value}</Text>
            </View>
          </Card>
        ))}
      </View>

      {/* Info sections */}
      {INFO_SECTIONS.map((section) => (
        <Card key={section.title} style={styles.infoCard}>
          <Text style={styles.infoLabel}>{section.title.toUpperCase()}</Text>
          <Text style={styles.infoBody}>
            {product[section.key] || SAMPLE_PRODUCT[section.key]}
          </Text>
        </Card>
      ))}

      {/* View Full Lab Report button */}
      <Button
        variant="primary"
        size="lg"
        fullWidth
        onPress={() =>
          navigation.navigate('LabReport', {
            productId: product.id || 'sample',
          })
        }
      >
        View Full Lab Report
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 32,
  },
  // Hero
  hero: {
    borderRadius: theme.borderRadius.xl,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  heroImagePlaceholder: {
    width: 132,
    height: 132,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 12,
  },
  heroName: {
    fontFamily: theme.fonts.display,
    fontSize: theme.fontSize['2xl'],
    color: '#FFFFFF',
    textAlign: 'center',
  },
  heroBrand: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.base,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  // Score
  scoreCard: {
    padding: 20,
    marginBottom: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  scoreTextColumn: {
    flex: 1,
  },
  scoreLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize['2xs'],
    color: theme.colors.textSecondary,
    letterSpacing: 4,
    marginBottom: 4,
  },
  scoreDescription: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize.base,
    color: theme.colors.scoreGood,
  },
  // Quick stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize['2xs'],
    color: theme.colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 6,
  },
  statBadge: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBadgeText: {
    fontFamily: theme.fonts.display,
    fontSize: theme.fontSize.lg,
    color: '#FFFFFF',
  },
  // Info sections
  infoCard: {
    padding: 16,
    marginBottom: 12,
  },
  infoLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize['2xs'],
    color: theme.colors.textSecondary,
    letterSpacing: 4,
    marginBottom: 6,
  },
  infoBody: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.text,
  },
});
