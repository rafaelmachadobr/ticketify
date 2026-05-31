CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS bookings (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID         NOT NULL,
    event_id         UUID         NOT NULL,
    seat_id          UUID         NOT NULL,
    reservation_token VARCHAR(255) NOT NULL,
    status           VARCHAR(20)  NOT NULL DEFAULT 'confirmed',
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Prevents two confirmed bookings for the same seat
CREATE UNIQUE INDEX IF NOT EXISTS bookings_seat_id_idx ON bookings(seat_id);

CREATE TABLE IF NOT EXISTS kafka_outbox (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    topic        VARCHAR(100) NOT NULL,
    key          VARCHAR(255),
    payload      JSONB        NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    attempts     INTEGER      NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS kafka_outbox_pending_idx
    ON kafka_outbox(created_at) WHERE processed_at IS NULL;
