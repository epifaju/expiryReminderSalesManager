/**
 * Guide utilisateur pour le mode offline
 * 
 * Écran d'aide expliquant :
 * - Comment utiliser l'app sans Internet
 * - Fonctionnement de la synchronisation
 * - Résolution des problèmes courants
 * - FAQ en français
 * 
 * @author Sales Manager Team
 * @version 1.0
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';

/**
 * Écran principal du guide
 */
export const OfflineGuideScreen: React.FC = () => {
  const [selectedSection, setSelectedSection] = useState<'intro' | 'howto' | 'sync' | 'faq' | 'troubleshoot'>('intro');
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📴 Mode Hors Ligne</Text>
        <Text style={styles.headerSubtitle}>Guide d'utilisation</Text>
      </View>
      
      {/* Navigation */}
      <View style={styles.navigation}>
        <NavButton
          title="Introduction"
          icon="📖"
          isActive={selectedSection === 'intro'}
          onPress={() => setSelectedSection('intro')}
        />
        <NavButton
          title="Comment faire"
          icon="📝"
          isActive={selectedSection === 'howto'}
          onPress={() => setSelectedSection('howto')}
        />
        <NavButton
          title="Synchronisation"
          icon="🔄"
          isActive={selectedSection === 'sync'}
          onPress={() => setSelectedSection('sync')}
        />
        <NavButton
          title="FAQ"
          icon="❓"
          isActive={selectedSection === 'faq'}
          onPress={() => setSelectedSection('faq')}
        />
        <NavButton
          title="Dépannage"
          icon="🔧"
          isActive={selectedSection === 'troubleshoot'}
          onPress={() => setSelectedSection('troubleshoot')}
        />
      </View>
      
      {/* Contenu */}
      <ScrollView style={styles.content}>
        {selectedSection === 'intro' && <IntroSection />}
        {selectedSection === 'howto' && <HowToSection />}
        {selectedSection === 'sync' && <SyncSection />}
        {selectedSection === 'faq' && <FAQSection />}
        {selectedSection === 'troubleshoot' && <TroubleshootSection />}
      </ScrollView>
    </View>
  );
};

/**
 * Bouton de navigation
 */
const NavButton: React.FC<{
  title: string;
  icon: string;
  isActive: boolean;
  onPress: () => void;
}> = ({ title, icon, isActive, onPress }) => (
  <TouchableOpacity
    style={[styles.navButton, isActive && styles.navButtonActive]}
    onPress={onPress}
  >
    <Text style={styles.navIcon}>{icon}</Text>
    <Text style={[styles.navText, isActive && styles.navTextActive]}>
      {title}
    </Text>
  </TouchableOpacity>
);

/**
 * Section Introduction
 */
const IntroSection: React.FC = () => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Bienvenue dans le Mode Hors Ligne !</Text>
    
    <InfoCard
      icon="🌍"
      title="Qu'est-ce que le mode hors ligne ?"
      description="Le mode hors ligne vous permet de continuer à utiliser Sales Manager même sans connexion Internet. Toutes vos opérations sont enregistrées localement et se synchronisent automatiquement dès que vous êtes reconnecté."
    />
    
    <InfoCard
      icon="✅"
      title="Ce que vous pouvez faire sans Internet"
      description={`• Enregistrer des ventes\n• Ajouter des produits\n• Mettre à jour le stock\n• Consulter l'inventaire\n• Générer des rapports`}
    />
    
    <InfoCard
      icon="🔄"
      title="Synchronisation automatique"
      description="Vos données se synchronisent automatiquement avec le serveur quand vous êtes connecté. Pas besoin de faire quoi que ce soit !"
    />
    
    <View style={styles.highlight}>
      <Text style={styles.highlightIcon}>💡</Text>
      <Text style={styles.highlightText}>
        L'application fonctionne exactement de la même façon, avec ou sans Internet !
      </Text>
    </View>
  </View>
);

/**
 * Section Comment faire
 */
const HowToSection: React.FC = () => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Comment enregistrer une vente sans Internet ?</Text>
    
    <StepCard
      number={1}
      title="Vérifiez l'indicateur de connexion"
      description="En haut de l'écran, vous verrez l'état de votre connexion :"
      detail="🟢 Connecté | 🔴 Hors ligne"
    />
    
    <StepCard
      number={2}
      title="Enregistrez normalement"
      description="Même sans Internet, enregistrez vos ventes comme d'habitude. L'application fonctionne normalement !"
    />
    
    <StepCard
      number={3}
      title="Vérifiez la file d'attente"
      description="Dans l'onglet Synchronisation, vous pouvez voir combien d'opérations attendent d'être synchronisées."
    />
    
    <StepCard
      number={4}
      title="Connectez-vous à Internet"
      description="Dès que vous avez Internet (WiFi ou données mobiles), la synchronisation démarre automatiquement."
    />
    
    <StepCard
      number={5}
      title="Vérifiez la synchronisation"
      description="Une notification vous confirme que vos données ont été synchronisées avec succès ! ✅"
    />
    
    <View style={styles.highlight}>
      <Text style={styles.highlightIcon}>⚡</Text>
      <Text style={styles.highlightText}>
        Astuce : Vous pouvez aussi déclencher la synchronisation manuellement en appuyant sur le bouton "Synchroniser maintenant".
      </Text>
    </View>
  </View>
);

