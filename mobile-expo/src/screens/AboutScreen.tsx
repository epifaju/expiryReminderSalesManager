import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

interface AboutScreenProps {
  onBack: () => void;
}

const AboutScreen: React.FC<AboutScreenProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const openWebsite = () => {
    Linking.openURL('https://salesmanager.com');
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://salesmanager.com/privacy');
  };

  const openTerms = () => {
    Linking.openURL('https://salesmanager.com/terms');
  };

  const openLicense = () => {
    Linking.openURL('https://salesmanager.com/license');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.headerBackground }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={[styles.backButtonText, { color: theme.colors.headerText }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.headerText }]}>ℹ️ {t('settings.about')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Logo & App Name */}
        <View style={styles.logoSection}>
          <View style={[styles.logoCircle, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.logoText}>🛍️</Text>
          </View>
          <Text style={[styles.appName, { color: theme.colors.text }]}>{t('app.name')}</Text>
          <Text style={[styles.appTagline, { color: theme.colors.textSecondary }]}>{t('about.tagline')}</Text>
          <View style={[styles.versionBadge, { backgroundColor: theme.isDark ? theme.colors.card : '#e3f2fd' }]}>
            <Text style={[styles.versionText, { color: theme.colors.primary }]}>Version 1.0.0</Text>
          </View>
        </View>

        {/* Description */}
        <View style={[styles.descriptionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.descriptionTitle, { color: theme.colors.text }]}>{t('about.description')}</Text>
          <Text style={[styles.descriptionText, { color: theme.colors.textSecondary }]}>
            {t('about.descriptionText')}
          </Text>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('about.features')}</Text>

          <View style={[styles.featureItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={styles.featureIcon}>📦</Text>
            <View style={styles.featureInfo}>
              <Text style={[styles.featureTitle, { color: theme.colors.text }]}>{t('about.feature1Title')}</Text>
              <Text style={[styles.featureDescription, { color: theme.colors.textSecondary }]}>
                {t('about.feature1Description')}
              </Text>
            </View>
          </View>

          <View style={[styles.featureItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={styles.featureIcon}>🛒</Text>
            <View style={styles.featureInfo}>
              <Text style={[styles.featureTitle, { color: theme.colors.text }]}>{t('about.feature2Title')}</Text>
              <Text style={[styles.featureDescription, { color: theme.colors.textSecondary }]}>
                {t('about.feature2Description')}
              </Text>
            </View>
          </View>

          <View style={[styles.featureItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={styles.featureIcon}>📊</Text>
            <View style={styles.featureInfo}>
              <Text style={[styles.featureTitle, { color: theme.colors.text }]}>{t('about.feature3Title')}</Text>
              <Text style={[styles.featureDescription, { color: theme.colors.textSecondary }]}>
                {t('about.feature3Description')}
              </Text>
            </View>
          </View>

          <View style={[styles.featureItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={styles.featureIcon}>⚠️</Text>
            <View style={styles.featureInfo}>
              <Text style={[styles.featureTitle, { color: theme.colors.text }]}>{t('about.feature4Title')}</Text>
              <Text style={[styles.featureDescription, { color: theme.colors.textSecondary }]}>
                {t('about.feature4Description')}
              </Text>
            </View>
          </View>

          <View style={[styles.featureItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={styles.featureIcon}>🌐</Text>
            <View style={styles.featureInfo}>
              <Text style={[styles.featureTitle, { color: theme.colors.text }]}>{t('about.feature5Title')}</Text>
              <Text style={[styles.featureDescription, { color: theme.colors.textSecondary }]}>
                {t('about.feature5Description')}
              </Text>
            </View>
          </View>
        </View>

        {/* Tech Stack */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('about.technology')}</Text>

          <View style={[styles.techCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.techRow}>
              <Text style={[styles.techLabel, { color: theme.colors.textSecondary }]}>{t('about.frontend')}:</Text>
              <Text style={[styles.techValue, { color: theme.colors.text }]}>React Native + Expo</Text>
            </View>
            <View style={styles.techRow}>
              <Text style={[styles.techLabel, { color: theme.colors.textSecondary }]}>{t('about.backend')}:</Text>
              <Text style={[styles.techValue, { color: theme.colors.text }]}>Spring Boot + PostgreSQL</Text>
            </View>
            <View style={styles.techRow}>
              <Text style={[styles.techLabel, { color: theme.colors.textSecondary }]}>{t('about.language')}:</Text>
              <Text style={[styles.techValue, { color: theme.colors.text }]}>TypeScript + Java</Text>
            </View>
          </View>
        </View>

        {/* Legal Links */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('about.legal')}</Text>

          <TouchableOpacity
            style={[styles.legalLink, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={openPrivacyPolicy}
          >
            <Text style={[styles.legalText, { color: theme.colors.text }]}>{t('about.privacyPolicy')}</Text>
            <Text style={[styles.legalArrow, { color: theme.colors.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.legalLink, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={openTerms}
          >
            <Text style={[styles.legalText, { color: theme.colors.text }]}>{t('about.termsOfService')}</Text>
            <Text style={[styles.legalArrow, { color: theme.colors.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.legalLink, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={openLicense}
          >
            <Text style={[styles.legalText, { color: theme.colors.text }]}>{t('about.license')}</Text>
            <Text style={[styles.legalArrow, { color: theme.colors.textSecondary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Credits */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('about.credits')}</Text>

          <View style={[styles.creditsCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.creditsText, { color: theme.colors.textSecondary }]}>
              {t('about.developedBy')}
            </Text>
            <Text style={[styles.creditsTeam, { color: theme.colors.primary }]}>Sales Manager Team</Text>
            <Text style={[styles.creditsYear, { color: theme.colors.textSecondary }]}>© 2025</Text>
          </View>
        </View>

        {/* Website Link */}
        <TouchableOpacity
          style={[styles.websiteButton, { backgroundColor: theme.colors.primary }]}
          onPress={openWebsite}
        >
          <Text style={styles.websiteButtonText}>🌐 {t('about.visitWebsite')}</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            {t('about.madeWithLove')}
          </Text>
        </View>

        {/* Extra space at bottom */}
        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  logoText: {
    fontSize: 48,
  },
  appName: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  appTagline: {
    fontSize: 15,
    marginBottom: 15,
    textAlign: 'center',
  },
  versionBadge: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  versionText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  descriptionCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 25,
    borderWidth: 1,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  featureItem: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  featureIcon: {
    fontSize: 28,
    marginRight: 15,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  techCard: {
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
  },
  techRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  techLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  techValue: {
    fontSize: 14,
  },
  legalLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  legalText: {
    fontSize: 15,
  },
  legalArrow: {
    fontSize: 20,
  },
  creditsCard: {
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  creditsText: {
    fontSize: 14,
    marginBottom: 8,
  },
  creditsTeam: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  creditsYear: {
    fontSize: 14,
  },
  websiteButton: {
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  websiteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
});

export default AboutScreen;

