package middleware

import (
	"context"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

// Simple in-memory rate limiter per IP+path.
type rateLimiter struct {
	mu     sync.Mutex
	tokens map[string]int
	last   map[string]time.Time
	limit  int
	window time.Duration
}

func newRateLimiter(limit int, window time.Duration) *rateLimiter {
	return &rateLimiter{
		tokens: make(map[string]int),
		last:   make(map[string]time.Time),
		limit:  limit,
		window: window,
	}
}

func (r *rateLimiter) Allow(key string) bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	now := time.Now()
	last := r.last[key]
	if now.Sub(last) > r.window {
		r.tokens[key] = r.limit
	}
	if r.tokens[key] <= 0 {
		return false
	}
	r.tokens[key]--
	r.last[key] = now
	return true
}

// Redis-backed rate limiter (sliding window with INCR+EXPIRE).
type redisRateLimiter struct {
	client *redis.Client
	limit  int
	window time.Duration
}

func newRedisRateLimiter(client *redis.Client, limit int, window time.Duration) *redisRateLimiter {
	return &redisRateLimiter{client: client, limit: limit, window: window}
}

func (r *redisRateLimiter) Allow(ctx context.Context, key string) bool {
	pipe := r.client.TxPipeline()
	cnt := pipe.Incr(ctx, key)
	pipe.Expire(ctx, key, r.window)
	_, err := pipe.Exec(ctx)
	if err != nil {
		return true // fail-open
	}
	return cnt.Val() <= int64(r.limit)
}

// SecurityMiddleware applies hardening: rate limit, security headers, request size limit, CSP/COOP/COEP.
func SecurityMiddleware(redisClient *redis.Client) gin.HandlerFunc {
	globalRL := newRateLimiter(300, time.Minute) // per IP
	authRL := newRateLimiter(20, time.Minute)    // per IP for auth-like endpoints
	uploadRL := newRateLimiter(30, time.Minute)  // per IP for upload endpoints

	var rGlobal, rAuth, rUpload *redisRateLimiter
	if redisClient != nil {
		rGlobal = newRedisRateLimiter(redisClient, 300, time.Minute)
		rAuth = newRedisRateLimiter(redisClient, 20, time.Minute)
		rUpload = newRedisRateLimiter(redisClient, 30, time.Minute)
	}

	allow := func(ctx context.Context, rl *redisRateLimiter, mem *rateLimiter, key string) bool {
		if rl != nil {
			return rl.Allow(ctx, key)
		}
		return mem.Allow(key)
	}

	return func(c *gin.Context) {
		ip := c.ClientIP()
		path := c.FullPath()
		key := ip + ":" + path
		switch {
		case path == "/auth/login" || path == "/auth/refresh":
			if !allow(c, rAuth, authRL, key) {
				c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"message": "rate limit exceeded"})
				return
			}
		case path == "/v1/activities/upload" || path == "/v1/lpj/upload":
			if !allow(c, rUpload, uploadRL, key) {
				c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"message": "rate limit exceeded"})
				return
			}
		default:
			if !allow(c, rGlobal, globalRL, key) {
				c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"message": "rate limit exceeded"})
				return
			}
		}

		// Limit body size (20MB)
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 20<<20)

		// Security headers
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Referrer-Policy", "no-referrer")
		c.Header("Content-Security-Policy", "default-src 'self'; frame-ancestors 'none'; img-src 'self' data:; object-src 'none'")
		c.Header("Strict-Transport-Security", "max-age=63072000; includeSubDomains")
		c.Header("Cross-Origin-Opener-Policy", "same-origin")
		c.Header("Cross-Origin-Embedder-Policy", "require-corp")
		c.Header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

		c.Next()
	}
}
