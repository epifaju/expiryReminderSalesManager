import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView} from 'react-native';

interface SettingsScreenProps {
  onLogout: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onLogout }) => {
  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: onLogout,
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚙️ Paramètres</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compte</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingIcon}>👤</Text>
            <Text style={styles.settingText}>Profil utilisateur</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingIcon}>🔒</Text>
            <Text style={styles.settingText}>Changer le mot de passe</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Application</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingIcon}>🔔</Text>
            <Text style={styles.settingText}>Notifications</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingIcon}>🌙</Text>
            <Text style={styles.settingText}>Mode sombre</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingIcon}>🌍</Text>
            <Text style={styles.settingText}>Langue</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Données</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingIcon}>💾</Text>
            <Text style={styles.settingText}>Sauvegarde</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingIcon}>📤</Text>
            <Text style={styles.settingText}>Export des données</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingIcon}>❓</Text>
            <Text style={styles.settingText}>Aide</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingIcon}>📧</Text>
            <Text style={styles.settingText}>Contacter le support</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingIcon}>ℹ️</Text>
            <Text style={styles.settingText}>À propos</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>🚪 Déconnexion</Text>
        </TouchableOpacity>

        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>Sales Manager Mobile</Text>
          <Text style={styles.versionNumber}>Version 1.0.0</Text>
        </View>
        
        {/* Extra space at bottom to ensure scrollability */}
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
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
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
  settingIcon: {
    fontSize: 20,
    marginRight: 15,
    width: 25,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  settingArrow: {
    fontSize: 20,
    color: '#ccc',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  versionInfo: {
    alignItems: 'center',
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  versionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  versionNumber: {
    fontSize: 12,
    color: '#999',
  },
});

export default SettingsScreen;
