import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Welcome to ChoosePure',
    description: 'We are an independent food purity testing platform helping parents make informed choices about the food they buy.',
  },
  {
    id: '2',
    title: 'Lab-Tested Results',
    description: 'Every product is tested in accredited labs. We publish transparent purity scores so you know exactly what you are consuming.',
  },
  {
    id: '3',
    title: 'Join the Community',
    description: 'Vote for products you want tested, suggest new ones, and help build a movement for food transparency in India.',
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
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>ChoosePure</Text>
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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

      <View style={styles.pagination}>
        {slides.map((_, i) => (
          <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={completeOnboarding} accessibilityRole="button" accessibilityLabel="Skip onboarding">
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          accessibilityRole="button"
          accessibilityLabel={isLastSlide ? 'Get Started' : 'Next'}
          onPress={() => {
            if (isLastSlide) {
              completeOnboarding();
            } else {
              flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
            }
          }}
        >
          <Text style={styles.buttonText}>{isLastSlide ? 'Get Started' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  slide: { width, alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.spacing.xl },
  logoContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: theme.spacing.lg },
  logoText: { fontFamily: theme.fonts.bold, fontSize: 16, color: '#FFFFFF' },
  title: { fontFamily: theme.fonts.bold, fontSize: 24, color: theme.colors.text, textAlign: 'center', marginBottom: theme.spacing.md },
  description: { fontFamily: theme.fonts.regular, fontSize: 15, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  pagination: { flexDirection: 'row', justifyContent: 'center', marginBottom: theme.spacing.md },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.border, marginHorizontal: 4 },
  dotActive: { backgroundColor: theme.colors.primary, width: 24 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: theme.spacing.xl, paddingBottom: theme.spacing.xl },
  skipText: { fontFamily: theme.fonts.medium, fontSize: 15, color: theme.colors.textSecondary },
  button: { backgroundColor: theme.colors.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: theme.borderRadius.sm },
  buttonText: { fontFamily: theme.fonts.semiBold, fontSize: 15, color: '#FFFFFF' },
});
