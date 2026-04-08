import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

export default function VisionScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Mission */}
      <Text style={styles.heading}>Our Mission</Text>
      <Text style={styles.body}>
        ChoosePure is India's first independent food purity testing platform built for parents who
        care about what goes into their family's food. We believe every family deserves access to
        transparent, unbiased purity data — not marketing claims.
      </Text>
      <Text style={styles.body}>
        We independently test everyday food products — milk, ghee, honey, spices, and more — at
        accredited laboratories and publish the results for everyone to see. No brand sponsorships.
        No hidden agendas. Just pure truth.
      </Text>

      {/* Team */}
      <Text style={styles.heading}>Our Team</Text>

      <View style={styles.teamCard}>
        <Text style={styles.teamName}>Dr. Aman Mann</Text>
        <Text style={styles.teamRole}>Co-Founder</Text>
        <Text style={styles.teamBio}>
          A physician and parent driven by the belief that food transparency is a fundamental right.
          Dr. Aman leads ChoosePure's testing methodology and ensures every report meets the highest
          scientific standards.
        </Text>
      </View>

      <View style={styles.teamCard}>
        <Text style={styles.teamName}>Kriti</Text>
        <Text style={styles.teamRole}>Co-Founder</Text>
        <Text style={styles.teamBio}>
          With a passion for community health and consumer advocacy, Kriti drives ChoosePure's
          mission to empower families with actionable purity insights. She leads product strategy
          and community engagement.
        </Text>
      </View>

      {/* Values */}
      <Text style={styles.heading}>Our Values</Text>

      <View style={styles.valueRow}>
        <Text style={styles.valueIcon}>🔬</Text>
        <View style={styles.valueBody}>
          <Text style={styles.valueTitle}>Scientific Integrity</Text>
          <Text style={styles.valueDesc}>Every test is conducted at accredited labs with rigorous methodology.</Text>
        </View>
      </View>

      <View style={styles.valueRow}>
        <Text style={styles.valueIcon}>🤝</Text>
        <View style={styles.valueBody}>
          <Text style={styles.valueTitle}>Independence</Text>
          <Text style={styles.valueDesc}>We are not funded by any food brand. Our loyalty is to families, not corporations.</Text>
        </View>
      </View>

      <View style={styles.valueRow}>
        <Text style={styles.valueIcon}>🌿</Text>
        <View style={styles.valueBody}>
          <Text style={styles.valueTitle}>Transparency</Text>
          <Text style={styles.valueDesc}>Full test reports, methodology, and scores — nothing hidden, everything open.</Text>
        </View>
      </View>

      <View style={styles.valueRow}>
        <Text style={styles.valueIcon}>👨‍👩‍👧‍👦</Text>
        <View style={styles.valueBody}>
          <Text style={styles.valueTitle}>Community First</Text>
          <Text style={styles.valueDesc}>You decide which products we test next through polling and suggestions.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xl * 2 },
  heading: {
    fontFamily: theme.fonts.bold, fontSize: 20, color: theme.colors.primary,
    marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm,
  },
  body: {
    fontFamily: theme.fonts.regular, fontSize: 15, color: theme.colors.text,
    lineHeight: 24, marginBottom: theme.spacing.sm,
  },
  teamCard: {
    backgroundColor: theme.colors.cardBackground, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, marginBottom: theme.spacing.sm,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2,
  },
  teamName: { fontFamily: theme.fonts.semiBold, fontSize: 17, color: theme.colors.text },
  teamRole: { fontFamily: theme.fonts.medium, fontSize: 13, color: theme.colors.accent, marginTop: 2 },
  teamBio: { fontFamily: theme.fonts.regular, fontSize: 14, color: theme.colors.textSecondary, marginTop: theme.spacing.sm, lineHeight: 21 },
  valueRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  valueIcon: { fontSize: 24, marginRight: theme.spacing.sm, marginTop: 2 },
  valueBody: { flex: 1 },
  valueTitle: { fontFamily: theme.fonts.semiBold, fontSize: 15, color: theme.colors.text },
  valueDesc: { fontFamily: theme.fonts.regular, fontSize: 13, color: theme.colors.textSecondary, marginTop: 2, lineHeight: 20 },
});
