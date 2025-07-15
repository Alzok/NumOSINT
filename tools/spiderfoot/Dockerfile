# Étape 1: Build des artefacts
FROM golang:1.21-alpine AS builder

# Build du service Go
WORKDIR /app
COPY server.go .
RUN go build -o /spiderfoot-service server.go

# Préparation de SpiderFoot
FROM python:3.9-slim AS spiderfoot_builder

RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*
# Configurer git pour les gros dépôts et cloner de manière superficielle pour plus de robustesse
RUN git config --global http.postBuffer 524288000
RUN git clone --depth 1 https://github.com/smicallef/spiderfoot.git /spiderfoot
RUN python3 -m venv /py
ENV PATH="/py/bin:$PATH"
RUN pip install -r /spiderfoot/requirements.txt

# Étape 2: Image finale
FROM python:3.9-slim
WORKDIR /app

# Créer un utilisateur non-privilégié
RUN addgroup --system app && adduser --system --ingroup app app

# Copier les artefacts depuis les builders
COPY --from=builder /spiderfoot-service .
COPY --from=spiderfoot_builder /spiderfoot /spiderfoot
COPY --from=spiderfoot_builder /py /py

# Créer un lien symbolique et définir les permissions
RUN ln -s /spiderfoot/sf.py /usr/local/bin/spiderfoot
ENV PATH="/py/bin:$PATH"
RUN chown -R app:app /app /spiderfoot /py
USER app

# Exposer le port et lancer notre serveur
EXPOSE 5006
CMD ["./spiderfoot-service"]