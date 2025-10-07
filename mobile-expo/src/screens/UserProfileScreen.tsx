import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import authService, { User } from '../services/authService';

interface UserProfileScreenProps {
  onBack: () => void;
}

const UserProfileScreen: React.FC<UserProfileScreenProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedEmail, setEditedEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = () => {
    console.log('📋 Chargement des données utilisateur...');
    const currentUser = authService.getUser();
    console.log('👤 Utilisateur récupéré:', currentUser);
    
    if (currentUser) {
      setUser(currentUser);
      setEditedEmail(currentUser.email);
      setIsLoading(false);
    } else {
      // Vérifier si l'utilisateur est authentifié
      const isAuth = authService.isAuthenticated();
      console.log('🔐 Authentifié:', isAuth);
      
      // Si pas d'utilisateur mais authentifié, il y a un problème
      if (isAuth) {
        console.warn('⚠️ Utilisateur authentifié mais pas de données disponibles');
      }
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editedEmail)) {
      Alert.alert(t('common.error'), t('validation.invalidEmail'));
      return;
    }

    setIsLoading(true);
    try {
      // Mettre à jour le profil via le service d'authentification
      await authService.updateEmail(editedEmail);
      
      // Récupérer l'utilisateur mis à jour
      const updatedUser = authService.getUser();
      if (updatedUser) {
        setUser(updatedUser);
      }
      
      setIsEditing(false);
      Alert.alert(t('common.success'), t('profile.updateSuccess'));
    } catch (error: any) {
      console.error('Erreur mise à jour profil:', error);
      Alert.alert(t('common.error'), error.message || t('profile.updateError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedEmail(user?.email || '');
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>👤 {t('settings.userProfile')}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>👤 {t('settings.userProfile')}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{t('profile.noUserData')}</Text>
          <Text style={styles.errorHint}>{t('profile.noUserDataHint')}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadUserData}>
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backToSettingsButton} onPress={onBack}>
            <Text style={styles.backToSettingsButtonText}>{t('common.back')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>👤 {t('settings.userProfile')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {user.username.substring(0, 2).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{user.username}</Text>
        </View>

        {/* Profile Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.information')}</Text>

          {/* Username (non-editable) */}
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>{t('auth.username')}</Text>
            <Text style={styles.infoValue}>{user.username}</Text>
          </View>

          {/* Email (editable) */}
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>{t('auth.email')}</Text>
            {isEditing ? (
              <TextInput
                style={styles.infoInput}
                value={editedEmail}
                onChangeText={setEditedEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder={t('auth.email')}
              />
            ) : (
              <Text style={styles.infoValue}>{user.email}</Text>
            )}
          </View>

          {/* User ID */}
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>{t('profile.userId')}</Text>
            <Text style={styles.infoValue}>#{user.id}</Text>
          </View>

          {/* Roles */}
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>{t('profile.roles')}</Text>
            <View style={styles.rolesContainer}>
              {user.roles.map((role, index) => (
                <View key={index} style={styles.roleBadge}>
                  <Text style={styles.roleText}>{role}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          {isEditing ? (
            <View style={styles.editButtonsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancelEdit}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleSaveProfile}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.editProfileButtonText}>✏️ {t('profile.editProfile')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Account Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.accountManagement')}</Text>
          
          <TouchableOpacity style={styles.managementItem}>
            <Text style={styles.managementIcon}>🔒</Text>
            <Text style={styles.managementText}>{t('settings.changePassword')}</Text>
            <Text style={styles.managementArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.managementItem}>
            <Text style={styles.managementIcon}>🔔</Text>
            <Text style={styles.managementText}>{t('profile.emailNotifications')}</Text>
            <Text style={styles.managementArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.managementItem}>
            <Text style={styles.managementIcon}>🔐</Text>
            <Text style={styles.managementText}>{t('profile.privacy')}</Text>
            <Text style={styles.managementArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Account Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.statistics')}</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>{t('profile.totalSales')}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>{t('profile.productsAdded')}</Text>
            </View>
          </View>
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#667eea',
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
    color: 'white',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backToSettingsButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
  },
  backToSettingsButtonText: {
    color: '#667eea',
    fontSize: 16,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 36,
    color: 'white',
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  infoInput: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    borderBottomWidth: 1,
    borderBottomColor: '#667eea',
    paddingBottom: 5,
  },
  rolesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleBadge: {
    backgroundColor: '#667eea',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  roleText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  editButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  cancelButtonText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#28a745',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editProfileButton: {
    backgroundColor: '#667eea',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  editProfileButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  managementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  managementIcon: {
    fontSize: 20,
    marginRight: 15,
    width: 25,
  },
  managementText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  managementArrow: {
    fontSize: 20,
    color: '#ccc',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default UserProfileScreen;

