# Étape 1: Build du service Go
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY server.go .
RUN go build -o /spiderfoot-service server.go

# Étape 2: Image finale avec installation de SpiderFoot
FROM python:3.9-slim

# Installer les dépendances système
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Cloner le dépôt de SpiderFoot
RUN git clone https://github.com/smicallef/spiderfoot.git /spiderfoot

# Installer les dépendances Python
RUN pip install -r /spiderfoot/requirements.txt

# Créer un lien symbolique pour un accès facile
RUN ln -s /spiderfoot/sf.py /usr/local/bin/spiderfoot

# Copier notre serveur compilé
COPY --from=builder /spiderfoot-service .

# Exposer le port et lancer notre serveur
EXPOSE 5006
CMD ["./spiderfoot-service"]