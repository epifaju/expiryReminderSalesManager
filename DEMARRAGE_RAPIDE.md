# ⚡ Démarrage Rapide - Sales Manager

## 🚀 En 3 Commandes !

### Option 1 : Avec Script Automatique (Le plus simple)

```powershell
# Démarrer le backend
.\start-backend-h2.ps1

# Dans une NOUVELLE fenêtre PowerShell, démarrer le mobile
cd mobile-expo
npm start
```

**C'est tout !** ✅

---

## 📝 Commandes Essentielles

### Backend H2 (Recommandé pour débuter)

```powershell
# Terminal 1 - Backend
.\start-backend-h2.ps1
```

**Attendez** : `Started SalesManagerApplication`

### Application Mobile

```powershell
# Terminal 2 - Mobile (nouvelle fenêtre)
cd mobile-expo
npm start
```

**Puis :**
- Scanner le QR code avec **Expo Go**
- Ou appuyer sur `a` pour Android
- Ou appuyer sur `i` pour iOS

---

## 🔑 Identifiants de Connexion

```
Username : admin
Password : admin123
```

---

## ✅ Vérifier que ça fonctionne

### Backend prêt ?
```powershell
curl http://localhost:8083/actuator/health
# Devrait retourner : {"status":"UP"}
```

### App mobile prête ?
- Le QR code s'affiche ✅
- Expo Go peut scanner ✅
- L'app se charge ✅

---

## 🎯 Dépannage Rapide

### Backend ne démarre pas ?
- Port occupé ? Changez le port dans `application.yml`
- Maven manquant ? `mvn -version`
- Java manquant ? `java -version`

### Mobile ne se connecte pas ?
- Backend démarré ? Vérifiez avec `curl`
- Bonne IP ? Vérifiez dans `authService.ts`
- Cache ? `npx expo start --clear`

---

## 📖 Guide Complet

Pour plus de détails : **`GUIDE_DEMARRAGE_APPLICATION.md`**

---

**C'est parti ! 🚀**

