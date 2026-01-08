package router

import (
	"github.com/gin-gonic/gin"
	"simawa-backend/internal/handler"
)

func RegisterHealthRoutes(r *gin.Engine, h *handler.HealthHandler) {
	r.GET("/health", h.Health)
}
