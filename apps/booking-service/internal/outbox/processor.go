package outbox

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rafaelmachadobr/ticketify/apps/booking-service/internal/kafka"
)

type Processor struct {
	db       *pgxpool.Pool
	producer *kafka.Producer
}

func NewProcessor(db *pgxpool.Pool, producer *kafka.Producer) *Processor {
	return &Processor{db: db, producer: producer}
}

func (p *Processor) Run(ctx context.Context) {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			p.process(ctx)
		}
	}
}

func (p *Processor) process(ctx context.Context) {
	rows, err := p.db.Query(ctx, `
		SELECT id, topic, key, payload FROM kafka_outbox
		WHERE processed_at IS NULL AND attempts < 5
		ORDER BY created_at LIMIT 10
	`)
	if err != nil {
		log.Printf("outbox query: %v", err)
		return
	}
	defer rows.Close()

	type record struct {
		id      string
		topic   string
		key     string
		payload json.RawMessage
	}

	var records []record
	for rows.Next() {
		var r record
		if err := rows.Scan(&r.id, &r.topic, &r.key, &r.payload); err != nil {
			log.Printf("outbox scan: %v", err)
			continue
		}
		records = append(records, r)
	}
	rows.Close()

	for _, r := range records {
		var payload any
		if err := json.Unmarshal(r.payload, &payload); err != nil {
			log.Printf("outbox unmarshal %s: %v", r.id, err)
			continue
		}
		if err := p.producer.Publish(ctx, r.key, payload); err != nil {
			log.Printf("outbox publish %s: %v", r.id, err)
			p.db.Exec(ctx, `UPDATE kafka_outbox SET attempts = attempts + 1 WHERE id = $1`, r.id)
			continue
		}
		p.db.Exec(ctx, `UPDATE kafka_outbox SET processed_at = NOW() WHERE id = $1`, r.id)
	}
}
