import React, { useState } from 'react';
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

interface HelpScreenProps {
  onBack: () => void;
}

const HelpScreen: React.FC<HelpScreenProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const openEmail = () => {
    Linking.openURL('mailto:support@salesmanager.com');
  };

  const openWebsite = () => {
    Linking.openURL('https://salesmanager.com/help');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.headerBackground }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={[styles.backButtonText, { color: theme.colors.headerText }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.headerText }]}>❓ {t('settings.help')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Bienvenue */}
        <View style={[styles.welcomeCard, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.welcomeTitle}>👋 {t('help.welcome')}</Text>
          <Text style={styles.welcomeText}>{t('help.welcomeMessage')}</Text>
        </View>

        {/* Guides rapides */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('help.quickGuides')}</Text>

          <TouchableOpacity
            style={[styles.guideCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={() => toggleSection('products')}
          >
            <View style={styles.guideHeader}>
              <Text style={styles.guideIcon}>📦</Text>
              <Text style={[styles.guideTitle, { color: theme.colors.text }]}>{t('help.manageProducts')}</Text>
              <Text style={[styles.expandIcon, { color: theme.colors.textSecondary }]}>
                {expandedSection === 'products' ? '▼' : '▶'}
              </Text>
            </View>
            {expandedSection === 'products' && (
              <View style={styles.guideContent}>
                <Text style={[styles.guideStep, { color: theme.colors.textSecondary }]}>
                  1. {t('help.step1Products')}
                </Text>
                <Text style={[styles.guideStep, { color: theme.colors.textSecondary }]}>
                  2. {t('help.step2Products')}
                </Text>
                <Text style={[styles.guideStep, { color: theme.colors.textSecondary }]}>
                  3. {t('help.step3Products')}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.guideCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={() => toggleSection('sales')}
          >
            <View style={styles.guideHeader}>
              <Text style={styles.guideIcon}>🛒</Text>
              <Text style={[styles.guideTitle, { color: theme.colors.text }]}>{t('help.createSale')}</Text>
              <Text style={[styles.expandIcon, { color: theme.colors.textSecondary }]}>
                {expandedSection === 'sales' ? '▼' : '▶'}
              </Text>
            </View>
            {expandedSection === 'sales' && (
              <View style={styles.guideContent}>
                <Text style={[styles.guideStep, { color: theme.colors.textSecondary }]}>
                  1. {t('help.step1Sales')}
                </Text>
                <Text style={[styles.guideStep, { color: theme.colors.textSecondary }]}>
                  2. {t('help.step2Sales')}
                </Text>
                <Text style={[styles.guideStep, { color: theme.colors.textSecondary }]}>
                  3. {t('help.step3Sales')}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.guideCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={() => toggleSection('receipts')}
          >
            <View style={styles.guideHeader}>
              <Text style={styles.guideIcon}>🧾</Text>
              <Text style={[styles.guideTitle, { color: theme.colors.text }]}>{t('help.generateReceipt')}</Text>
              <Text style={[styles.expandIcon, { color: theme.colors.textSecondary }]}>
                {expandedSection === 'receipts' ? '▼' : '▶'}
              </Text>
            </View>
            {expandedSection === 'receipts' && (
              <View style={styles.guideContent}>
                <Text style={[styles.guideStep, { color: theme.colors.textSecondary }]}>
                  1. {t('help.step1Receipts')}
                </Text>
                <Text style={[styles.guideStep, { color: theme.colors.textSecondary }]}>
                  2. {t('help.step2Receipts')}
                </Text>
                <Text style={[styles.guideStep, { color: theme.colors.textSecondary }]}>
                  3. {t('help.step3Receipts')}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('help.faq')}</Text>

          <TouchableOpacity
            style={[styles.faqCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={() => toggleSection('faq1')}
          >
            <View style={styles.faqHeader}>
              <Text style={[styles.faqQuestion, { color: theme.colors.text }]}>{t('help.faq1Question')}</Text>
              <Text style={[styles.expandIcon, { color: theme.colors.textSecondary }]}>
                {expandedSection === 'faq1' ? '▼' : '▶'}
              </Text>
            </View>
            {expandedSection === 'faq1' && (
              <Text style={[styles.faqAnswer, { color: theme.colors.textSecondary }]}>
                {t('help.faq1Answer')}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.faqCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={() => toggleSection('faq2')}
          >
            <View style={styles.faqHeader}>
              <Text style={[styles.faqQuestion, { color: theme.colors.text }]}>{t('help.faq2Question')}</Text>
              <Text style={[styles.expandIcon, { color: theme.colors.textSecondary }]}>
                {expandedSection === 'faq2' ? '▼' : '▶'}
              </Text>
            </View>
            {expandedSection === 'faq2' && (
              <Text style={[styles.faqAnswer, { color: theme.colors.textSecondary }]}>
                {t('help.faq2Answer')}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.faqCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={() => toggleSection('faq3')}
          >
            <View style={styles.faqHeader}>
              <Text style={[styles.faqQuestion, { color: theme.colors.text }]}>{t('help.faq3Question')}</Text>
              <Text style={[styles.expandIcon, { color: theme.colors.textSecondary }]}>
                {expandedSection === 'faq3' ? '▼' : '▶'}
              </Text>
            </View>
            {expandedSection === 'faq3' && (
              <Text style={[styles.faqAnswer, { color: theme.colors.textSecondary }]}>
                {t('help.faq3Answer')}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.faqCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={() => toggleSection('faq4')}
          >
            <View style={styles.faqHeader}>
              <Text style={[styles.faqQuestion, { color: theme.colors.text }]}>{t('help.faq4Question')}</Text>
              <Text style={[styles.expandIcon, { color: theme.colors.textSecondary }]}>
                {expandedSection === 'faq4' ? '▼' : '▶'}
              </Text>
            </View>
            {expandedSection === 'faq4' && (
              <Text style={[styles.faqAnswer, { color: theme.colors.textSecondary }]}>
                {t('help.faq4Answer')}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('help.needMoreHelp')}</Text>

          <TouchableOpacity
            style={[styles.contactCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={openEmail}
          >
            <Text style={styles.contactIcon}>📧</Text>
            <View style={styles.contactInfo}>
              <Text style={[styles.contactTitle, { color: theme.colors.text }]}>{t('help.emailSupport')}</Text>
              <Text style={[styles.contactSubtitle, { color: theme.colors.primary }]}>support@salesmanager.com</Text>
            </View>
            <Text style={[styles.contactArrow, { color: theme.colors.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.contactCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={openWebsite}
          >
            <Text style={styles.contactIcon}>🌐</Text>
            <View style={styles.contactInfo}>
              <Text style={[styles.contactTitle, { color: theme.colors.text }]}>{t('help.helpCenter')}</Text>
              <Text style={[styles.contactSubtitle, { color: theme.colors.primary }]}>salesmanager.com/help</Text>
            </View>
            <Text style={[styles.contactArrow, { color: theme.colors.textSecondary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Version Info */}
        <View style={styles.versionInfo}>
          <Text style={[styles.versionText, { color: theme.colors.textSecondary }]}>
            {t('app.name')} - Version 1.0.0
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
  welcomeCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 25,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 15,
    color: 'white',
    lineHeight: 22,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  guideCard: {
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  guideIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  guideTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  expandIcon: {
    fontSize: 14,
  },
  guideContent: {
    paddingHorizontal: 15,
    paddingBottom: 15,
    paddingTop: 5,
  },
  guideStep: {
    fontSize: 14,
    lineHeight: 24,
    marginBottom: 8,
  },
  faqCard: {
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  faqAnswer: {
    paddingHorizontal: 15,
    paddingBottom: 15,
    fontSize: 14,
    lineHeight: 22,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  contactIcon: {
    fontSize: 28,
    marginRight: 15,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: 14,
  },
  contactArrow: {
    fontSize: 24,
  },
  versionInfo: {
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
  },
  versionText: {
    fontSize: 12,
  },
});

export default HelpScreen;

