import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { theme } from '../theme';
import Card from '../components/Card';
import Icon from '../components/Icon';

const LEGAL_LINKS = [
  {
    icon: 'info',
    title: 'Terms & Conditions',
    subtitle: 'Usage terms for ChoosePure services',
    url: 'https://choosepure.in/terms-conditions.html',
  },
  {
    icon: 'shield-check',
    title: 'Privacy Policy',
    subtitle: 'How we collect and use your data',
    url: 'https://choosepure.in/privacy-policy.html',
  },
  {
    icon: 'star',
    title: 'Refund Policy',
    subtitle: 'Subscription cancellation and refunds',
    url: 'https://choosepure.in/refund-policy.html',
  },
];

export default function LegalScreen() {
  const handlePress = (url) => {
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        {LEGAL_LINKS.map((item, i) => {
          const isLast = i === LEGAL_LINKS.length - 1;
          return (
            <TouchableOpacity
              key={item.title}
              style={[styles.row, !isLast && styles.rowBorder]}
              activeOpacity={0.7}
              onPress={() => handlePress(item.url)}
            >
              <Icon name={item.icon} size={20} color={theme.colors.primary} />
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
              </View>
              <Icon name="arrow-right" size={16} color={theme.colors.textDim} />
            </TouchableOpacity>
          );
        })}
      </Card>

      <Text style={styles.footer}>
        These documents are hosted on choosepure.in and will open in your browser.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 20,
  },
  card: {
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSoft,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.base,
    color: theme.colors.text,
  },
  rowSubtitle: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  footer: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.xs,
    color: theme.colors.textDim,
    textAlign: 'center',
    marginTop: 16,
  },
});
