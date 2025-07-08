#!/usr/bin/env python3
import os
import csv
import json
import re
from pathlib import Path

class NumOsintParser:
    def __init__(self):
        self.results = []
        self.base_dirs = []
        
    def find_result_directories(self):
        """Trouve tous les répertoires contenant des résultats CSV"""
        # Chercher d'abord dans le dossier reports
        reports_dir = Path('reports')
        if reports_dir.exists():
            for item in reports_dir.iterdir():
                if item.is_dir():
                    # Vérifier si le répertoire contient des fichiers CSV Holehe
                    csv_files = list(item.glob('holehe_*@*.csv'))
                    if csv_files:
                        self.base_dirs.append(item)
                        print(f"Trouvé répertoire de résultats: reports/{item.name}")
        
        # Chercher aussi dans le répertoire courant pour la compatibilité
        current_dir = Path('.')
        for item in current_dir.iterdir():
            if item.is_dir() and not item.name.startswith('.') and item.name != 'reports':
                # Vérifier si le répertoire contient des fichiers CSV Holehe
                csv_files = list(item.glob('holehe_*@*.csv'))
                if csv_files:
                    self.base_dirs.append(item)
                    print(f"Trouvé répertoire de résultats: {item.name}")
    
    def extract_email_from_filename(self, filename):
        """Extrait l'adresse email du nom de fichier"""
        # Pattern: holehe_TIMESTAMP_EMAIL_results.csv
        match = re.search(r'holehe_\d+_(.+)_results\.csv', filename)
        if match:
            return match.group(1).replace('_', ' ').replace('%40', '@')
        return None
    
    def parse_csv_file(self, csv_path):
        """Parse un fichier CSV et retourne les comptes trouvés"""
        accounts = []
        
        try:
            with open(csv_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    # Vérifier si le compte existe (exists = True)
                    if row.get('exists', '').strip().lower() == 'true':
                        account = {
                            'name': row.get('name', '').strip(),
                            'domain': row.get('domain', '').strip(),
                            'method': row.get('method', '').strip(),
                            'exists': True,
                            'emailrecovery': row.get('emailrecovery', '').strip(),
                            'phoneNumber': row.get('phoneNumber', '').strip(),
                            'others': row.get('others', '').strip()
                        }
                        accounts.append(account)
        except Exception as e:
            print(f"Erreur lors de la lecture de {csv_path}: {e}")
        
        return accounts
    
    def process_all_files(self):
        """Traite tous les fichiers CSV trouvés"""
        self.find_result_directories()
        
        email_accounts = {}
        
        for base_dir in self.base_dirs:
            print(f"\nTraitement du répertoire: {base_dir.name}")
            
            # Trouver tous les fichiers CSV de résultats
            csv_files = list(base_dir.glob('holehe_*@*.csv'))
            
            for csv_file in csv_files:
                print(f"  Traitement: {csv_file.name}")
                
                # Extraire l'email du nom de fichier
                email = self.extract_email_from_filename(csv_file.name)
                if not email:
                    print(f"    ⚠️  Impossible d'extraire l'email de {csv_file.name}")
                    continue
                
                # Parser le fichier CSV
                accounts = self.parse_csv_file(csv_file)
                
                if accounts:
                    if email in email_accounts:
                        # Fusionner les comptes (éviter les doublons)
                        existing_platforms = {acc['name'] for acc in email_accounts[email]}
                        for account in accounts:
                            if account['name'] not in existing_platforms:
                                email_accounts[email].append(account)
                    else:
                        email_accounts[email] = accounts
                    
                    print(f"    ✓ {len(accounts)} compte(s) trouvé(s) pour {email}")
                else:
                    print(f"    ➖ Aucun compte trouvé pour {email}")
        
        # Convertir en format final
        for email, accounts in email_accounts.items():
            self.results.append({
                'email': email,
                'accounts': accounts
            })
    
    def generate_stats(self):
        """Génère des statistiques sur les résultats"""
        total_emails = len(self.results)
        total_accounts = sum(len(group['accounts']) for group in self.results)
        
        # Compter les plateformes uniques
        all_platforms = set()
        platform_counts = {}
        category_counts = {}
        
        # Catégories simplifiées pour les statistiques
        platform_categories = {
            'amazon': 'E-commerce', 'ebay': 'E-commerce', 'venmo': 'E-commerce',
            'twitter': 'Réseaux sociaux', 'instagram': 'Réseaux sociaux', 'facebook': 'Réseaux sociaux',
            'linkedin': 'Réseaux sociaux', 'snapchat': 'Réseaux sociaux', 'discord': 'Réseaux sociaux',
            'pinterest': 'Réseaux sociaux', 'tumblr': 'Réseaux sociaux', 'myspace': 'Réseaux sociaux',
            'github': 'Développement', 'gitlab': 'Développement', 'bitbucket': 'Développement',
            'codepen': 'Développement', 'replit': 'Développement', 'stackoverflow': 'Développement',
            'wordpress': 'Développement', 'firefox': 'Développement',
            'spotify': 'Divertissement', 'youtube': 'Divertissement', 'soundcloud': 'Divertissement',
            'twitch': 'Divertissement', 'steam': 'Divertissement', 'netflix': 'Divertissement',
            'komoot': 'Divertissement', 'strava': 'Divertissement', 'lastfm': 'Divertissement',
            'pornhub': 'Divertissement', 'xvideos': 'Divertissement',
            'slack': 'Professionnel', 'zoom': 'Professionnel', 'teams': 'Professionnel',
            'office365': 'Professionnel', 'google': 'Professionnel', 'evernote': 'Professionnel',
            'hubspot': 'Professionnel', 'eventbrite': 'Professionnel',
            'gravatar': 'Autres', 'firefox': 'Autres'
        }
        
        for group in self.results:
            for account in group['accounts']:
                platform = account['name'].lower()
                all_platforms.add(platform)
                
                platform_counts[platform] = platform_counts.get(platform, 0) + 1
                
                category = platform_categories.get(platform, 'Autres')
                category_counts[category] = category_counts.get(category, 0) + 1
        
        return {
            'total_emails': total_emails,
            'total_accounts': total_accounts,
            'total_platforms': len(all_platforms),
            'platform_counts': platform_counts,
            'category_counts': category_counts,
            'top_platforms': sorted(platform_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        }
    
    def save_to_json(self, filename='data.json'):
        """Sauvegarde les résultats en JSON"""
        stats = self.generate_stats()
        
        output = {
            'stats': stats,
            'results': self.results,
            'generated_at': str(Path().absolute()),
            'total_files_processed': sum(len(list(dir.glob('holehe_*@*.csv'))) for dir in self.base_dirs)
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ Données sauvegardées dans {filename}")
        return output
    
    def print_summary(self):
        """Affiche un résumé des résultats"""
        stats = self.generate_stats()
        
        print("\n" + "="*60)
        print("📊 RÉSUMÉ DES RÉSULTATS NUMOSINT")
        print("="*60)
        print(f"📧 Emails testés: {stats['total_emails']}")
        print(f"✅ Comptes trouvés: {stats['total_accounts']}")
        print(f"🌐 Plateformes uniques: {stats['total_platforms']}")
        
        print(f"\n📈 Top 10 des plateformes:")
        for platform, count in stats['top_platforms']:
            print(f"  • {platform}: {count} compte(s)")
        
        print(f"\n📊 Répartition par catégorie:")
        for category, count in stats['category_counts'].items():
            print(f"  • {category}: {count} compte(s)")
        
        print(f"\n📋 Détail par email:")
        for group in self.results:
            print(f"  📧 {group['email']}: {len(group['accounts'])} compte(s)")
            for account in group['accounts'][:3]:  # Afficher les 3 premiers
                print(f"    ✓ {account['name']} ({account['domain']})")
            if len(group['accounts']) > 3:
                print(f"    ... et {len(group['accounts']) - 3} autres")

def main():
    print("🔍 NumOSINT CSV Parser")
    print("Recherche et analyse des fichiers CSV...")
    
    parser = NumOsintParser()
    parser.process_all_files()
    
    if parser.results:
        parser.print_summary()
        data = parser.save_to_json()
        
        print(f"\n🚀 Interface web disponible:")
        print(f"   Ouvrez index.html dans votre navigateur")
        print(f"   Les données seront chargées automatiquement depuis data.json")
    else:
        print("\n❌ Aucun résultat trouvé!")
        print("Assurez-vous que les fichiers CSV sont dans des répertoires avec des noms appropriés.")

if __name__ == "__main__":
    main() 