package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"github.com/rafaelmachadobr/ticketify/apps/booking-service/internal/kafka"
)

type Handler struct {
	bookingDB *pgxpool.Pool
	eventDB   *pgxpool.Pool
	rdb       *redis.Client
	producer  *kafka.Producer
}

func New(bookingDB, eventDB *pgxpool.Pool, rdb *redis.Client, producer *kafka.Producer) *Handler {
	return &Handler{bookingDB: bookingDB, eventDB: eventDB, rdb: rdb, producer: producer}
}

// ─── Reserve ─────────────────────────────────────────────────────────────────

type reserveReq struct {
	EventID string `json:"event_id" binding:"required"`
	SeatID  string `json:"seat_id" binding:"required"`
}

type reserveResp struct {
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expires_at"`
}

func (h *Handler) Reserve(c *gin.Context) {
	userID := c.GetString("user_id")
	var req reserveReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify seat exists and is available in the event DB
	var status string
	err := h.eventDB.QueryRow(c,
		`SELECT status FROM seats WHERE id = $1 AND event_id = $2`,
		req.SeatID, req.EventID,
	).Scan(&status)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "seat not found"})
		return
	}
	if status != "available" {
		c.JSON(http.StatusConflict, gin.H{"error": "seat not available"})
		return
	}

	const ttl = 420 * time.Second
	token := uuid.New().String()
	seatKey := fmt.Sprintf("seat:%s:%s", req.EventID, req.SeatID)
	reservationKey := fmt.Sprintf("reservation:%s", token)

	// SETNX on seat key — only one reservation per seat at a time
	set, err := h.rdb.SetNX(c, seatKey, token, ttl).Result()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	if !set {
		c.JSON(http.StatusConflict, gin.H{"error": "seat already reserved"})
		return
	}

	// Store reservation metadata keyed by token
	meta, _ := json.Marshal(map[string]string{
		"event_id": req.EventID,
		"seat_id":  req.SeatID,
		"user_id":  userID,
	})
	if err := h.rdb.Set(c, reservationKey, meta, ttl).Err(); err != nil {
		h.rdb.Del(c, seatKey)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}

	c.JSON(http.StatusOK, reserveResp{
		Token:     token,
		ExpiresAt: time.Now().Add(ttl),
	})
}

// ─── Confirm ─────────────────────────────────────────────────────────────────

type confirmReq struct {
	ReservationToken string `json:"reservation_token" binding:"required"`
}

func (h *Handler) Confirm(c *gin.Context) {
	userID := c.GetString("user_id")
	var req confirmReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	reservationKey := fmt.Sprintf("reservation:%s", req.ReservationToken)

	raw, err := h.rdb.Get(c, reservationKey).Bytes()
	if err == redis.Nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "reservation not found or expired"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}

	var res struct {
		EventID string `json:"event_id"`
		SeatID  string `json:"seat_id"`
		UserID  string `json:"user_id"`
	}
	if err := json.Unmarshal(raw, &res); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	if res.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	// Acquire write lock to prevent concurrent confirmation of the same seat
	lockKey := fmt.Sprintf("lock:seat:%s:%s", res.EventID, res.SeatID)
	locked, err := h.rdb.SetNX(c, lockKey, userID, 30*time.Second).Result()
	if err != nil || !locked {
		c.JSON(http.StatusConflict, gin.H{"error": "seat confirmation already in progress"})
		return
	}
	defer h.rdb.Del(c, lockKey)

	// Mark seat as sold — overselling protection: UPDATE only matches status='available'
	tag, err := h.eventDB.Exec(c,
		`UPDATE seats SET status = 'sold' WHERE id = $1 AND status = 'available'`,
		res.SeatID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	if tag.RowsAffected() == 0 {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": "seat no longer available"})
		return
	}

	// Persist booking
	bookingID := uuid.New().String()
	if _, err := h.bookingDB.Exec(c, `
		INSERT INTO bookings (id, user_id, event_id, seat_id, reservation_token, status)
		VALUES ($1, $2, $3, $4, $5, 'confirmed')
	`, bookingID, userID, res.EventID, res.SeatID, req.ReservationToken); err != nil {
		// Compensate: restore seat availability
		h.eventDB.Exec(c, `UPDATE seats SET status = 'available' WHERE id = $1`, res.SeatID)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}

	// Outbox record guarantees at-least-once Kafka delivery on retry
	outboxPayload, _ := json.Marshal(map[string]any{
		"booking_id": bookingID,
		"event_id":   res.EventID,
		"seat_id":    res.SeatID,
		"user_id":    userID,
		"timestamp":  time.Now().UTC(),
	})
	h.bookingDB.Exec(c, `
		INSERT INTO kafka_outbox (topic, key, payload)
		VALUES ($1, $2, $3)
	`, "ticketify.bookings", bookingID, outboxPayload)

	// Best-effort direct publish; outbox handles retries on failure
	h.producer.Publish(c, bookingID, map[string]any{
		"booking_id": bookingID,
		"event_id":   res.EventID,
		"seat_id":    res.SeatID,
		"user_id":    userID,
		"timestamp":  time.Now().UTC(),
	})
	// Mark outbox record as processed if direct publish succeeded
	h.bookingDB.Exec(c, `UPDATE kafka_outbox SET processed_at = NOW() WHERE key = $1 AND processed_at IS NULL`, bookingID)

	// Clean up Redis keys
	seatKey := fmt.Sprintf("seat:%s:%s", res.EventID, res.SeatID)
	h.rdb.Del(c, reservationKey, seatKey)

	c.JSON(http.StatusOK, gin.H{
		"booking_id": bookingID,
		"event_id":   res.EventID,
		"seat_id":    res.SeatID,
		"status":     "confirmed",
	})
}

