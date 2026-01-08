package redis

import (
	"context"

	"github.com/redis/go-redis/v9"
	"simawa-backend/internal/config"
)

func NewClient(cfg *config.RedisEnv) *redis.Client {
	opts := &redis.Options{
		Addr:     cfg.Address,
		Password: cfg.Password,
		DB:       cfg.DB,
	}
	return redis.NewClient(opts)
}

func Ping(ctx context.Context, client *redis.Client) error {
	if client == nil {
		return nil
	}
	return client.Ping(ctx).Err()
}
