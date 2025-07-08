#!/usr/bin/env python3
"""
Script de vérification de santé pour les conteneurs Docker
"""
import sys
import requests

def check_health():
    try:
        response = requests.get('http://localhost:5000/api/health', timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'healthy' and data.get('redis'):
                return 0  # Healthy
        return 1  # Unhealthy
    except Exception as e:
        print(f"Health check failed: {e}")
        return 1  # Unhealthy

if __name__ == '__main__':
    sys.exit(check_health()) 