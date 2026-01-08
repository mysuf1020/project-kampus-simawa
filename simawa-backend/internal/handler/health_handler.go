package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/minio/minio-go/v7"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type HealthHandler struct {
	Start  time.Time
	DB     *gorm.DB
	Redis  *redis.Client
	Minio  *minio.Client
	Counts func() map[string]int64
}

func NewHealthHandler(start time.Time, db *gorm.DB, r *redis.Client, m *minio.Client, counts func() map[string]int64) *HealthHandler {
	return &HealthHandler{
		Start:  start,
		DB:     db,
		Redis:  r,
		Minio:  m,
		Counts: counts,
	}
}

func (h *HealthHandler) Health(c *gin.Context) {
	uptime := time.Since(h.Start).Seconds()
	dbOK := true
	if h.DB != nil {
		if err := h.DB.Exec("SELECT 1").Error; err != nil {
			dbOK = false
		}
	}
	redisOK := true
	if h.Redis != nil {
		if err := h.Redis.Ping(c.Request.Context()).Err(); err != nil {
			redisOK = false
		}
	}
	minioOK := true
	if h.Minio != nil {
		if _, err := h.Minio.ListBuckets(c.Request.Context()); err != nil {
			minioOK = false
		}
	}
	counts := map[string]int64{}
	if h.Counts != nil {
		counts = h.Counts()
	}
	c.JSON(http.StatusOK, gin.H{
		"status":         "ok",
		"uptime_seconds": uptime,
		"db_ok":          dbOK,
		"redis_ok":       redisOK,
		"minio_ok":       minioOK,
		"counts":         counts,
	})
}
