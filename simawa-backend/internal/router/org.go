package router

import (
	"github.com/gin-gonic/gin"
	"simawa-backend/internal/config"
	"simawa-backend/internal/handler"
	"simawa-backend/internal/middleware"
	"simawa-backend/internal/model"
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
	pub.GET("/slug/:slug/members", oh.PublicMembers)

	auth := r.Group("/v1/orgs")
	auth.Use(middleware.AuthJWT(cfg))
	
	// Roles that can edit organizations (ADMIN, ORG_ADMIN for their org, BEM, DEMA for their org)
	editRoles := []string{model.RoleAdmin, model.RoleOrgAdmin, model.RoleBEMAdmin, model.RoleDEMAAdmin}
	// Only ADMIN can create/delete organizations
	adminOnly := []string{model.RoleAdmin}
	
	auth.GET("", oh.ListAuth)
	auth.POST("", middleware.RequireRoles(rbac, adminOnly...), oh.Create)
	auth.PUT("/:id", middleware.RequireRoles(rbac, editRoles...), oh.Update)
	auth.DELETE("/:id", middleware.RequireRoles(rbac, adminOnly...), oh.Delete)
	auth.POST("/:id/upload", middleware.RequireRoles(rbac, editRoles...), oh.UploadImage)
	auth.POST("/:id/upload-hero", middleware.RequireRoles(rbac, editRoles...), oh.UploadImage)
	auth.DELETE("/:id/hero", middleware.RequireRoles(rbac, editRoles...), oh.DeleteHero)
}
