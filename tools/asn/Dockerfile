# Étape 1: Builder l'application
FROM golang:1.21-alpine AS builder
WORKDIR /app

# Installer git
RUN apk --no-cache add git

# Copier le code source et les dépendances
COPY go.mod go.sum ./
COPY server.go .

# Télécharger les dépendances et builder
RUN GOPROXY=direct go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Étape 2: Créer l'image finale
FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/main .
EXPOSE 5008
CMD ["./main"]