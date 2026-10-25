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

const PANELS = [
  {
    title: 'Heavy Metals Panel',
    items: [
      { name: 'Lead (Pb)', limit: 'Limit 0.1 ppm', value: '< 0.01 ppm' },
      { name: 'Cadmium (Cd)', limit: 'Limit 0.05 ppm', value: '< 0.005 ppm' },
      { name: 'Mercury (Hg)', limit: 'Limit 0.1 ppm', value: 'Not detected' },
      { name: 'Arsenic (As)', limit: 'Limit 0.2 ppm', value: '< 0.02 ppm' },
    ],
  },
  {
    title: 'Pesticide Screening',
    items: [
      { name: 'Glyphosate', limit: 'Limit 0.05 ppm', value: 'Not detected' },
      { name: 'Organophosphates', limit: 'Limit 0.01 ppm', value: '< 0.001 ppm' },
      { name: 'Pyrethroids', limit: 'Limit 0.02 ppm', value: 'Not detected' },
    ],
  },
  {
    title: 'Microbiological Testing',
    items: [
      { name: 'Total Plate Count', limit: 'Limit 10,000 CFU/g', value: '180 CFU/g' },
      { name: 'E. coli', limit: 'Not detected', value: 'Not detected' },
      { name: 'Salmonella', limit: 'Not detected', value: 'Not detected' },
    ],
  },
];

export default function LabReportScreen({ route }) {
  const productId = route?.params?.productId;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Product summary card */}
      <Card style={styles.productCard}>
        <View style={styles.productRow}>
          <LinearGradient
            colors={['#E8DCC4', '#C9A87C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.productImage}
          />
          <View style={styles.productInfo}>
            <Text style={styles.productName}>Organic Almond Butter</Text>
            <Text style={styles.productBrand}>NaturePath Farms</Text>
            <Text style={styles.productMeta}>
              LOT-AB-2024-0106 · Tested Jun 15, 2024
            </Text>
          </View>
        </View>
      </Card>

      {/* Score banner */}
      <LinearGradient
        colors={[theme.colors.primaryLight, theme.colors.primaryLighter]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.scoreBanner}
      >
        <View style={styles.checkCircle}>
          <Icon name="check" size={28} color={theme.colors.primaryLight} strokeWidth={3} />
        </View>
        <Text style={styles.scoreTitle}>Safety Score: 94/100</Text>
        <View style={styles.scoreSubRow}>
          <Icon name="shield-check" size={14} color="rgba(255,255,255,0.9)" />
          <Text style={styles.scoreSubText}>No contaminants detected</Text>
        </View>
      </LinearGradient>

      {/* Test panels */}
      {PANELS.map((panel, panelIdx) => (
        <View key={panelIdx} style={styles.panelContainer}>
          {/* Panel header */}
          <View style={styles.panelHeader}>
            <Icon name="flask" size={16} color={theme.colors.primaryLight} />
            <Text style={styles.panelTitle}>{panel.title}</Text>
          </View>
          {/* Panel body */}
          <Card style={styles.panelBody}>
            {panel.items.map((item, itemIdx) => (
              <View
                key={itemIdx}
                style={[
                  styles.panelRow,
                  itemIdx < panel.items.length - 1 && styles.panelRowBorder,
                ]}
              >
                <View style={styles.panelRowLeft}>
                  <Text style={styles.testName}>{item.name}</Text>
                  <Text style={styles.testLimit}>{item.limit}</Text>
                </View>
                <View style={styles.panelRowRight}>
                  <Text style={styles.testValue}>{item.value}</Text>
                  <View style={styles.passRow}>
                    <View style={styles.passDot} />
                    <Text style={styles.passText}>Pass</Text>
                  </View>
                </View>
              </View>
            ))}
          </Card>
        </View>
      ))}

      {/* Certified lab partner card */}
      <Card style={styles.certCard}>
        <View style={styles.certRow}>
          <View style={styles.certIconBox}>
            <Icon
              name="check-circle"
              size={20}
              color={theme.colors.primaryLight}
            />
          </View>
          <View style={styles.certInfo}>
            <Text style={styles.certName}>Certified Lab Partner</Text>
            <Text style={styles.certAccreditation}>
              ISO 17025 Accredited
            </Text>
            <Text style={styles.certMeta}>
              PurityTest Laboratories · Test ID PT-2024-AB-0106
            </Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  // Product summary
  productCard: {
    padding: 14,
    marginBottom: 14,
  },
  productRow: {
    flexDirection: 'row',
    gap: 12,
  },
  productImage: {
    width: 76,
    height: 76,
    borderRadius: theme.borderRadius.md,
    flexShrink: 0,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.fontSize.base,
    color: theme.colors.text,
    marginBottom: 4,
  },
  productBrand: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  productMeta: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize['2xs'],
    color: theme.colors.textDim,
  },
  // Score banner
  scoreBanner: {
    borderRadius: theme.borderRadius.xl,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  checkCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  scoreTitle: {
    fontFamily: theme.fonts.display,
    fontSize: theme.fontSize['2xl'],
    color: '#FFFFFF',
    marginBottom: 6,
  },
  scoreSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreSubText: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize.sm,
    color: 'rgba(255,255,255,0.9)',
  },
  // Test panels
  panelContainer: {
    marginBottom: 12,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: theme.colors.green50,
    borderTopLeftRadius: theme.borderRadius.md,
    borderTopRightRadius: theme.borderRadius.md,
  },
  panelTitle: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.base,
    color: theme.colors.text,
  },
  panelBody: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    overflow: 'hidden',
  },
  panelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  panelRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSoft,
  },
  panelRowLeft: {
    flex: 1,
  },
  testName: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  testLimit: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize['2xs'],
    color: theme.colors.textDim,
    marginTop: 2,
  },
  panelRowRight: {
    alignItems: 'flex-end',
  },
  testValue: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.sm,
    color: theme.colors.primaryLight,
  },
  passRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  passDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primaryLight,
  },
  passText: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize['2xs'],
    color: theme.colors.primaryLight,
  },
  // Cert card
  certCard: {
    padding: 14,
  },
  certRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  certIconBox: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.green100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certInfo: {
    flex: 1,
  },
  certName: {
    fontFamily: theme.fonts.semiBold,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  certAccreditation: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    marginTop: 2,
  },
  certMeta: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.fontSize['2xs'],
    color: theme.colors.textDim,
    marginTop: 2,
  },
});
