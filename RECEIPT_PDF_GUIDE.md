# Guide d'utilisation - Génération de Reçus PDF

## Vue d'ensemble

Cette fonctionnalité permet de générer et télécharger des reçus professionnels en PDF pour les ventes effectuées dans l'application. Elle comprend un backend Spring Boot avec génération PDF et un frontend React Native avec téléchargement et partage.

## Architecture

### Backend (Spring Boot)

- **Receipt** : Entité JPA pour stocker les métadonnées des reçus
- **ReceiptRepository** : Repository pour les opérations CRUD
- **ReceiptService** : Service métier pour la gestion des reçus
- **ReceiptPdfService** : Service de génération PDF avec iText7
- **ReceiptController** : API REST sécurisée avec JWT

### Frontend (React Native)

- **ReceiptService** : Service API pour communiquer avec le backend
- **FileDownloadService** : Service de téléchargement et sauvegarde de fichiers
- **ReceiptPdfButton** : Composant bouton pour télécharger les PDF
- **ReceiptCard** : Composant d'affichage des reçus
- **CreateReceiptButton** : Composant pour créer des reçus
- **ReceiptsScreen** : Écran de gestion des reçus

## Installation et Configuration

### 1. Backend

#### Dépendances (déjà ajoutées au pom.xml)

```xml
<!-- PDF Generation -->
<dependency>
    <groupId>com.itextpdf</groupId>
    <artifactId>kernel</artifactId>
    <version>7.2.6</version>
</dependency>
<dependency>
    <groupId>com.itextpdf</groupId>
    <artifactId>layout</artifactId>
    <version>7.2.6</version>
</dependency>
<dependency>
    <groupId>com.itextpdf</groupId>
    <artifactId>io</artifactId>
    <version>7.2.6</version>
</dependency>
```

#### Base de données

Exécuter le script SQL pour créer la table :

```bash
psql -d votre_database -f backend/setup-receipts-table.sql
```

### 2. Frontend

#### Dépendances (déjà ajoutées au package.json)

```json
{
  "react-native-blob-util": "^0.19.1",
  "react-native-share": "^10.1.0"
}
```

#### Installation

```bash
cd mobile-expo
npm install
```

#### Permissions Android

Ajouter dans `android/app/src/main/AndroidManifest.xml` :

```xml
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

## Utilisation

### 1. Créer un reçu

```typescript
import { receiptService } from "../services/receiptService";

// Créer un reçu pour une vente
const receipt = await receiptService.createReceipt(saleId);
```

### 2. Télécharger un PDF

```typescript
import { ReceiptPdfButton } from "../components/ReceiptPdfButton";

<ReceiptPdfButton
  receipt={receipt}
  onDownloadSuccess={(filePath) => console.log("PDF téléchargé:", filePath)}
  onDownloadError={(error) => console.error("Erreur:", error)}
/>;
```

### 3. Afficher la liste des reçus

```typescript
import { ReceiptsScreen } from "../screens/ReceiptsScreen";

