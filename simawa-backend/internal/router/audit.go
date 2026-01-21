package router

import (
	"github.com/gin-gonic/gin"
	"simawa-backend/internal/config"
	"simawa-backend/internal/handler"
	"simawa-backend/internal/middleware"
)

func RegisterAuditLogRoutes(r *gin.Engine, cfg *config.Env, h *handler.AuditLogHandler) {
	g := r.Group("/v1/audit")
	g.Use(middleware.AuthJWT(cfg))
	{
		g.GET("", h.List)
	}
}
