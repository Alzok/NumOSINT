# 🧪 Tests NumOSINT

## Structure des Tests

```
tests/
├── package.json           # Configuration Jest et dépendances
├── README.md             # Documentation des tests
├── services/
│   ├── tools/
│   │   └── buster.test.js    # Tests service Buster
│   └── orchestrator.test.js  # Tests orchestrateur
└── integration/
    └── api.test.js          # Tests d'intégration API
```

## Types de Tests

### 1. Tests Unitaires
- **Services OSINT** : Tests individuels pour chaque service (Buster, Mosint, Maigret, etc.)
- **Orchestrateur** : Tests du flux d'investigation
- **Validations** : Tests des fonctions de validation

### 2. Tests d'Intégration
- **API** : Tests des endpoints et du flux complet
- **Base de données** : Tests des opérations CRUD
- **Services** : Tests d'interaction entre services

## Configuration

### Jest Configuration
```json
{
  "preset": "ts-jest",
  "testEnvironment": "node",
  "testMatch": ["**/*.(test|spec).(js|ts)"]
}
```

### Installation des Dépendances
```bash
cd tests/
npm install
```

## Commandes de Test

### Exécuter tous les tests
```bash
npm test
```

### Mode watch (développement)
```bash
npm run test:watch
```

### Générer le rapport de couverture
```bash
npm run test:coverage
```

### Tests spécifiques
```bash
# Tests des services
npm test services/

# Tests d'intégration
npm test integration/

# Test spécifique
npm test buster.test.js
```

## Mocking

### Prisma Client
```javascript
const mockPrisma = {
  investigation: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn()
  }
};
```

### Services OSINT
```javascript
jest.mock('../../src/services/tools/buster');
```

## Patterns de Test

### Test d'un Service
```javascript
describe('BusterService', () => {
  it('should generate emails', async () => {
    const result = await service.generate('John', 'Doe');
    expect(result.emails).toContain('john.doe@gmail.com');
  });
});
```

### Test d'API
```javascript
describe('API Integration', () => {
  it('should create investigation', async () => {
    const data = { first_name: 'John', last_name: 'Doe' };
    const result = await api.createInvestigation(data);
    expect(result.status).toBe('INITIALIZING');
  });
});
```

## Données de Test

### Investigation de Base
```javascript
const testInvestigation = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com'
};
```

### Réponses Mockées
```javascript
const mockResponse = {
  id: 'test-id',
  status: 'COMPLETED',
  progress: 100
};
```

## Bonnes Pratiques

1. **Isolation** : Chaque test doit être indépendant
2. **Mocking** : Mocker les dépendances externes
3. **Cleanup** : Nettoyer après chaque test
4. **Nommage** : Noms descriptifs pour les tests
5. **Coverage** : Viser 80% de couverture minimum

## Prochaines Étapes

- [ ] Tests E2E avec Playwright
- [ ] Tests de performance
- [ ] Tests de sécurité
- [ ] Tests d'accessibilité
- [ ] Tests frontend React
- [ ] Tests Docker/containers 