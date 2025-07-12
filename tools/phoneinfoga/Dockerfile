# Étape 1: Build du service Go
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY server.go .
RUN go build -o /phoneinfoga-service server.go

# Étape 2: Image finale avec installation propre de l'outil
FROM alpine:latest

# Installer les dépendances :
# - coreutils: pour avoir la version complète de sha256sum
# - curl: pour télécharger le script
# - bash: pour exécuter le script
RUN apk add --no-cache coreutils curl bash

WORKDIR /app

# Utiliser le script d'installation officiel de PhoneInfoga
# et l'installer globalement
RUN curl -sSL https://raw.githubusercontent.com/sundowndev/phoneinfoga/master/support/scripts/install | bash && \
    install ./phoneinfoga /usr/local/bin/phoneinfoga

# Copier notre serveur compilé depuis l'étape de build
COPY --from=builder /phoneinfoga-service .

# Exposer le port et lancer notre serveur
EXPOSE 5005
CMD ["./phoneinfoga-service"]