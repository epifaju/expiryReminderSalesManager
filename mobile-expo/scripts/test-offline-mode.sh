#!/bin/bash

# Script de test automatisé du mode offline
# Usage: ./test-offline-mode.sh

echo "🧪 Test du Mode Offline - Sales Manager"
echo "========================================"

PACKAGE="com.salesmanager"

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour vérifier une condition
check() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ $1${NC}"
    return 0
  else
    echo -e "${RED}❌ $1 - ÉCHOUÉ${NC}"
    return 1
  fi
}

# Fonction pour afficher une section
section() {
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# 1. Vérifier que l'app est installée
section "1️⃣ Vérification de l'application"
adb shell pm list packages | grep $PACKAGE > /dev/null
check "Application installée"

# 2. Démarrer l'app
section "2️⃣ Démarrage de l'application"
adb shell am start -n $PACKAGE/.MainActivity > /dev/null 2>&1
sleep 3
check "Application démarrée"

# 3. Vérifier l'état initial
section "3️⃣ État initial"
DB_PATH="/data/data/$PACKAGE/databases/salesmanager.db"

# Vérifier si la DB existe
if adb shell "run-as $PACKAGE test -f $DB_PATH && echo exists" | grep -q exists; then
  echo -e "${GREEN}✅ Base de données trouvée${NC}"
  
  # Compter les opérations en attente
  INITIAL_QUEUE=$(adb shell "run-as $PACKAGE sqlite3 $DB_PATH 'SELECT COUNT(*) FROM sync_queue WHERE sync_status=\"pending\"'" 2>/dev/null | tr -d '\r')
  echo "   Opérations en attente: ${INITIAL_QUEUE:-0}"
else
  echo -e "${YELLOW}⚠️  Base de données non trouvée (première utilisation?)${NC}"
  INITIAL_QUEUE=0
fi

# 4. Activer le mode offline
section "4️⃣ Activation du mode offline"
adb shell cmd connectivity airplane-mode enable > /dev/null 2>&1
sleep 2
AIRPLANE_MODE=$(adb shell settings get global airplane_mode_on | tr -d '\r')
if [ "$AIRPLANE_MODE" == "1" ]; then
  echo -e "${GREEN}✅ Mode avion activé${NC}"
else
  echo -e "${RED}❌ Mode avion non activé${NC}"
  echo -e "${YELLOW}   Tentez manuellement depuis l'appareil${NC}"
fi

# 5. Simuler la création de ventes (instructions pour l'utilisateur)
section "5️⃣ Test manuel - Création de ventes"
echo -e "${YELLOW}📱 Actions à effectuer manuellement sur l'appareil :${NC}"
echo "   1. Créer 5-10 ventes via l'interface"
echo "   2. Observer le badge 'Hors ligne'"
echo "   3. Vérifier le compteur d'opérations"
echo ""
echo -e "${YELLOW}⏸️  Appuyez sur ENTRÉE une fois les ventes créées...${NC}"
read -r

# 6. Vérifier la file d'attente après création
section "6️⃣ Vérification de la file d'attente"
QUEUE_COUNT=$(adb shell "run-as $PACKAGE sqlite3 $DB_PATH 'SELECT COUNT(*) FROM sync_queue WHERE sync_status=\"pending\"'" 2>/dev/null | tr -d '\r')
echo "   Opérations en attente: ${QUEUE_COUNT:-0}"

if [ "${QUEUE_COUNT:-0}" -gt "$INITIAL_QUEUE" ]; then
  NEW_OPS=$((QUEUE_COUNT - INITIAL_QUEUE))
  echo -e "${GREEN}✅ $NEW_OPS nouvelles opérations ajoutées${NC}"
else
  echo -e "${YELLOW}⚠️  Aucune nouvelle opération détectée${NC}"
fi

# 7. Afficher le contenu de la queue
echo ""
echo -e "${BLUE}📋 Contenu de la file d'attente :${NC}"
adb shell "run-as $PACKAGE sqlite3 $DB_PATH 'SELECT id, entity_type, operation_type, created_at FROM sync_queue WHERE sync_status=\"pending\" LIMIT 5'" 2>/dev/null

# 8. Réactiver la connexion
section "7️⃣ Test de synchronisation"
echo -e "${YELLOW}⏸️  Prêt à réactiver la connexion et synchroniser?${NC}"
echo "   Appuyez sur ENTRÉE pour continuer..."
read -r

adb shell cmd connectivity airplane-mode disable > /dev/null 2>&1
sleep 2
check "Connexion réactivée"

# 9. Attendre la synchronisation automatique
echo ""
echo -e "${YELLOW}⏳ Attente de la synchronisation automatique...${NC}"
for i in {1..30}; do
  echo -ne "   ${i}s / 30s\r"
  sleep 1
done
echo ""

# 10. Vérifier que la queue est vide
section "8️⃣ Vérification post-synchronisation"
QUEUE_AFTER=$(adb shell "run-as $PACKAGE sqlite3 $DB_PATH 'SELECT COUNT(*) FROM sync_queue WHERE sync_status=\"pending\"'" 2>/dev/null | tr -d '\r')
echo "   Opérations restantes: ${QUEUE_AFTER:-0}"

if [ "${QUEUE_AFTER:-1}" -eq 0 ]; then
  echo -e "${GREEN}✅ Synchronisation réussie (queue vide)${NC}"
else
  echo -e "${YELLOW}⚠️  Synchronisation incomplète (${QUEUE_AFTER} opérations restantes)${NC}"
  echo ""
  echo "   Opérations non synchronisées :"
  adb shell "run-as $PACKAGE sqlite3 $DB_PATH 'SELECT id, entity_type, retry_count FROM sync_queue WHERE sync_status=\"pending\"'" 2>/dev/null
fi

# 11. Résumé final
section "📊 RÉSUMÉ DU TEST"
echo "Opérations initiales: $INITIAL_QUEUE"
echo "Opérations créées offline: $((QUEUE_COUNT - INITIAL_QUEUE))"
echo "Opérations synchronisées: $((QUEUE_COUNT - QUEUE_AFTER))"
echo "Opérations restantes: ${QUEUE_AFTER:-0}"
echo ""

if [ "${QUEUE_AFTER:-1}" -eq 0 ]; then
  echo -e "${GREEN}🎉 STATUT: SUCCÈS${NC}"
  echo -e "   Toutes les opérations ont été synchronisées avec succès!"
else
  echo -e "${YELLOW}⚠️  STATUT: PARTIEL${NC}"
  echo -e "   ${QUEUE_AFTER} opérations n'ont pas été synchronisées."
  echo -e "   Vérifiez les logs: ${BLUE}adb logcat | grep SYNC${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Commandes utiles pour debug :"
echo ""
echo "   # Voir les logs de sync"
echo "   adb logcat | grep -E 'SYNC|NETWORK|QUEUE'"
echo ""
echo "   # Inspecter la base de données"
echo "   adb shell \"run-as $PACKAGE sqlite3 $DB_PATH\""
echo ""
echo "   # Compter les opérations"
echo "   adb shell \"run-as $PACKAGE sqlite3 $DB_PATH 'SELECT COUNT(*) FROM sync_queue'\""
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

