package router

import (
	"github.com/gin-gonic/gin"
	"simawa-backend/internal/config"
	"simawa-backend/internal/handler"
	"simawa-backend/internal/middleware"
	"simawa-backend/internal/model"
	"simawa-backend/internal/service"
)

func RegisterAuditLogRoutes(r *gin.Engine, cfg *config.Env, h *handler.AuditLogHandler, rbac *service.RBACService) {
	g := r.Group("/v1/audit")
	g.Use(middleware.AuthJWT(cfg))
	
	// Both BEM and DEMA can view audit logs
	viewRoles := []string{model.RoleAdmin, model.RoleBEMAdmin, model.RoleDEMAAdmin}
	
	g.GET("", middleware.RequireRoles(rbac, viewRoles...), h.List)
}
