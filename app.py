#!/usr/bin/env python3
import os
import json
import subprocess
import logging
from datetime import datetime
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from celery import Celery
import redis
from parse_csv import NumOsintParser

# Configuration
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key')
app.config['CELERY_BROKER_URL'] = os.environ.get('REDIS_URL', 'redis://localhost:6379')
app.config['CELERY_RESULT_BACKEND'] = os.environ.get('REDIS_URL', 'redis://localhost:6379')

# Activer CORS
CORS(app, origins=['http://localhost:8080', 'http://localhost:3000'])

# Configuration Celery
celery = Celery(app.name, broker=app.config['CELERY_BROKER_URL'])
celery.conf.update(app.config)

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/numosint.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Redis pour stocker l'état des recherches
redis_client = redis.from_url(app.config['CELERY_BROKER_URL'])

# Répertoires
RESULTS_DIR = Path('results')
RESULTS_DIR.mkdir(exist_ok=True)

@celery.task(bind=True)
def run_search(self, first_name, last_name, domain_filter=None):
    """Tâche Celery pour exécuter une recherche NumOSINT"""
    task_id = self.request.id
    
    try:
        # Mettre à jour le statut
        redis_client.hset(f"task:{task_id}", mapping={
            'status': 'running',
            'started_at': datetime.utcnow().isoformat(),
            'first_name': first_name,
            'last_name': last_name,
            'domain_filter': domain_filter or ''
        })
        
        # Construire la commande
        cmd = ['python3', 'numosint_search.py', first_name, last_name]
        if domain_filter:
            cmd.append('-B')
        
        logger.info(f"Exécution de la commande: {' '.join(cmd)}")
        
        # Exécuter la commande
        if domain_filter:
            # Pour le filtre de domaine, on doit fournir l'entrée
            process = subprocess.Popen(
                cmd,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            stdout, stderr = process.communicate(input=f"{domain_filter}\n")
        else:
            process = subprocess.run(
                cmd,
                capture_output=True,
                text=True
            )
            stdout = process.stdout
            stderr = process.stderr
        
        # Parser les résultats
        parser = NumOsintParser()
        parser.process_all_files()
        
        # Sauvegarder les résultats
        results_file = f"results/search_{task_id}.json"
        data = parser.save_to_json(results_file)
        
        # Mettre à jour le statut final
        redis_client.hset(f"task:{task_id}", mapping={
            'status': 'completed',
            'completed_at': datetime.utcnow().isoformat(),
            'results_file': results_file,
            'total_emails': str(data['stats']['total_emails']),
            'total_accounts': str(data['stats']['total_accounts'])
        })
        
        # Mettre à jour le fichier data.json principal
        parser.save_to_json('data.json')
        
        return {
            'status': 'success',
            'task_id': task_id,
            'results': data['stats']
        }
        
    except Exception as e:
        logger.error(f"Erreur dans la tâche {task_id}: {str(e)}")
        redis_client.hset(f"task:{task_id}", mapping={
            'status': 'failed',
            'error': str(e),
            'failed_at': datetime.utcnow().isoformat()
        })
        raise

# Routes API
@app.route('/api/search', methods=['POST'])
def start_search():
    """Démarrer une nouvelle recherche"""
    data = request.json
    
    # Validation des données
    first_name = data.get('first_name', '').strip()
    last_name = data.get('last_name', '').strip()
    domain_filter = data.get('domain_filter', '').strip()
    
    if not first_name or not last_name:
        return jsonify({
            'error': 'Le prénom et le nom sont requis'
        }), 400
    
    # Lancer la tâche asynchrone
    task = run_search.apply_async(
        args=[first_name, last_name, domain_filter]
    )
    
    logger.info(f"Nouvelle recherche lancée: {task.id} - {first_name} {last_name}")
    
    return jsonify({
        'task_id': task.id,
        'status': 'started',
        'message': f'Recherche lancée pour {first_name} {last_name}'
    })

@app.route('/api/search/<task_id>', methods=['GET'])
def get_search_status(task_id):
    """Obtenir le statut d'une recherche"""
    task_data = redis_client.hgetall(f"task:{task_id}")
    
    if not task_data:
        return jsonify({'error': 'Tâche non trouvée'}), 404
    
    # Convertir les bytes en strings
    result = {
        k.decode('utf-8'): v.decode('utf-8') 
        for k, v in task_data.items()
    }
    
    return jsonify(result)

@app.route('/api/results', methods=['GET'])
def get_all_results():
    """Obtenir tous les résultats consolidés"""
    try:
        with open('data.json', 'r') as f:
            data = json.load(f)
        return jsonify(data)
    except FileNotFoundError:
        return jsonify({
            'results': [],
            'stats': {
                'total_emails': 0,
                'total_accounts': 0,
                'total_platforms': 0
            }
        })

@app.route('/api/results/<filename>', methods=['GET'])
def get_specific_results(filename):
    """Obtenir les résultats d'une recherche spécifique"""
    safe_filename = Path(filename).name
    file_path = RESULTS_DIR / safe_filename
    
    if not file_path.exists():
        return jsonify({'error': 'Fichier non trouvé'}), 404
    
    with open(file_path, 'r') as f:
        data = json.load(f)
    
    return jsonify(data)

@app.route('/api/searches', methods=['GET'])
def list_searches():
    """Lister toutes les recherches"""
    try:
        searches = []
        
        # Récupérer les recherches existantes depuis le dossier reports/
        reports_dir = Path('reports')
        
        if reports_dir.exists():
            for folder in reports_dir.iterdir():
                if folder.is_dir():
                    # Extraire le prénom et nom du dossier
                    folder_name = folder.name
                    if '-' in folder_name:
                        first_name, last_name = folder_name.split('-', 1)
                    else:
                        first_name, last_name = folder_name, ''
                    
                    # Compter les fichiers CSV
                    csv_files = list(folder.glob('*.csv'))
                    main_csv = folder / 'main.csv'
                    
                    # Obtenir la date de modification du dossier
                    folder_stat = folder.stat()
                    created_at = datetime.fromtimestamp(folder_stat.st_mtime).isoformat()
                    
                    search_data = {
                        'task_id': f'existing_{folder_name}',
                        'status': 'completed',
                        'first_name': first_name,
                        'last_name': last_name,
                        'started_at': created_at,
                        'completed_at': created_at,
                        'total_files': len(csv_files),
                        'has_main_csv': main_csv.exists(),
                        'source': 'existing'
                    }
                    searches.append(search_data)
        
        # Trier par date de création
        searches.sort(key=lambda x: x.get('started_at', ''), reverse=True)
        
        return jsonify(searches)
        
    except Exception as e:
        logger.error(f"Erreur dans list_searches: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/parse', methods=['POST'])
def parse_csv_files():
    """Reparser tous les fichiers CSV"""
    try:
        parser = NumOsintParser()
        parser.process_all_files()
        data = parser.save_to_json('data.json')
        
        return jsonify({
            'status': 'success',
            'stats': data['stats']
        })
    except Exception as e:
        logger.error(f"Erreur lors du parsing: {str(e)}")
        return jsonify({
            'error': str(e)
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Vérification de santé de l'API"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'redis': redis_client.ping()
    })

@app.route('/api/debug', methods=['GET'])
def debug_reports():
    """Debug des dossiers reports"""
    try:
        reports_dir = Path('reports')
        result = {
            'reports_exists': reports_dir.exists(),
            'folders': []
        }
        
        if reports_dir.exists():
            for folder in reports_dir.iterdir():
                if folder.is_dir():
                    csv_files = list(folder.glob('*.csv'))
                    result['folders'].append({
                        'name': folder.name,
                        'csv_count': len(csv_files)
                    })
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)})

# Les routes pour servir les fichiers statiques de l'ancienne interface sont désactivées
# pour ne laisser que la nouvelle interface Next.js.
# @app.route('/')
# def index():
#     return send_from_directory('.', 'index.html')
#
# @app.route('/<path:path>')
# def serve_static(path):
#     return send_from_directory('.', path)

if __name__ == '__main__':
    # Créer le répertoire de logs s'il n'existe pas
    Path('logs').mkdir(exist_ok=True)
    
    # Démarrer l'application
    app.run(host='0.0.0.0', port=5000, debug=True) 