/**
 * Section Synchronisation
 */
const SyncSection: React.FC = () => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Comment fonctionne la synchronisation ?</Text>
    
    <InfoCard
      icon="🔄"
      title="Synchronisation automatique"
      description="La synchronisation se déclenche automatiquement :\n• Toutes les 15 minutes (si connecté)\n• Immédiatement au retour de connexion\n• Lors de l'ouverture de l'application"
    />
    
    <InfoCard
      icon="📤"
      title="Que se passe-t-il pendant la sync ?"
      description="1. Vos données locales sont envoyées au serveur\n2. Le serveur les enregistre dans la base\n3. Vous recevez les modifications des autres appareils\n4. Tout est mis à jour localement"
    />
    
    <InfoCard
      icon="⚠️"
      title="Gestion des conflits"
      description="Si la même donnée a été modifiée sur deux appareils, l'application détecte le conflit et vous demande quelle version garder."
    />
    
    <View style={styles.progressExample}>
      <Text style={styles.exampleTitle}>Exemple de progression :</Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: '65%' }]} />
      </View>
      <Text style={styles.progressText}>65/100 opérations synchronisées</Text>
    </View>
    
    <View style={styles.highlight}>
      <Text style={styles.highlightIcon}>🔒</Text>
      <Text style={styles.highlightText}>
        Important : Ne fermez pas l'application pendant la synchronisation pour éviter les interruptions.
      </Text>
    </View>
  </View>
);

/**
 * Section FAQ
 */
const FAQSection: React.FC = () => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Questions fréquentes (FAQ)</Text>
    
    <FAQItem
      question="Mes données sont-elles perdues si je n'ai pas Internet ?"
      answer="Non ! Toutes vos données sont sauvegardées localement sur votre téléphone. Elles seront synchronisées dès que vous aurez une connexion."
    />
    
    <FAQItem
      question="Combien de temps puis-je travailler sans Internet ?"
      answer="Vous pouvez travailler hors ligne aussi longtemps que vous voulez. L'application peut stocker des milliers d'opérations en attente de synchronisation."
    />
    
    <FAQItem
      question="Que faire si la synchronisation échoue ?"
      answer="L'application réessaie automatiquement plusieurs fois. Si le problème persiste, vérifiez votre connexion Internet et contactez le support."
    />
    
    <FAQItem
      question="Comment savoir si mes données sont synchronisées ?"
      answer="Consultez l'onglet Synchronisation pour voir l'état. Un badge vous indique aussi le nombre d'opérations en attente."
    />
    
    <FAQItem
      question="Puis-je synchroniser uniquement sur WiFi ?"
      answer="Oui ! Dans les paramètres, activez 'Synchroniser uniquement en WiFi' pour économiser vos données mobiles."
    />
    
    <FAQItem
      question="Que se passe-t-il en cas de conflit ?"
      answer="Si deux modifications entrent en conflit, vous recevez une notification. Vous pouvez alors choisir quelle version garder (locale ou serveur)."
    />
    
    <FAQItem
      question="L'application consomme-t-elle beaucoup de batterie ?"
      answer="Non. La synchronisation est optimisée et ne se déclenche que lorsque nécessaire. En mode économie d'énergie, elle est désactivée si la batterie est < 20%."
    />
    
    <FAQItem
      question="Combien d'espace l'application utilise-t-elle ?"
      answer="Environ 20-50 MB pour stocker vos données locales (pour 1000 ventes). L'application nettoie automatiquement les anciennes données synchronisées."
    />
  </View>
);

/**
 * Section Dépannage
 */
