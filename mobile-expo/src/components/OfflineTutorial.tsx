/**
 * Tutoriel interactif pour le mode offline
 * 
 * Tutoriel pas-à-pas qui s'affiche au premier lancement
 * ou sur demande de l'utilisateur
 * 
 * @author Sales Manager Team
 * @version 1.0
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Étapes du tutoriel
 */
const TUTORIAL_STEPS = [
  {
    icon: '📴',
    title: 'Bienvenue dans le Mode Hors Ligne',
    description: 'Découvrez comment utiliser Sales Manager sans connexion Internet.',
    tip: 'Swipez vers la gauche pour continuer',
  },
  {
    icon: '📱',
    title: 'Enregistrez vos ventes',
    description: 'Même sans Internet, vous pouvez enregistrer toutes vos ventes. Elles seront sauvegardées localement sur votre téléphone.',
    tip: 'Les données sont stockées de manière sécurisée',
  },
  {
    icon: '🔄',
    title: 'Synchronisation automatique',
    description: 'Dès que vous êtes reconnecté, toutes vos données sont automatiquement envoyées au serveur. Pas besoin de faire quoi que ce soit !',
    tip: 'La sync démarre dans les 5 secondes',
  },
  {
    icon: '📊',
    title: 'Suivez l\'état de synchronisation',
    description: 'L\'indicateur en haut de l\'écran vous montre si vous êtes connecté et combien d\'opérations sont en attente.',
    tip: 'Appuyez dessus pour plus de détails',
  },
  {
    icon: '⚡',
    title: 'C\'est tout !',
    description: 'Vous êtes prêt à utiliser Sales Manager partout, même sans Internet. Travaillez en toute confiance !',
    tip: 'Accédez au guide complet depuis les paramètres',
  },
];

interface OfflineTutorialProps {
  visible: boolean;
  onComplete: () => void;
  onSkip?: () => void;
}

/**
 * Composant principal du tutoriel
 */
export const OfflineTutorial: React.FC<OfflineTutorialProps> = ({
  visible,
  onComplete,
  onSkip,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };
  
  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleSkip}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.tutorialContainer}>
          {/* Skip button */}
          {!isLastStep && (
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>Passer</Text>
            </TouchableOpacity>
          )}
          
          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.icon}>{step.icon}</Text>
            <Text style={styles.title}>{step.title}</Text>
            <Text style={styles.description}>{step.description}</Text>
            
            {step.tip && (
              <View style={styles.tipCard}>
                <Text style={styles.tipIcon}>💡</Text>
                <Text style={styles.tipText}>{step.tip}</Text>
              </View>
            )}
          </View>
          
          {/* Progress indicators */}
          <View style={styles.indicators}>
            {TUTORIAL_STEPS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === currentStep && styles.indicatorActive,
                ]}
              />
            ))}
          </View>
          
          {/* Navigation buttons */}
          <View style={styles.navigation}>
            {currentStep > 0 && (
              <TouchableOpacity
                style={[styles.navButton, styles.navButtonSecondary]}
                onPress={handlePrevious}
              >
                <Text style={styles.navButtonSecondaryText}>← Précédent</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.navButton, styles.navButtonPrimary, currentStep === 0 && { flex: 1 }]}
              onPress={handleNext}
            >
              <Text style={styles.navButtonPrimaryText}>
                {isLastStep ? 'Commencer !' : 'Suivant →'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Badge indicateur "Nouveau"
 */
export const NewBadge: React.FC = () => (
  <View style={styles.newBadge}>
    <Text style={styles.newBadgeText}>NOUVEAU</Text>
  </View>
);

/**
 * Bouton d'aide flottant
 */
export const HelpButton: React.FC<{ onPress: () => void }> = ({ onPress }) => (
  <TouchableOpacity style={styles.helpButton} onPress={onPress}>
    <Text style={styles.helpButtonText}>?</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tutorialContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  skipButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  skipButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  content: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  icon: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  tipIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 20,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  indicatorActive: {
    backgroundColor: '#3B82F6',
    width: 24,
  },
  navigation: {
    flexDirection: 'row',
    gap: 12,
  },
  navButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  navButtonPrimary: {
    backgroundColor: '#3B82F6',
  },
  navButtonSecondary: {
    backgroundColor: '#F3F4F6',
  },
  navButtonPrimaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  navButtonSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  newBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  helpButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  helpButtonText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default OfflineTutorial;

