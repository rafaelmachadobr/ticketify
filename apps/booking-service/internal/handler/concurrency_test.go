//go:build integration

package handler_test

import (
	"context"
	"fmt"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/redis/go-redis/v9"
)

// TestConcurrentReserveSameSeat verifies that SETNX guarantees exactly one
// successful reservation when 100 goroutines race for the same seat.
//
// Run with: go test -tags=integration -run TestConcurrentReserveSameSeat ./internal/handler/
// Requires: Redis reachable at REDIS_URL (default: redis://localhost:6379)
func TestConcurrentReserveSameSeat(t *testing.T) {
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{Addr: "localhost:6379"})
	defer rdb.Close()

	if err := rdb.Ping(ctx).Err(); err != nil {
		t.Skipf("redis not available: %v", err)
	}

	eventID := "test-event-" + fmt.Sprintf("%d", time.Now().UnixNano())
	seatID := "test-seat-001"
	seatKey := fmt.Sprintf("seat:%s:%s", eventID, seatID)

	// Clean up before and after
	rdb.Del(ctx, seatKey)
	defer rdb.Del(ctx, seatKey)

	const goroutines = 100
	var (
		wg       sync.WaitGroup
		successes atomic.Int32
		ready    = make(chan struct{})
	)

	for i := 0; i < goroutines; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			<-ready // start simultaneously

			token := fmt.Sprintf("token-%d", id)
			set, err := rdb.SetNX(ctx, seatKey, token, 420*time.Second).Result()
			if err != nil {
				t.Errorf("goroutine %d: redis error: %v", id, err)
				return
			}
			if set {
				successes.Add(1)
			}
		}(i)
	}

	close(ready)
	wg.Wait()

	if got := successes.Load(); got != 1 {
		t.Errorf("expected exactly 1 successful reservation, got %d", got)
	}
}
