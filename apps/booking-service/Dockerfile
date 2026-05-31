FROM golang:1.22-alpine AS builder
WORKDIR /app
ENV GOFLAGS=-mod=mod
COPY go.mod ./
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o booking-service ./cmd/server

FROM alpine:3.19
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /app/booking-service .
COPY --from=builder /app/migrations ./migrations
EXPOSE 8020
CMD ["./booking-service"]