// Dans votre navigation
<ReceiptsScreen />;
```

## API Endpoints

### Backend - ReceiptController

| Méthode | Endpoint                                   | Description                       | Authentification |
| ------- | ------------------------------------------ | --------------------------------- | ---------------- |
| POST    | `/api/receipts/create/{saleId}`            | Créer un reçu                     | JWT Required     |
| GET     | `/api/receipts`                            | Lister les reçus de l'utilisateur | JWT Required     |
| GET     | `/api/receipts/{id}`                       | Récupérer un reçu par ID          | JWT Required     |
| GET     | `/api/receipts/number/{receiptNumber}`     | Récupérer un reçu par numéro      | JWT Required     |
| GET     | `/api/receipts/{id}/pdf`                   | Télécharger le PDF d'un reçu      | JWT Required     |
| GET     | `/api/receipts/number/{receiptNumber}/pdf` | Télécharger le PDF par numéro     | JWT Required     |
| PUT     | `/api/receipts/{id}`                       | Mettre à jour un reçu             | JWT Required     |
| DELETE  | `/api/receipts/{id}`                       | Supprimer un reçu                 | JWT Required     |

## Contenu du PDF

Le reçu PDF généré contient :

### En-tête

- Titre "REÇU DE VENTE"
- Informations de l'entreprise (nom, adresse, téléphone, email)
- Logo de l'entreprise (optionnel)

### Corps

- Numéro de reçu unique
- Date et heure de la transaction
- Nom du vendeur
- Détail des articles (nom, quantité, prix unitaire, remise, total)
- Sous-total, TVA, remise, total TTC
- Mode de paiement
- Informations client

### Pied de page

- Notes additionnelles
- Mentions légales
- QR code de vérification (optionnel)
- Timestamp de génération

## Sécurité

### Backend

- Authentification JWT obligatoire
- Vérification des permissions utilisateur
- Validation de l'existence des ressources
- Logging des téléchargements
- Protection CSRF

### Frontend

- Demande de permissions de stockage (Android)
- Validation des données avant envoi
- Gestion des erreurs réseau
- Chiffrement des données sensibles (optionnel)

## Gestion des erreurs

### Backend

- Reçu non trouvé (404)
- Erreur de génération PDF (500)
- Accès non autorisé (403)
- Données invalides (400)

### Frontend

- Problème de permissions
- Erreur de téléchargement
- Timeout réseau
- Espace de stockage insuffisant

## Personnalisation

### Template PDF

Modifier la classe `ReceiptPdfService` pour :

- Changer les couleurs et polices
- Ajouter un logo d'entreprise
- Modifier la mise en page
- Ajouter des éléments graphiques

### Informations entreprise

Configurer dans la base de données ou via l'API :

- Nom et adresse de l'entreprise
- Coordonnées de contact
- Logo et branding
- Mentions légales personnalisées

### Composants React Native

Personnaliser les composants pour :

- Changer le style des boutons
- Modifier l'affichage des cartes
- Ajouter des animations
- Intégrer dans d'autres écrans

## Tests

### Backend

```bash
# Tests unitaires
mvn test

# Tests d'intégration
mvn verify
```

### Frontend

```bash
# Tests des composants
npm test

# Tests E2E
npm run test:e2e
```

## Déploiement

### Backend

1. Compiler l'application : `mvn clean package`
2. Déployer sur le serveur
3. Configurer la base de données
4. Démarrer l'application

### Frontend

1. Compiler l'application : `expo build`
2. Déployer sur les stores (iOS/Android)
3. Configurer les permissions
4. Tester sur différents devices

## Maintenance

### Monitoring

- Surveiller les logs de génération PDF
- Monitorer l'utilisation de l'espace disque
- Vérifier les performances des téléchargements
- Analyser les erreurs utilisateurs

### Sauvegarde

- Sauvegarder régulièrement la base de données
- Archiver les PDF générés (optionnel)
- Conserver les logs d'audit

### Mise à jour

- Mettre à jour les dépendances régulièrement
- Tester les nouvelles versions d'iText
- Vérifier la compatibilité des nouvelles versions de React Native

## Support et dépannage

### Problèmes courants

1. **PDF ne se génère pas**

   - Vérifier les logs du serveur
   - Contrôler les permissions de l'utilisateur
   - Valider les données de la vente

2. **Téléchargement échoue**

   - Vérifier les permissions de stockage
   - Contrôler l'espace disque disponible
   - Tester la connectivité réseau

3. **Erreurs de compilation**
   - Vérifier les versions des dépendances
   - Nettoyer le cache : `mvn clean` ou `npm clean`
   - Recompiler complètement

### Logs utiles

- Backend : `logs/application.log`
- Frontend : Console React Native
- Base de données : Logs PostgreSQL

## Évolutions futures

### Fonctionnalités prévues

- Envoi de reçus par email
- Génération de factures
- Intégration avec des systèmes comptables
- Signatures électroniques
- Templates personnalisables
- Multi-langues
- Codes-barres et QR codes avancés

### Améliorations techniques

- Cache des PDF générés
- Compression des fichiers
- Génération asynchrone
- API de webhooks
- Intégration avec des services cloud
