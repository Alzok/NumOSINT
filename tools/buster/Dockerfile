# Étape 1: Build des artefacts
FROM golang:1.21-alpine AS builder

# Build du service Go
WORKDIR /app
COPY server.go .
RUN go build -o /buster-service server.go

# Préparation de l'outil Python
RUN apk add --no-cache git python3 py3-pip
RUN git clone https://github.com/sham00n/buster.git /buster
RUN python3 -m venv /py
ENV PATH="/py/bin:$PATH"
RUN pip install requests colorama argparse dnspython bs4

# Étape 2: Image finale
FROM python:3.9-alpine
WORKDIR /app

# Créer un utilisateur non-privilégié
RUN addgroup -S app && adduser -S -G app app

# Copier les artefacts depuis le builder
COPY --from=builder /buster-service .
COPY --from=builder /buster /buster
COPY --from=builder /py /py

# Créer un lien symbolique pour que le service go puisse trouver "buster"
RUN ln -s /buster/buster.py /usr/local/bin/buster

# Définir les permissions et l'utilisateur
ENV PATH="/py/bin:$PATH"
RUN chown -R app:app /app /buster /py
USER app

EXPOSE 5003
CMD ["./buster-service"]