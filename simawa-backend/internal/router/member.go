package router

import (
	"github.com/gin-gonic/gin"
	"simawa-backend/internal/config"
	"simawa-backend/internal/handler"
	"simawa-backend/internal/middleware"
	"simawa-backend/internal/model"
	"simawa-backend/internal/service"
)

func RegisterMemberRoutes(r *gin.Engine, cfg *config.Env, h *handler.OrgMemberHandler, rbac *service.RBACService) {
	api := r.Group("/v1/orgs/:id/members")
	api.Use(middleware.AuthJWT(cfg))
	
	// Roles that can view members
	viewRoles := []string{model.RoleAdmin, model.RoleOrgAdmin, model.RoleBEMAdmin, model.RoleDEMAAdmin}
	// Roles that can manage members (BEM only, not DEMA)
	manageRoles := []string{model.RoleAdmin, model.RoleOrgAdmin, model.RoleBEMAdmin}
	
	api.POST("", middleware.RequireRoles(rbac, manageRoles...), h.Add) // BEM only
	api.PUT("/:user_id", middleware.RequireRoles(rbac, manageRoles...), h.Update) // BEM only
	api.DELETE("/:user_id", middleware.RequireRoles(rbac, manageRoles...), h.Delete) // BEM only
	api.GET("", middleware.RequireRoles(rbac, viewRoles...), h.List) // Both can view
}
