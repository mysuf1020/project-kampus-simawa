package router

import (
	"github.com/gin-gonic/gin"
	"simawa-backend/internal/config"
	"simawa-backend/internal/handler"
	"simawa-backend/internal/middleware"
)

func RegisterNotificationRoutes(r *gin.Engine, cfg *config.Env, h *handler.NotificationHandler) {
	api := r.Group("/v1/notifications")
	api.Use(middleware.AuthJWT(cfg))
	api.GET("", h.List)
	api.POST("/:id/read", h.MarkRead)
	api.POST("/mention", h.Mention)
}
