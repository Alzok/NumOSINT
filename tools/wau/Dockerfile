FROM golang:1.21-alpine

# Install wau tool and make it available in the path
RUN go install github.com/alpkeskin/wau@latest && \
    cp /go/bin/wau /usr/local/bin/

WORKDIR /app

# Copy source code
COPY server.go .

# Build the server
RUN go build -o server .

EXPOSE 8080

CMD ["/app/server"]