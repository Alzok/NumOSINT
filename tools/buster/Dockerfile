# Étape 1: Build du service
FROM golang:1.21-alpine AS service-builder
WORKDIR /app
COPY server.go .
RUN go build -o /buster-service server.go

# Étape 2: Image finale
FROM python:3.9-alpine
WORKDIR /app
RUN apk add --no-cache git
COPY --from=service-builder /buster-service .
RUN git clone https://github.com/sham00n/buster.git /buster
RUN pip install requests colorama argparse dnspython bs4
# Créer un lien symbolique pour que le service go puisse trouver "buster"
RUN ln -s /buster/buster.py /usr/local/bin/buster
EXPOSE 5003
CMD ["./buster-service"]