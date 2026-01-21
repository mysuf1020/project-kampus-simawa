package router

import (
	"github.com/gin-gonic/gin"
	"simawa-backend/internal/config"
	"simawa-backend/internal/handler"
	"simawa-backend/internal/middleware"
	"simawa-backend/internal/service"
)

func RegisterOrgRoutes(r *gin.Engine, cfg *config.Env, oh *handler.OrganizationHandler, rbac *service.RBACService) {
	if oh == nil {
		return
	}
	pub := r.Group("/orgs")
	pub.GET("", oh.List)
	pub.GET("/:id", oh.Get)
	pub.GET("/slug/:slug", oh.PublicProfile)

	auth := r.Group("/v1/orgs")
	auth.Use(middleware.AuthJWT(cfg))
	auth.GET("", oh.ListAuth)
	auth.PUT("/:id", oh.Update)
	auth.POST("/:id/upload", oh.UploadImage)
	auth.POST("/:id/upload-hero", oh.UploadImage) // Alias for specific requirement
	auth.DELETE("/:id/hero", oh.DeleteHero)
}
