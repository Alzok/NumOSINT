FROM python:3.10-slim

# Installer les dépendances système
RUN apt-get update && apt-get install -y \
    git \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Créer un utilisateur non-root avec un UID/GID correspondant à l'hôte
ARG UID=1000
ARG GID=1000
RUN groupadd -g $GID -o turbolehe || true
RUN useradd -m -u $UID -g $GID -s /bin/bash turbolehe

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers requirements
COPY requirements.txt .

# Installer les dépendances Python
RUN pip install --no-cache-dir -r requirements.txt

# Copier le reste de l'application
COPY --chown=turbolehe:turbolehe . .

# Créer les répertoires nécessaires
RUN mkdir -p /app/results /app/logs && \
    chown -R turbolehe:turbolehe /app

# Changer vers l'utilisateur non-root
USER turbolehe

# Exposer les ports
EXPOSE 5000 8000

# Script de démarrage
CMD ["python", "app.py"] 