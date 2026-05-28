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


id | username |        email        | enabled |         created_at

----+----------+---------------------+---------+--------------------------
--
  1 | admin    | admin@test.com      | t       | 2026-05-28 10:13:55.93330
1
  2 | tmpu1    | tmpu1@test.local    | t       | 2026-05-28 14:50:27.33479
5
  3 | manager1 | manager1@test.local | t       | 2026-05-28 14:52:45.30357
3
  4 | manager2 | manager2@test.local | t       | 2026-05-28 14:52:45.53612
6
  5 | user1    | user1@test.local    | t       | 2026-05-28 14:52:45.65709
9
  6 | user2    | user2@test.local    | t       | 2026-05-28 14:52:45.78129
6
  7 | user3    | user3@test.local    | t       | 2026-05-28 14:52:45.89685
  8 | platformadmin1 | platformadmin1@test.local | t       | 2026-05-28 16
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
