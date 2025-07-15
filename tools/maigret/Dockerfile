# Utiliser l'image officielle de Maigret comme base
FROM soxoj/maigret:latest

# Créer un utilisateur et un groupe non-root
RUN addgroup --system app && adduser --system --group app

# Définir le répertoire de travail
WORKDIR /app

# Installer uniquement Flask
RUN pip install --no-cache-dir Flask==3.0.3

# Copier le code de notre serveur
COPY server.py .

# Donner la permission à l'utilisateur 'app' de modifier la base de données de sites de Maigret
RUN chown app:app /usr/local/lib/python3.10/site-packages/maigret/resources/data.json

# Changer les permissions et l'utilisateur pour le répertoire de l'application
RUN chown -R app:app /app
USER app

# Exposer le port et lancer notre serveur
EXPOSE 5002
CMD ["python", "server.py"]