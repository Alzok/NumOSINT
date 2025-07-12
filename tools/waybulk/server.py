import requests
from flask import Flask, request, jsonify
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

@app.route('/scan', methods=['POST'])
def scan():
    """
    Endpoint to check for a domain's snapshots in the Wayback Machine.
    Expects a JSON payload with a "domain" key.
    """
    data = request.get_json()
    domain = data.get('domain')

    if not domain:
        return jsonify({"error": "Domain is required"}), 400

    app.logger.info(f"Requesting Wayback Machine for domain: {domain}")

    try:
        response = requests.get(f"http://archive.org/wayback/available?url={domain}", timeout=30)
        response.raise_for_status()  # Raise an exception for bad status codes

        wayback_data = response.json()
        
        # Structure de la réponse pour être cohérente avec d'autres outils
        result = {
            "domain": domain,
            "archived_snapshots": wayback_data.get("archived_snapshots", {})
        }

        return jsonify(result)

    except requests.exceptions.RequestException as e:
        app.logger.error(f"Error requesting Wayback Machine for {domain}: {str(e)}")
        return jsonify({
            "error": "Failed to connect to Wayback Machine",
            "details": str(e)
        }), 500
    except Exception as e:
        app.logger.error(f"An unexpected error occurred for {domain}: {str(e)}")
        return jsonify({
            "error": "An unexpected error occurred",
            "details": str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5004)