package router

import (
	"github.com/gin-gonic/gin"
	"simawa-backend/internal/config"
	"simawa-backend/internal/handler"
	"simawa-backend/internal/middleware"
	"simawa-backend/internal/service"
)

func RegisterAssetRoutes(r *gin.Engine, cfg *config.Env, h *handler.AssetHandler, rbac *service.RBACService) {
	api := r.Group("/v1/assets")
	api.Use(middleware.AuthJWT(cfg))

	api.GET("", h.List)
	api.GET("/:id", h.Get)
	api.POST("", h.Create)
	api.PUT("/:id", h.Update)
	api.DELETE("/:id", h.Delete)

	// Borrowing
	api.POST("/borrow", h.Borrow)
	api.POST("/borrow/:id/return", h.Return)
	api.GET("/borrowings", h.ListBorrowings)
}
