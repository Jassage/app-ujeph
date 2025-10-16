# Configuration MongoDB pour l'Application Académique

## Architecture préparée pour MongoDB

L'application est maintenant structurée pour une intégration facile avec MongoDB :

### 📁 Structure des fichiers

```
src/
├── services/
│   └── api.ts              # Service d'API pour MongoDB
├── data/
│   └── mockData.ts         # Données mock (temporaires)
├── hooks/
│   └── useDataSync.ts      # Hook de synchronisation
└── contexts/
    └── DataContext.tsx     # Contexte global des données
```

### 🔧 Configuration actuelle

**Mode développement** : L'application utilise des données mock stockées localement
**Mode production** : Prête pour la connexion MongoDB

### 🚀 Migration vers MongoDB

Pour connecter à MongoDB, vous devrez :

1. **Installer les dépendances backend** :
   ```bash
   npm install mongodb express cors dotenv
   ```

2. **Créer votre API backend** :
   - Créez un serveur Express
   - Connectez-vous à MongoDB
   - Implémentez les endpoints dans `api.ts`

3. **Configurer les variables d'environnement** :
   ```env
   REACT_APP_API_URL=http://localhost:3001/api
   MONGODB_URI=mongodb://localhost:27017/academic_system
   ```

4. **Remplacer les appels mock** :
   - Dans `src/services/api.ts`, remplacez `mockApiCall` par de vrais appels `fetch()`
   - Les endpoints sont déjà définis selon les standards REST

### 📊 Collections MongoDB recommandées

```javascript
// Collections suggérées pour MongoDB
{
  students: [],
  enrollments: [],
  faculties: [],
  users: [],
  ues: [],
  grades: [],
  guardians: [],
  schedules: [],
  payments: [],
  // ... autres collections
}
```

### 🔄 Synchronisation des données

Le hook `useDataSync` gère :
- ✅ Chargement initial des données
- ✅ État de chargement et gestion d'erreurs
- 🔜 Synchronisation avec MongoDB (à implémenter)
- 🔜 Cache local et mise à jour en temps réel

### 📝 Prochaines étapes

1. Configurez votre base MongoDB
2. Créez votre API backend avec Express
3. Modifiez `src/services/api.ts` pour utiliser de vrais appels HTTP
4. Testez la connexion avec les données réelles

L'application continuera de fonctionner avec les données mock jusqu'à ce que vous configuriez MongoDB.