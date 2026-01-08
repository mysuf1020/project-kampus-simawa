package router

import (
	"github.com/gin-gonic/gin"

	"simawa-backend/internal/handler"
)

func RegisterAuthRoutes(r *gin.Engine, ah *handler.AuthHandler) {
	r.POST("/auth/login", ah.Login)
	r.POST("/auth/refresh", ah.Refresh)
	r.POST("/auth/logout", ah.Logout)
}
