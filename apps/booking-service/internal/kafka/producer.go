package kafka

import (
	"context"
	"encoding/json"

	kafkago "github.com/segmentio/kafka-go"
)

type Producer struct {
	writer *kafkago.Writer
}

func NewProducer(brokers, topic string) *Producer {
	w := &kafkago.Writer{
		Addr:     kafkago.TCP(brokers),
		Topic:    topic,
		Balancer: &kafkago.LeastBytes{},
	}
	return &Producer{writer: w}
}

func (p *Producer) Publish(ctx context.Context, key string, payload any) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	return p.writer.WriteMessages(ctx, kafkago.Message{
		Key:   []byte(key),
		Value: body,
	})
}

func (p *Producer) Close() error {
	return p.writer.Close()
}
