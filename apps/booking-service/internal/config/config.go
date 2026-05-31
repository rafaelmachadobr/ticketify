package config

import "os"

type Config struct {
	Port              string
	BookingDSN        string
	EventDSN          string
	RedisURL          string
	KafkaBrokers      string
	KafkaTopicBooking string
	OTELEndpoint      string
	ServiceName       string
}

func Load() *Config {
	return &Config{
		Port:              getEnv("PORT", "8020"),
		BookingDSN:        mustEnv("BOOKING_DB_URL"),
		EventDSN:          mustEnv("EVENT_DB_URL"),
		RedisURL:          getEnv("REDIS_URL", "redis://redis:6379"),
		KafkaBrokers:      getEnv("KAFKA_BROKERS", "kafka:29092"),
		KafkaTopicBooking: getEnv("KAFKA_TOPIC_BOOKING", "ticketify.bookings"),
		OTELEndpoint:      getEnv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://jaeger:4318"),
		ServiceName:       getEnv("OTEL_SERVICE_NAME", "booking-service"),
	}
}

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func mustEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		panic("required env var not set: " + key)
	}
	return v
}