const TroubleshootSection: React.FC = () => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Résolution de problèmes</Text>
    
    <TroubleshootCard
      icon="⚠️"
      problem="La synchronisation ne démarre pas"
      solutions={[
        'Vérifiez votre connexion Internet',
        'Assurez-vous d\'être connecté à votre compte',
        'Réessayez en appuyant sur "Synchroniser maintenant"',
        'Redémarrez l\'application si le problème persiste',
      ]}
    />
    
    <TroubleshootCard
      icon="🔴"
      problem="J'ai perdu ma connexion pendant la sync"
      solutions={[
        'Pas de panique ! Vos données sont sauvegardées',
        'La synchronisation reprendra automatiquement',
        'Reconnectez-vous à Internet',
        'Attendez quelques secondes, la sync va continuer',
      ]}
    />
    
    <TroubleshootCard
      icon="⚔️"
      problem="J'ai un conflit de données"
      solutions={[
        'Appuyez sur la notification de conflit',
        'Comparez les deux versions (locale vs serveur)',
        'Choisissez quelle version garder',
        'Confirmez votre choix',
      ]}
    />
    
    <TroubleshootCard
      icon="📱"
      problem="L'application est lente en mode offline"
      solutions={[
        'Synchronisez vos données pour libérer de l\'espace',
        'Nettoyez les anciennes opérations synchronisées',
        'Vérifiez l\'espace disponible sur votre téléphone',
        'Redémarrez l\'application',
      ]}
    />
    
    <View style={styles.contactCard}>
      <Text style={styles.contactTitle}>Besoin d'aide ?</Text>
      <Text style={styles.contactText}>
        Si vous rencontrez un problème non résolu, contactez notre support :
      </Text>
      <Text style={styles.contactEmail}>📧 support@salesmanager.gw</Text>
      <Text style={styles.contactPhone}>📞 +221 XX XXX XX XX</Text>
    </View>
  </View>
);

/**
 * Composant Carte d'information
 */
const InfoCard: React.FC<{
  icon: string;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <View style={styles.infoCard}>
    <Text style={styles.infoIcon}>{icon}</Text>
    <View style={styles.infoContent}>
      <Text style={styles.infoTitle}>{title}</Text>
      <Text style={styles.infoDescription}>{description}</Text>
    </View>
  </View>
);

/**
 * Composant Étape du tutoriel
 */
const StepCard: React.FC<{
  number: number;
  title: string;
  description: string;
  detail?: string;
}> = ({ number, title, description, detail }) => (
  <View style={styles.stepCard}>
    <View style={styles.stepNumber}>
      <Text style={styles.stepNumberText}>{number}</Text>
    </View>
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepDescription}>{description}</Text>
      {detail && <Text style={styles.stepDetail}>{detail}</Text>}
    </View>
  </View>
);

/**
 * Composant Question FAQ
 */
const FAQItem: React.FC<{
  question: string;
  answer: string;
}> = ({ question, answer }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <TouchableOpacity
      style={styles.faqItem}
      onPress={() => setIsExpanded(!isExpanded)}
      activeOpacity={0.7}
    >
      <View style={styles.faqQuestion}>
        <Text style={styles.faqQuestionIcon}>❓</Text>
        <Text style={styles.faqQuestionText}>{question}</Text>
        <Text style={styles.faqToggle}>{isExpanded ? '▼' : '▶'}</Text>
      </View>
      {isExpanded && (
        <View style={styles.faqAnswer}>
          <Text style={styles.faqAnswerText}>{answer}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

/**
 * Composant Carte de dépannage
 */
const TroubleshootCard: React.FC<{
  icon: string;
  problem: string;
  solutions: string[];
}> = ({ icon, problem, solutions }) => (
  <View style={styles.troubleshootCard}>
    <View style={styles.troubleshootHeader}>
      <Text style={styles.troubleshootIcon}>{icon}</Text>
      <Text style={styles.troubleshootProblem}>{problem}</Text>
    </View>
    <Text style={styles.troubleshootSolutionsTitle}>Solutions :</Text>
    {solutions.map((solution, index) => (
      <View key={index} style={styles.troubleshootSolution}>
        <Text style={styles.troubleshootBullet}>•</Text>
        <Text style={styles.troubleshootSolutionText}>{solution}</Text>
      </View>
    ))}
  </View>
);

/**
 * Styles
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#3B82F6',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#DBEAFE',
  },
  navigation: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  navButtonActive: {
    backgroundColor: '#EFF6FF',
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navText: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  navTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  stepDetail: {
    fontSize: 13,
    color: '#3B82F6',
    marginTop: 6,
    fontWeight: '500',
  },
  faqItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  faqQuestionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  faqToggle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  faqAnswer: {
    padding: 16,
    paddingTop: 0,
    backgroundColor: '#F9FAFB',
  },
  faqAnswerText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
  },
  troubleshootCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  troubleshootHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  troubleshootIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  troubleshootProblem: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  troubleshootSolutionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  troubleshootSolution: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 8,
  },
  troubleshootBullet: {
    fontSize: 14,
    color: '#10B981',
    marginRight: 8,
    fontWeight: 'bold',
  },
  troubleshootSolutionText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  highlight: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    marginTop: 16,
  },
  highlightIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  highlightText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  progressExample: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  exampleTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  contactCard: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 13,
    color: '#15803D',
    marginBottom: 12,
  },
  contactEmail: {
    fontSize: 14,
    color: '#166534',
    fontWeight: '500',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: '#166534',
    fontWeight: '500',
  },
});

export default OfflineGuideScreen;

