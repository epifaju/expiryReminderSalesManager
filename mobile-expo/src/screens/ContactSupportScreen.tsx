import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import authService from '../services/authService';

interface ContactSupportScreenProps {
  onBack: () => void;
}

type SupportCategory = 'technical' | 'billing' | 'feature' | 'other';

const ContactSupportScreen: React.FC<ContactSupportScreenProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SupportCategory>('technical');
  const [isLoading, setIsLoading] = useState(false);

  const user = authService.getUser();

  const categories: { key: SupportCategory; icon: string; label: string }[] = [
    { key: 'technical', icon: '🔧', label: t('support.technical') },
    { key: 'billing', icon: '💳', label: t('support.billing') },
    { key: 'feature', icon: '✨', label: t('support.feature') },
    { key: 'other', icon: '💬', label: t('support.other') },
  ];

  const validateForm = (): string | null => {
    if (!subject.trim()) {
      return t('support.subjectRequired');
    }
    if (subject.trim().length < 5) {
      return t('support.subjectTooShort');
    }
    if (!message.trim()) {
      return t('support.messageRequired');
    }
    if (message.trim().length < 20) {
      return t('support.messageTooShort');
    }
    return null;
  };

  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      Alert.alert(t('common.error'), error);
      return;
    }

    setIsLoading(true);
    try {
      // Simuler l'envoi du message de support
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Dans une vraie app, vous enverriez ceci à votre backend:
      // const response = await axios.post('/support/ticket', {
      //   userId: user?.id,
      //   username: user?.username,
      //   email: user?.email,
      //   category: selectedCategory,
      //   subject,
      //   message,
      // });

      console.log('✅ Message de support envoyé:', {
        category: selectedCategory,
        subject,
        message: message.substring(0, 50) + '...',
      });

      // Succès
      Alert.alert(
        t('common.success'),
        t('support.messageSent'),
        [
          {
            text: t('common.ok'),
            onPress: () => {
              setSubject('');
              setMessage('');
              setSelectedCategory('technical');
              onBack();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Erreur envoi message support:', error);
      Alert.alert(t('common.error'), error.message || t('support.sendError'));
    } finally {
      setIsLoading(false);
    }
  };

  const openEmail = () => {
    const emailSubject = encodeURIComponent(subject || 'Support Sales Manager');
    const emailBody = encodeURIComponent(
      `${message}\n\n---\nUtilisateur: ${user?.username || 'Non connecté'}\nEmail: ${user?.email || 'N/A'}\nCatégorie: ${selectedCategory}`
    );
    Linking.openURL(`mailto:support@salesmanager.com?subject=${emailSubject}&body=${emailBody}`);
  };

  const openPhone = () => {
    Linking.openURL('tel:+1234567890');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.headerBackground }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={[styles.backButtonText, { color: theme.colors.headerText }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.headerText }]}>📧 {t('settings.contactSupport')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: theme.isDark ? theme.colors.card : '#e3f2fd' }]}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={[styles.infoText, { color: theme.isDark ? theme.colors.text : '#1976d2' }]}>
            {t('support.description')}
          </Text>
        </View>

        {/* User Info */}
        {user && (
          <View style={[styles.userCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.userLabel, { color: theme.colors.textSecondary }]}>{t('support.contactingAs')}</Text>
            <Text style={[styles.userName, { color: theme.colors.text }]}>{user.username}</Text>
            <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>{user.email}</Text>
          </View>
        )}

        {/* Formulaire */}
        <View style={styles.formSection}>
          {/* Catégorie */}
          <Text style={[styles.label, { color: theme.colors.text }]}>{t('support.category')}</Text>
          <View style={styles.categoriesContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.categoryButton,
                  { 
                    backgroundColor: theme.colors.card, 
                    borderColor: selectedCategory === cat.key ? theme.colors.primary : theme.colors.border 
                  },
                  selectedCategory === cat.key && { backgroundColor: theme.isDark ? '#3a3a5a' : '#f0f4ff' },
                ]}
                onPress={() => setSelectedCategory(cat.key)}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={[
                  styles.categoryLabel,
                  { color: selectedCategory === cat.key ? theme.colors.primary : theme.colors.textSecondary }
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sujet */}
          <Text style={[styles.label, { color: theme.colors.text }]}>{t('support.subject')}</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.colors.card, 
              borderColor: theme.colors.border,
              color: theme.colors.text 
            }]}
            placeholder={t('support.subjectPlaceholder')}
            placeholderTextColor={theme.colors.textSecondary}
            value={subject}
            onChangeText={setSubject}
            maxLength={100}
          />
          <Text style={[styles.charCount, { color: theme.colors.textSecondary }]}>
            {subject.length}/100
          </Text>

          {/* Message */}
          <Text style={[styles.label, { color: theme.colors.text }]}>{t('support.message')}</Text>
          <TextInput
            style={[styles.textArea, { 
              backgroundColor: theme.colors.card, 
              borderColor: theme.colors.border,
              color: theme.colors.text 
            }]}
            placeholder={t('support.messagePlaceholder')}
            placeholderTextColor={theme.colors.textSecondary}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, { color: theme.colors.textSecondary }]}>
            {message.length}/500
          </Text>
        </View>

        {/* Boutons d'action */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>📤 {t('support.send')}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Autres moyens de contact */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('support.otherMethods')}</Text>

          <TouchableOpacity
            style={[styles.contactMethodCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={openEmail}
          >
            <Text style={styles.methodIcon}>📧</Text>
            <View style={styles.methodInfo}>
              <Text style={[styles.methodTitle, { color: theme.colors.text }]}>{t('support.emailDirect')}</Text>
              <Text style={[styles.methodSubtitle, { color: theme.colors.primary }]}>support@salesmanager.com</Text>
            </View>
            <Text style={[styles.methodArrow, { color: theme.colors.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.contactMethodCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={openPhone}
          >
            <Text style={styles.methodIcon}>📞</Text>
            <View style={styles.methodInfo}>
              <Text style={[styles.methodTitle, { color: theme.colors.text }]}>{t('support.phone')}</Text>
              <Text style={[styles.methodSubtitle, { color: theme.colors.primary }]}>+1 (234) 567-890</Text>
            </View>
            <Text style={[styles.methodArrow, { color: theme.colors.textSecondary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Heures d'ouverture */}
        <View style={[styles.hoursCard, { backgroundColor: theme.isDark ? theme.colors.card : '#f0f9ff', borderColor: theme.colors.border }]}>
          <Text style={[styles.hoursTitle, { color: theme.colors.text }]}>🕒 {t('support.businessHours')}</Text>
          <Text style={[styles.hoursText, { color: theme.colors.textSecondary }]}>
            {t('support.hours')}
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
  infoCard: {
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  userCard: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 25,
    borderWidth: 1,
  },
  userLabel: {
    fontSize: 12,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  userEmail: {
    fontSize: 14,
  },
  formSection: {
    marginBottom: 25,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 15,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    minHeight: 150,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 5,
  },
  actionButtons: {
    marginBottom: 25,
  },
  submitButton: {
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
  contactMethodCard: {
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
  methodIcon: {
    fontSize: 28,
    marginRight: 15,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  methodSubtitle: {
    fontSize: 14,
  },
  methodArrow: {
    fontSize: 24,
  },
  hoursCard: {
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
  },
  hoursTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  hoursText: {
    fontSize: 14,
    lineHeight: 22,
  },
});

export default ContactSupportScreen;

