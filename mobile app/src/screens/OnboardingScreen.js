import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme';
import Button from '../components/Button';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Is it really clean?',
    description: 'Discover products free from harmful additives, pesticides, and contaminants.',
  },
  {
    id: '2',
    title: 'Is it nutritious?',
    description: 'Every product is scored on calories, sugars, sodium, and key micronutrients.',
  },
  {
    id: '3',
    title: 'Is it actually pure?',
    description: 'Make confident decisions with transparent safety scores you can rely on.',
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  useEffect(() => {
    checkOnboarding();
  }, []);

  async function checkOnboarding() {
    const done = await AsyncStorage.getItem('onboarding_done');
    if (done === 'true') {
      navigation.replace('Login');
    }
  }

  async function completeOnboarding() {
    await AsyncStorage.setItem('onboarding_done', 'true');
    navigation.replace('Login');
  }

  function onViewableItemsChanged({ viewableItems }) {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;
  const onViewRef = useRef(onViewableItemsChanged).current;

  const isLastSlide = currentIndex === slides.length - 1;

  function renderSlide({ item }) {
    return (
      <View style={styles.slide}>
        {/* Logo circle */}
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>ChoosePure</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{item.title}</Text>

        {/* Description */}
        <Text style={styles.description}>{item.description}</Text>

        {/* Dot indicators */}
        <View style={styles.dotsContainer}>
          {slides.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                idx === currentIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Skip button in top-right corner */}
      <View style={styles.skipRow}>
        <TouchableOpacity
          onPress={completeOnboarding}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewRef}
        viewabilityConfig={viewabilityConfig}
      />

      {/* Bottom button */}
      <View style={styles.footer}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => {
            if (isLastSlide) {
              completeOnboarding();
            } else {
              flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
            }
          }}
        >
          {isLastSlide ? 'Get Started' : 'Continue'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.green50, // #EDF3EE
  },
  skipRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: theme.spacing.lg, // 24
    paddingTop: 12,
  },
  skipText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.sm, // 13
    color: theme.colors.textSecondary, // #6B7268
  },
  slide: {
    width,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl, // 32
    paddingTop: 40,
  },
  logoCircle: {
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: theme.colors.green100, // #D4E3D8
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
  },
  logoText: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize.lg, // 17
    color: theme.colors.text, // #1A201A
  },
  title: {
    fontFamily: theme.fonts.display, // Inter_700Bold
    fontSize: theme.fontSize['3xl'], // 26
    color: theme.colors.text, // #1A201A
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.md, // 15
    color: theme.colors.textSecondary, // #6B7268
    textAlign: 'center',
    lineHeight: theme.lineHeight.md, // 22.5
    maxWidth: 280,
    marginBottom: theme.spacing.xl, // 32
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm, // 8
    marginBottom: 40,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: theme.colors.primaryLight, // #2D7A52 (green-700)
  },
  dotInactive: {
    width: 8,
    backgroundColor: theme.colors.green100, // #D4E3D8
  },
  footer: {
    paddingHorizontal: theme.spacing.lg, // 24
    paddingBottom: theme.spacing.xl, // 32
  },
});
