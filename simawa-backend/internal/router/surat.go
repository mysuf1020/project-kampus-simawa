package router

import (
	"github.com/gin-gonic/gin"

	"simawa-backend/internal/config"
	"simawa-backend/internal/handler"
	"simawa-backend/internal/middleware"
	"simawa-backend/internal/model"
	"simawa-backend/internal/service"
)

func RegisterSuratRoutes(r *gin.Engine, cfg *config.Env, sh *handler.SuratHandler, rbac *service.RBACService) {
	api := r.Group("/v1/surat")
	api.Use(middleware.AuthJWT(cfg))

	// Roles that can view surat
	viewRoles := []string{model.RoleAdmin, model.RoleOrgAdmin, model.RoleBEMAdmin, model.RoleDEMAAdmin}
	// Roles that can manage surat (DEMA can create surat for their org)
	manageRoles := []string{model.RoleAdmin, model.RoleOrgAdmin, model.RoleBEMAdmin, model.RoleDEMAAdmin}
	// Roles that can approve surat (BEM only)
	approveRoles := []string{model.RoleAdmin, model.RoleBEMAdmin}

	api.POST("", middleware.RequireRoles(rbac, manageRoles...), sh.Create) // DEMA can create
	api.POST("/upload", middleware.RequireRoles(rbac, manageRoles...), sh.Upload)
	api.POST("/preview", middleware.RequireRoles(rbac, manageRoles...), sh.Generate)
	api.POST("/:id/submit", middleware.RequireRoles(rbac, manageRoles...), sh.Submit)
	api.POST("/:id/approve", middleware.RequireRoles(rbac, approveRoles...), sh.Approve) // BEM only
	api.POST("/:id/revise", middleware.RequireRoles(rbac, approveRoles...), sh.Revise) // BEM only
	api.GET("/outbox/:org_id", middleware.RequireRoles(rbac, viewRoles...), sh.ListOutbox)
	api.GET("/inbox", middleware.RequireRoles(rbac, viewRoles...), sh.ListInbox)
	api.GET("/archive", middleware.RequireRoles(rbac, viewRoles...), sh.ListArchive)
	api.GET("", middleware.RequireRoles(rbac, viewRoles...), sh.List)
	api.GET("/:id", middleware.RequireRoles(rbac, viewRoles...), sh.Get)
	api.GET("/:id/download", middleware.RequireRoles(rbac, viewRoles...), sh.Download)
}