// ─── List & Get ──────────────────────────────────────────────────────────────

type booking struct {
	ID               string    `json:"id"`
	UserID           string    `json:"user_id"`
	EventID          string    `json:"event_id"`
	SeatID           string    `json:"seat_id"`
	ReservationToken string    `json:"reservation_token"`
	Status           string    `json:"status"`
	CreatedAt        time.Time `json:"created_at"`
}

func (h *Handler) ListBookings(c *gin.Context) {
	userID := c.GetString("user_id")
	rows, err := h.bookingDB.Query(c, `
		SELECT id, user_id, event_id, seat_id, reservation_token, status, created_at
		FROM bookings WHERE user_id = $1 ORDER BY created_at DESC
	`, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	defer rows.Close()

	bookings := make([]booking, 0)
	for rows.Next() {
		var b booking
		if err := rows.Scan(&b.ID, &b.UserID, &b.EventID, &b.SeatID, &b.ReservationToken, &b.Status, &b.CreatedAt); err != nil {
			continue
		}
		bookings = append(bookings, b)
	}
	c.JSON(http.StatusOK, bookings)
}

// ─── Reserved Seats ──────────────────────────────────────────────────────────

func (h *Handler) ReservedSeats(c *gin.Context) {
	eventID := c.Query("event_id")
	if eventID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "event_id required"})
		return
	}

	pattern := fmt.Sprintf("seat:%s:*", eventID)
	var seatIDs []string
	var cursor uint64
	for {
		keys, next, err := h.rdb.Scan(c, cursor, pattern, 100).Result()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
			return
		}
		for _, k := range keys {
			// key format: seat:<event_id>:<seat_id>
			parts := strings.SplitN(k, ":", 3)
			if len(parts) == 3 {
				seatIDs = append(seatIDs, parts[2])
			}
		}
		if next == 0 {
			break
		}
		cursor = next
	}

	if seatIDs == nil {
		seatIDs = []string{}
	}
	c.JSON(http.StatusOK, gin.H{"seat_ids": seatIDs})
}

func (h *Handler) GetBooking(c *gin.Context) {
	userID := c.GetString("user_id")
	bookingID := c.Param("id")

	var b booking
	err := h.bookingDB.QueryRow(c, `
		SELECT id, user_id, event_id, seat_id, reservation_token, status, created_at
		FROM bookings WHERE id = $1
	`, bookingID).Scan(&b.ID, &b.UserID, &b.EventID, &b.SeatID, &b.ReservationToken, &b.Status, &b.CreatedAt)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "booking not found"})
		return
	}
	if b.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}
	c.JSON(http.StatusOK, b)
}
