package router

import (
	"github.com/gin-gonic/gin"
	"simawa-backend/internal/config"
	"simawa-backend/internal/handler"
	"simawa-backend/internal/middleware"
	"simawa-backend/internal/model"
	"simawa-backend/internal/service"
)

func RegisterDashboardRoutes(r *gin.Engine, cfg *config.Env, h *handler.DashboardHandler, rbac *service.RBACService) {
	api := r.Group("/v1/dashboard")
	api.Use(middleware.AuthJWT(cfg))
	api.GET("/summary", middleware.RequireRoles(rbac, model.RoleAdmin, model.RoleBEMAdmin, model.RoleDEMAAdmin), h.Summary)
}
