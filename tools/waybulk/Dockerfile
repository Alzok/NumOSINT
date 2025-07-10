FROM golang:1.21-alpine

# Install waybulk
RUN go install github.com/sham00n/waybulk@latest

# Copy the binary to an accessible path
RUN cp /go/bin/waybulk /usr/local/bin/

# Copy the server source code
COPY server.go .

# Build the server
RUN go build -o /go/bin/server server.go

# Expose the port the server will run on
EXPOSE 8080

# Command to run the server
CMD ["/go/bin/server"]