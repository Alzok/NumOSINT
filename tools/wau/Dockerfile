# Étape 1: Builder l'application et l'outil
FROM golang:1.19-alpine AS builder
WORKDIR /app

# Installer l'outil wau
RUN go install -v github.com/alpkeskin/wau@latest

# Préparer le build du serveur wrapper
COPY go.mod .
COPY server.go .

# Télécharger les dépendances et builder
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/server server.go

# Étape 2: Créer l'image finale
FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/

# Copier l'outil et le serveur depuis l'étape de build
COPY --from=builder /go/bin/wau /usr/local/bin/wau
COPY --from=builder /app/server .

EXPOSE 8080
CMD ["./server"]