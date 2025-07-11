# Utiliser l'image officielle comme base
FROM sundowndev/phoneinfoga:latest

# Installer Go pour compiler notre serveur
RUN apk add --no-cache go

# Copier et compiler notre serveur
WORKDIR /app
COPY server.go .
RUN go build -o /phoneinfoga-service server.go

# Exposer le port et lancer notre serveur
EXPOSE 5005
ENTRYPOINT ["/phoneinfoga-service"]