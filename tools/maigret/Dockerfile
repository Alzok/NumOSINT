# Utiliser l'image officielle de Maigret comme base
FROM soxoj/maigret:latest

# Définir le répertoire de travail
WORKDIR /app

# Installer une version de pip compatible, puis maigret et Flask
RUN pip install --no-cache-dir "pip<24.1"
RUN pip install --no-cache-dir maigret==0.4.4 Flask==3.0.3

# Copier le code de notre serveur
COPY server.py .

# Exposer le port et lancer notre serveur
EXPOSE 5002
CMD ["python", "server.py"]