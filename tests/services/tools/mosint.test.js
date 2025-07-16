const MosintService = require('../../../src/services/tools/mosint');

// TODO: Ajouter des tests d'intégration pour le service Mosint
// qui mockent l'appel HTTP et vérifient la création des résultats
// et des indicateurs dans la base de données mockée.
describe('MosintService', () => {
  it('should be defined', () => {
    const mockPrisma = {};
    const mosintService = new MosintService(mockPrisma);
    expect(mosintService).toBeDefined();
  });
});