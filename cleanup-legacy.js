#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script de nettoyage des fichiers legacy après migration
 */

class LegacyCleanup {
  constructor() {
    this.cleanupLog = [];
    this.dryRun = process.argv.includes('--dry-run');
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    this.cleanupLog.push(logMessage);
  }

  async cleanupPythonFiles() {
    this.log('🧹 Nettoyage des fichiers Python obsolètes');
    
    const pythonFiles = [
      'requirements.txt',
      'Pipfile',
      'Pipfile.lock',
      'setup.py',
      'requirements-dev.txt'
    ];

    for (const file of pythonFiles) {
      if (fs.existsSync(file)) {
        this.log(`🗑️  Suppression: ${file}`);
        if (!this.dryRun) {
          fs.unlinkSync(file);
        }
      }
    }
  }

  async cleanupConfigFiles() {
    this.log('🧹 Nettoyage des fichiers de configuration obsolètes');
    
    const configFiles = [
      'nginx.conf',
      'uwsgi.ini',
      'gunicorn.conf.py',
      '.flaskenv',
      '.env.example'
    ];

    for (const file of configFiles) {
      if (fs.existsSync(file)) {
        this.log(`🗑️  Suppression: ${file}`);
        if (!this.dryRun) {
          fs.unlinkSync(file);
        }
      }
    }
  }

  async cleanupDirectories() {
    this.log('🧹 Nettoyage des dossiers obsolètes');
    
    const directories = [
      '__pycache__',
      '.pytest_cache',
      'venv',
      'env',
      '.venv',
      'instance',
      'migrations' // Flask-Migrate
    ];

    for (const dir of directories) {
      if (fs.existsSync(dir)) {
        this.log(`🗑️  Suppression dossier: ${dir}`);
        if (!this.dryRun) {
          fs.rmSync(dir, { recursive: true, force: true });
        }
      }
    }
  }

  async cleanupDataFiles() {
    this.log('🧹 Nettoyage des fichiers de données obsolètes');
    
    const dataFiles = [
      'data.json',
      'database.db',
      'instance/database.db'
    ];

    for (const file of dataFiles) {
      if (fs.existsSync(file)) {
        this.log(`ℹ️  Fichier de données trouvé: ${file}`);
        this.log(`⚠️  Veuillez vérifier si ce fichier est encore nécessaire`);
        // Ne pas supprimer automatiquement les fichiers de données
      }
    }
  }

  async updateDockerfile() {
    this.log('🧹 Nettoyage du Dockerfile');
    
    const dockerfilePath = 'Dockerfile';
    
    if (fs.existsSync(dockerfilePath)) {
      const content = fs.readFileSync(dockerfilePath, 'utf-8');
      
      // Vérifier s'il y a des références Python obsolètes
      const pythonReferences = [
        'FROM python:',
        'pip install',
        'requirements.txt',
        'flask',
        'gunicorn',
        'uwsgi'
      ];
      
      let hasPythonReferences = false;
      for (const ref of pythonReferences) {
        if (content.toLowerCase().includes(ref.toLowerCase())) {
          hasPythonReferences = true;
          break;
        }
      }
      
      if (hasPythonReferences) {
        this.log('⚠️  Dockerfile contient des références Python obsolètes');
        this.log('📝 Veuillez mettre à jour le Dockerfile pour Node.js uniquement');
        
        // Créer un Dockerfile de base pour Node.js
        const nodeDockerfile = `# Dockerfile pour NumOSINT (Node.js)
FROM node:18-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installer les dépendances
RUN npm ci --only=production

# Générer le client Prisma
RUN npx prisma generate

# Copier le code source
COPY src ./src/

# Exposer le port
EXPOSE 5000

# Commande de démarrage
CMD ["npm", "start"]
`;
        
        if (!this.dryRun) {
          fs.writeFileSync('Dockerfile.new', nodeDockerfile);
          this.log('✅ Nouveau Dockerfile créé: Dockerfile.new');
        }
      }
    }
  }

