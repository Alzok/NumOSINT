# Étape 1: Builder l'application et l'outil
FROM golang:1.18-alpine AS builder
WORKDIR /app

# Installer git et cloner waybulk
RUN apk --no-cache add git
RUN git clone https://github.com/sham00n/waybulk.git /app/waybulk_src

# Builder et installer waybulk
WORKDIR /app/waybulk_src
RUN ls -la
RUN go mod init waybulk
RUN go mod tidy
RUN CGO_ENABLED=0 go build -o /usr/local/bin/waybulk .

# Préparer le build du serveur wrapper
WORKDIR /app
COPY go.mod go.sum ./
RUN GOPROXY=direct go mod download
COPY server.go .

# Builder le serveur wrapper
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/server server.go

# Étape 2: Créer l'image finale
FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/

# Copier l'outil et le serveur depuis l'étape de build
COPY --from=builder /usr/local/bin/waybulk /usr/local/bin/waybulk
COPY --from=builder /app/server .

EXPOSE 8080
CMD ["./server"]