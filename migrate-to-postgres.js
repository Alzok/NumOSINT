#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Configuration de la base de données
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://numosint:numosint_password@localhost:5433/numosint';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

// Script de migration des données CSV vers PostgreSQL
class CSVMigrator {
  constructor() {
    this.reportDir = path.join(process.cwd(), 'reports');
    this.migrationLog = [];
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    this.migrationLog.push(logMessage);
  }

  async findCSVDirectories() {
    if (!fs.existsSync(this.reportDir)) {
      this.log('❌ Dossier reports/ introuvable');
      return [];
    }

    const directories = [];
    const items = fs.readdirSync(this.reportDir);

    for (const item of items) {
      const itemPath = path.join(this.reportDir, item);
      if (fs.statSync(itemPath).isDirectory()) {
        const csvFiles = fs.readdirSync(itemPath).filter(file => 
          file.startsWith('holehe_') && file.endsWith('.csv')
        );
        
        if (csvFiles.length > 0) {
          directories.push({
            name: item,
            path: itemPath,
            csvFiles: csvFiles
          });
        }
      }
    }

    this.log(`🔍 Trouvé ${directories.length} dossiers avec données CSV`);
    return directories;
  }

  extractNamesFromDirectory(dirName) {
    // Format: "Prénom-Nom" 
    const parts = dirName.split('-');
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join('-') || ''
    };
  }

  extractEmailFromFilename(filename) {
    // Pattern: holehe_TIMESTAMP_EMAIL_results.csv
    const match = filename.match(/holehe_\d+_(.+)_results\.csv/);
    if (match) {
      return match[1].replace(/_/g, '.').replace('%40', '@');
    }
    return null;
  }

  async parseCSVFile(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          // Ne garder que les comptes qui existent
          if (row.exists && row.exists.toLowerCase() === 'true') {
            results.push({
              name: row.name || '',
              domain: row.domain || '',
              method: row.method || '',
              emailrecovery: row.emailrecovery || '',
              phoneNumber: row.phoneNumber || '',
              others: row.others || ''
            });
          }
        })
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  async migrateDirectory(directory) {
    const { firstName, lastName } = this.extractNamesFromDirectory(directory.name);
    
    this.log(`📁 Migration: ${directory.name} (${firstName} ${lastName})`);

    try {
      // Créer l'investigation
      const investigation = await prisma.investigation.create({
        data: {
          status: 'COMPLETED',
          progress: 100,
          currentStep: null,
          inputData: {
            first_name: firstName,
            last_name: lastName,
            migrated: true,
            originalPath: directory.path
          },
          finalReport: {
            migrated: true,
            source: 'CSV files',
            migratedAt: new Date().toISOString()
          }
        }
      });

      let totalAccounts = 0;
      const processedEmails = new Set();

      // Traiter chaque fichier CSV
      for (const csvFile of directory.csvFiles) {
        const email = this.extractEmailFromFilename(csvFile);
        if (!email || processedEmails.has(email)) {
          continue;
        }
        
        processedEmails.add(email);
        const filePath = path.join(directory.path, csvFile);
        
        try {
          const accounts = await this.parseCSVFile(filePath);
          
          if (accounts.length > 0) {
            // Créer l'indicateur email
            const emailIndicator = await prisma.indicator.create({
              data: {
                investigationId: investigation.id,
                type: 'EMAIL',
                value: email,
                source: 'migrated',
                confidence: 1.0,
                verified: true
              }
            });

            // Créer les résultats pour chaque compte trouvé
            for (const account of accounts) {
              await prisma.result.create({
                data: {
                  investigationId: investigation.id,
                  indicatorId: emailIndicator.id,
                  toolSource: 'holehe',
                  data: account,
                  score: 1.0
                }
              });
              totalAccounts++;
            }
          }
        } catch (fileError) {
          this.log(`⚠️  Erreur fichier ${csvFile}: ${fileError.message}`);
        }
      }

      // Créer les indicateurs pour nom/prénom
      if (firstName) {
        await prisma.indicator.create({
          data: {
            investigationId: investigation.id,
            type: 'NAME',
            value: `${firstName} ${lastName}`.trim(),
            source: 'migrated',
            confidence: 1.0,
            verified: true
          }
        });
      }

      // Ajouter log de migration
      await prisma.investigationLog.create({
        data: {
          investigationId: investigation.id,
          step: 'migration',
          message: `Migration completed: ${processedEmails.size} emails, ${totalAccounts} accounts`,
          level: 'INFO'
        }
      });

      this.log(`✅ Migration complétée: ${processedEmails.size} emails, ${totalAccounts} comptes`);
      
      return {
        investigationId: investigation.id,
        emails: processedEmails.size,
        accounts: totalAccounts
      };

    } catch (error) {
      this.log(`❌ Erreur migration ${directory.name}: ${error.message}`);
      throw error;
    }
  }

  async run() {
    this.log('🚀 Début de la migration CSV → PostgreSQL');
    
    try {
      // Vérifier la connexion à la base
      await prisma.$connect();
      this.log('✅ Connexion PostgreSQL établie');

      // Trouver les dossiers CSV
      const directories = await this.findCSVDirectories();
      
      if (directories.length === 0) {
        this.log('ℹ️  Aucune donnée CSV à migrer');
        return;
      }

      let totalMigrated = 0;
      let totalEmails = 0;
      let totalAccounts = 0;

      // Migrer chaque dossier
      for (const directory of directories) {
        try {
          const result = await this.migrateDirectory(directory);
          totalMigrated++;
          totalEmails += result.emails;
          totalAccounts += result.accounts;
        } catch (error) {
          this.log(`❌ Échec migration ${directory.name}: ${error.message}`);
        }
      }

      this.log('');
      this.log('📊 RÉSUMÉ DE LA MIGRATION');
      this.log(`   📁 Dossiers migrés: ${totalMigrated}/${directories.length}`);
      this.log(`   📧 Emails total: ${totalEmails}`);
      this.log(`   👤 Comptes total: ${totalAccounts}`);
      this.log('');
      this.log('✅ Migration terminée avec succès !');

      // Sauvegarder le log de migration
      const logPath = path.join(process.cwd(), 'logs', 'migration.log');
      fs.writeFileSync(logPath, this.migrationLog.join('\n'));
      this.log(`📝 Log sauvegardé: ${logPath}`);

    } catch (error) {
      this.log(`❌ Erreur critique: ${error.message}`);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

// Point d'entrée
async function main() {
  const migrator = new CSVMigrator();
  
  try {
    await migrator.run();
    process.exit(0);
  } catch (error) {
    console.error('💥 Migration échouée:', error);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main();
}

module.exports = CSVMigrator; 