  async updatePackageJson() {
    this.log('🧹 Nettoyage du package.json');
    
    const packageJsonPath = 'package.json';
    
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      
      // Scripts obsolètes à supprimer
      const obsoleteScripts = [
        'flask',
        'python',
        'migrate',
        'upgrade',
        'downgrade'
      ];
      
      if (packageJson.scripts) {
        for (const script of obsoleteScripts) {
          if (packageJson.scripts[script]) {
            this.log(`🗑️  Suppression script obsolète: ${script}`);
            if (!this.dryRun) {
              delete packageJson.scripts[script];
            }
          }
        }
      }
      
      // Dépendances Python à supprimer
      const pythonDeps = [
        'python-shell',
        'python-bridge'
      ];
      
      if (packageJson.dependencies) {
        for (const dep of pythonDeps) {
          if (packageJson.dependencies[dep]) {
            this.log(`🗑️  Suppression dépendance Python: ${dep}`);
            if (!this.dryRun) {
              delete packageJson.dependencies[dep];
            }
          }
        }
      }
      
      // Ajouter les scripts essentiels s'ils manquent
      const essentialScripts = {
        'start': 'node src/app.js',
        'dev': 'nodemon src/app.js',
        'test': 'cd tests && npm test',
        'prisma:generate': 'prisma generate',
        'prisma:migrate': 'prisma migrate dev',
        'prisma:studio': 'prisma studio'
      };
      
      if (!packageJson.scripts) {
        packageJson.scripts = {};
      }
      
      for (const [script, command] of Object.entries(essentialScripts)) {
        if (!packageJson.scripts[script]) {
          this.log(`➕ Ajout script: ${script}`);
          if (!this.dryRun) {
            packageJson.scripts[script] = command;
          }
        }
      }
      
      if (!this.dryRun) {
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        this.log('✅ package.json mis à jour');
      }
    }
  }

  async generateReport() {
    this.log('');
    this.log('📊 RAPPORT DE NETTOYAGE');
    this.log('=======================');
    
    const summary = {
      filesRemoved: this.cleanupLog.filter(log => log.includes('🗑️')).length,
      dirsRemoved: this.cleanupLog.filter(log => log.includes('Suppression dossier')).length,
      warnings: this.cleanupLog.filter(log => log.includes('⚠️')).length,
      actions: this.cleanupLog.filter(log => log.includes('✅')).length
    };
    
    this.log(`📁 Fichiers supprimés: ${summary.filesRemoved}`);
    this.log(`📂 Dossiers supprimés: ${summary.dirsRemoved}`);
    this.log(`⚠️  Avertissements: ${summary.warnings}`);
    this.log(`✅ Actions complétées: ${summary.actions}`);
    
    if (this.dryRun) {
      this.log('');
      this.log('ℹ️  Mode dry-run activé - aucune modification effectuée');
      this.log('💡 Exécutez sans --dry-run pour appliquer les changements');
    }
    
    // Sauvegarder le rapport
    const reportPath = path.join(process.cwd(), 'logs', 'cleanup-report.log');
    if (!fs.existsSync(path.dirname(reportPath))) {
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    }
    
    fs.writeFileSync(reportPath, this.cleanupLog.join('\n'));
    this.log(`📝 Rapport sauvegardé: ${reportPath}`);
  }

  async run() {
    this.log('🚀 Début du nettoyage legacy');
    
    if (this.dryRun) {
      this.log('🔍 Mode dry-run - aucune modification ne sera effectuée');
    }
    
    try {
      await this.cleanupPythonFiles();
      await this.cleanupConfigFiles();
      await this.cleanupDirectories();
      await this.cleanupDataFiles();
      await this.updateDockerfile();
      await this.updatePackageJson();
      await this.generateReport();
      
      this.log('');
      this.log('✅ Nettoyage terminé avec succès !');
      
      if (!this.dryRun) {
        this.log('');
        this.log('🔄 Prochaines étapes recommandées:');
        this.log('   1. Vérifier que le système fonctionne toujours');
        this.log('   2. Tester les nouveaux scripts npm');
        this.log('   3. Valider le nouveau Dockerfile si créé');
        this.log('   4. Relancer les tests avec `npm run test`');
      }
      
    } catch (error) {
      this.log(`❌ Erreur critique: ${error.message}`);
      throw error;
    }
  }
}

// Point d'entrée
async function main() {
  const cleaner = new LegacyCleanup();
  
  try {
    await cleaner.run();
    process.exit(0);
  } catch (error) {
    console.error('💥 Nettoyage échoué:', error);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main();
}

module.exports = LegacyCleanup; 