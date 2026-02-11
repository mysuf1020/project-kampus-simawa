package router

import (
	"github.com/gin-gonic/gin"
	"simawa-backend/internal/config"
	"simawa-backend/internal/handler"
	"simawa-backend/internal/middleware"
	"simawa-backend/internal/model"
	"simawa-backend/internal/service"
)

func RegisterLPJRoutes(r *gin.Engine, cfg *config.Env, h *handler.LPJHandler, rbac *service.RBACService) {
	api := r.Group("/v1/lpj")
	api.Use(middleware.AuthJWT(cfg))
	api.POST("/upload", middleware.RequireRoles(rbac, model.RoleAdmin, model.RoleOrgAdmin), h.UploadLPJReport)
	api.POST("/submit", middleware.RequireRoles(rbac, model.RoleAdmin, model.RoleOrgAdmin), h.Submit)
	api.POST("/:lpj_id/approve", middleware.RequireRoles(rbac, model.RoleAdmin, model.RoleBEMAdmin), h.Approve) // ADMIN + BEM
	api.POST("/:lpj_id/revision", middleware.RequireRoles(rbac, model.RoleAdmin, model.RoleBEMAdmin), h.Revision) // BEM only (not DEMA)
	api.GET("/:lpj_id", middleware.RequireRoles(rbac, model.RoleAdmin, model.RoleOrgAdmin, model.RoleBEMAdmin, model.RoleDEMAAdmin), h.Detail)
	api.GET("/:lpj_id/download", middleware.RequireRoles(rbac, model.RoleAdmin, model.RoleOrgAdmin, model.RoleBEMAdmin, model.RoleDEMAAdmin), h.Download)
	api.GET("/org/:org_id", middleware.RequireRoles(rbac, model.RoleAdmin, model.RoleOrgAdmin, model.RoleBEMAdmin, model.RoleDEMAAdmin), h.ListByOrg)
}
