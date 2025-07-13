# SpiderFoot Configuration File
# -----------------------------
# Toutes les clés API sont maintenant configurées via les variables d'environnement
# Configurez vos clés dans le fichier .env à la racine du projet
#
# Les modules SpiderFoot utilisent automatiquement les variables d'environnement
# disponibles avec le préfixe SPIDERFOOT_

import os

__opts__ = {
    'module_opts': {
        # Google Search API
        'sfp_googlesearch': {
            'api_key': os.environ.get('SPIDERFOOT_GOOGLE_API_KEY', ''),
            'cse_id': os.environ.get('SPIDERFOOT_GOOGLE_CSE_ID', '')
        },
        
        # Shodan API
        'sfp_shodan': {
            'api_key': os.environ.get('SPIDERFOOT_SHODAN_API_KEY', '')
        },
        
        # VirusTotal API
        'sfp_virustotal': {
            'api_key': os.environ.get('SPIDERFOOT_VIRUSTOTAL_API_KEY', '')
        },
        
        # Have I Been Pwned (réutilise la même clé que Mosint)
        'sfp_haveibeenpwned': {
            'api_key': os.environ.get('HAVEIBEENPWNED_API_KEY', '')
        },
        
        # Hunter.io (réutilise la même clé que Mosint)
        'sfp_hunter': {
            'api_key': os.environ.get('HUNTER_API_KEY', '')
        }
    }
}