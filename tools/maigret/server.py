import subprocess
import json
import tempfile
import os
from flask import Flask, request, jsonify

app = Flask(__name__)

# Créer le répertoire de données s'il n'existe pas
DATA_DIR = "/app/data"
DB_PATH = os.path.join(DATA_DIR, "maigret_db.json")
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

@app.route('/scan', methods=['POST'])
def scan():
    """
    Endpoint to scan a username with Maigret.
    Expects a JSON payload with a "username" key.
    Can also accept a "tags" key to filter by site tags.
    """
    data = request.get_json()
    username = data.get('username')
    tags = data.get('tags', 'all')

    if not username:
        return jsonify({"error": "Username is required"}), 400

    # Maigret écrit la sortie dans un fichier, nous créons donc un fichier temporaire
    with tempfile.NamedTemporaryFile(mode='w+', delete=False, suffix='.json') as tmp_file:
        output_filename = tmp_file.name

    try:
        # Construire la commande Maigret
        command = [
            "maigret",
            "--db", DB_PATH,
            "--json-file", output_filename,
            "--tags", tags,
            username
        ]

        # Exécuter la commande
        process = subprocess.run(
            command,
            capture_output=True,
            text=True,
            check=True  # Lève une exception si la commande échoue
        )

        # Lire les résultats depuis le fichier de sortie
        with open(output_filename, 'r') as f:
            results = json.load(f)
        
        return jsonify(results)

    except subprocess.CalledProcessError as e:
        # Si Maigret retourne un code d'erreur
        error_message = e.stderr or e.stdout or "Unknown error during Maigret execution"
        app.logger.error(f"Maigret execution failed for {username} with tags {tags}: {error_message}")
        return jsonify({
            "error": "Maigret execution failed",
            "details": error_message
        }), 500
    except Exception as e:
        # Pour toute autre erreur
        app.logger.error(f"An unexpected error occurred for {username} with tags {tags}: {str(e)}")
        return jsonify({
            "error": "An unexpected error occurred",
            "details": str(e)
        }), 500
    finally:
        # S'assurer que le fichier temporaire est supprimé
        if os.path.exists(output_filename):
            os.remove(output_filename)

@app.route('/recursive-search', methods=['POST'])
def recursive_search():
    """
    Endpoint to perform a recursive username search with Maigret.
    Expects a JSON payload with a "username" key.
    """
    data = request.get_json()
    username = data.get('username')

    if not username:
        return jsonify({"error": "Username is required"}), 400

    with tempfile.NamedTemporaryFile(mode='w+', delete=False, suffix='.json') as tmp_file:
        output_filename = tmp_file.name

    try:
        command = [
            "maigret",
            "--db", DB_PATH,
            "--json-file", output_filename,
            "--recursive",
            username
        ]

        process = subprocess.run(
            command,
            capture_output=True,
            text=True,
            check=True
        )

        with open(output_filename, 'r') as f:
            results = json.load(f)
        
        return jsonify(results)

    except subprocess.CalledProcessError as e:
        error_message = e.stderr or e.stdout or "Unknown error during Maigret execution"
        app.logger.error(f"Maigret recursive execution failed for {username}: {error_message}")
        return jsonify({
            "error": "Maigret recursive execution failed",
            "details": error_message
        }), 500
    except Exception as e:
        app.logger.error(f"An unexpected error occurred during recursive search for {username}: {str(e)}")
        return jsonify({
            "error": "An unexpected error occurred",
            "details": str(e)
        }), 500
    finally:
        if os.path.exists(output_filename):
            os.remove(output_filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002)