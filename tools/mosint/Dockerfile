# Étape 1: Build de notre serveur
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY server.go .
RUN go build -o /mosint-service server.go

# Étape 2: Build de l'outil
FROM golang:1.21-alpine AS tool_builder

WORKDIR /app
RUN apk update && apk add --no-cache git
RUN go install -v github.com/alpkeskin/mosint/v3/cmd/mosint@latest

# Étape 3: Image finale
FROM alpine:latest

WORKDIR /app

# Créer un utilisateur non-privilégié
RUN addgroup -S app && adduser -S -G app app

# Copier notre serveur compilé
COPY --from=builder /mosint-service .
# Copier l'outil compilé
COPY --from=tool_builder /go/bin/mosint /usr/local/bin/mosint

# Copier le fichier de configuration pour l'utilisateur 'app'
COPY --chown=app:app config.yaml /home/app/.mosint.yaml

# Définir les permissions et l'utilisateur
RUN chown -R app:app /app
USER app

EXPOSE 5004
CMD ["./mosint-service"]