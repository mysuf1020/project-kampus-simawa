package router

import (
	"github.com/gin-gonic/gin"
	"simawa-backend/internal/config"
	"simawa-backend/internal/handler"
	"simawa-backend/internal/middleware"
	"simawa-backend/internal/service"
)

func RegisterOrgJoinRequestRoutes(r *gin.Engine, cfg *config.Env, h *handler.OrgJoinRequestHandler, rbac *service.RBACService) {
	if h == nil {
		return
	}
	pub := r.Group("/public/orgs/:id/join-requests")
	pub.POST("", h.SubmitPublic)

	api := r.Group("/v1/orgs/:id/join-requests")
	api.Use(middleware.AuthJWT(cfg))

	// Org admins can review.
	api.GET("", h.List)
	api.PATCH("/:request_id", h.Decide)
}
