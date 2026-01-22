package router

import (
	"github.com/gin-gonic/gin"
	"simawa-backend/internal/config"
	"simawa-backend/internal/handler"
	"simawa-backend/internal/middleware"
	"simawa-backend/internal/model"
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

	// Roles that can view join requests
	viewRoles := []string{model.RoleAdmin, model.RoleOrgAdmin, model.RoleBEMAdmin, model.RoleDEMAAdmin}
	// Roles that can decide on join requests (BEM only, not DEMA)
	decideRoles := []string{model.RoleAdmin, model.RoleOrgAdmin, model.RoleBEMAdmin}

	api.GET("", middleware.RequireRoles(rbac, viewRoles...), h.List) // Both can view
	api.PATCH("/:request_id", middleware.RequireRoles(rbac, decideRoles...), h.Decide) // BEM only
}
