import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme';
import { trackEvent } from '../services/analytics';

const { width } = Dimensions.get('window');

const ONBOARDING_SLIDES = [
  {
    id: '1',
    emoji: '🔬',
    title: 'Lab-Tested Transparency',
    description: 'We independently test everyday packaged foods in FSSAI-accredited labs — so you know exactly what your family is eating.',
  },
  {
    id: '2',
    emoji: '📊',
    title: 'Purity Scores You Can Trust',
    description: 'Every product gets a score from 0–100 based on real lab data — pesticides, antibiotics, heavy metals, and more.',
  },
  {
    id: '3',
    emoji: '🗳️',
    title: 'You Decide What Gets Tested',
    description: 'Vote for the products you want tested next. The community decides — and we deliver the results.',
  },
  {
    id: '4',
    emoji: '📱',
    title: 'Scan. Compare. Choose Pure.',
    description: 'Scan any product barcode to instantly check its safety profile. Make informed choices at the store shelf.',
  },
];

export default function OnboardingScreen({ onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const hasTrackedStart = useRef(false);

  // Track onboarding started on mount
  React.useEffect(() => {
    if (!hasTrackedStart.current) {
      hasTrackedStart.current = true;
      trackEvent('onboarding_started');
    }
  }, []);

  const handleNext = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    try {
      trackEvent('onboarding_skipped', { slide_index: currentIndex });
    } catch (e) {
      // Analytics failure should not block navigation
    }
    handleFinish();
  };

  const handleFinish = async () => {
    try {
      trackEvent('onboarding_completed', { slide_count: ONBOARDING_SLIDES.length });
    } catch (e) {
      // Analytics failure should not block navigation
    }
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true');
    } catch (e) {
      // Storage failure should not block navigation
    }
    onComplete();
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderSlide = ({ item }) => (
    <View style={styles.slide}>
      <Text style={styles.emoji}>{item.emoji}</Text>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  const isLastSlide = currentIndex === ONBOARDING_SLIDES.length - 1;

  return (
    <View style={styles.container}>
      {/* Skip button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.7}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <View style={{ flex: 1 }}>
        <FlatList
          ref={flatListRef}
          data={ONBOARDING_SLIDES}
          renderItem={renderSlide}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
        />
      </View>

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        {/* Pagination dots */}
        <View style={styles.pagination}>
          {ONBOARDING_SLIDES.map((_, index) => {
            const inputRange = [
              (index - 1) * width,
              index * width,
              (index + 1) * width,
            ];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  { width: dotWidth, opacity },
                ]}
              />
            );
          })}
        </View>

        {/* Next / Get Started button */}
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>
            {isLastSlide ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  skipButton: {
    position: 'absolute',
    top: 56,
    right: 24,
    zIndex: 100,
    padding: 12,
  },
  skipText: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSize.base,
    color: theme.colors.textSecondary,
  },
  slide: {
    width,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
    paddingBottom: 40,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 32,
  },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize['2xl'],
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  description: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  nextButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: theme.borderRadius.lg,
    width: '100%',
    alignItems: 'center',
  },
  nextButtonText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.md,
    color: '#FFFFFF',
  },
});
