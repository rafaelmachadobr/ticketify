package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"github.com/rafaelmachadobr/ticketify/apps/booking-service/internal/config"
	"github.com/rafaelmachadobr/ticketify/apps/booking-service/internal/db"
	"github.com/rafaelmachadobr/ticketify/apps/booking-service/internal/handler"
	"github.com/rafaelmachadobr/ticketify/apps/booking-service/internal/kafka"
	"github.com/rafaelmachadobr/ticketify/apps/booking-service/internal/middleware"
	"github.com/rafaelmachadobr/ticketify/apps/booking-service/internal/outbox"
	"github.com/rafaelmachadobr/ticketify/apps/booking-service/internal/telemetry"
)

func main() {
	cfg := config.Load()

	shutdown, err := telemetry.Setup(cfg.OTELEndpoint, cfg.ServiceName)
	if err != nil {
		log.Printf("telemetry setup skipped: %v", err)
	} else {
		defer shutdown()
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	bookingDB, err := pgxpool.New(ctx, cfg.BookingDSN)
	if err != nil {
		log.Fatalf("booking db: %v", err)
	}
	defer bookingDB.Close()

	eventDB, err := pgxpool.New(ctx, cfg.EventDSN)
	if err != nil {
		log.Fatalf("event db: %v", err)
	}
	defer eventDB.Close()

	if err := db.RunMigrations(ctx, bookingDB, "migrations/001_create_schema.sql"); err != nil {
		log.Fatalf("migrations: %v", err)
	}

	opts, err := redis.ParseURL(cfg.RedisURL)
	if err != nil {
		log.Fatalf("redis url: %v", err)
	}
	rdb := redis.NewClient(opts)
	defer rdb.Close()

	producer := kafka.NewProducer(cfg.KafkaBrokers, cfg.KafkaTopicBooking)
	defer producer.Close()

	go outbox.NewProcessor(bookingDB, producer).Run(ctx)

	h := handler.New(bookingDB, eventDB, rdb, producer)

	r := gin.Default()
	r.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"status": "ok"}) })
	r.GET("/bookings/reserved-seats", h.ReservedSeats)

	bookings := r.Group("/bookings", middleware.RequireAuth())
	bookings.POST("/reserve", h.Reserve)
	bookings.POST("/confirm", h.Confirm)
	bookings.GET("", h.ListBookings)
	bookings.GET("/:id", h.GetBooking)

	go func() {
		if err := r.Run(":" + cfg.Port); err != nil {
			log.Fatalf("server: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("shutting down")
}
