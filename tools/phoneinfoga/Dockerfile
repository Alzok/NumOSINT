# Étape 1: Build des artefacts
FROM golang:1.21-alpine AS builder

# Build du service Go
WORKDIR /app
COPY server.go .
RUN go build -o /phoneinfoga-service server.go

# Installation de l'outil PhoneInfoga
RUN apk add --no-cache curl bash coreutils
RUN curl -sSL https://raw.githubusercontent.com/sundowndev/phoneinfoga/master/support/scripts/install | bash && \
    install ./phoneinfoga /usr/local/bin/phoneinfoga

# Étape 2: Image finale
FROM alpine:latest

WORKDIR /app

# Créer un utilisateur non-privilégié
RUN addgroup -S app && adduser -S -G app app

# Copier les binaires depuis le builder
COPY --from=builder /phoneinfoga-service .
COPY --from=builder /usr/local/bin/phoneinfoga /usr/local/bin/phoneinfoga

# Définir les permissions et l'utilisateur
RUN chown -R app:app /app
USER app

# Exposer le port et lancer notre serveur
EXPOSE 5005
CMD ["./phoneinfoga-service"]