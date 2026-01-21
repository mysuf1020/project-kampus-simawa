package router

import (
	"github.com/gin-gonic/gin"
	"simawa-backend/internal/config"
	"simawa-backend/internal/handler"
	"simawa-backend/internal/middleware"
	"simawa-backend/internal/model"
	"simawa-backend/internal/service"
)

func RegisterActivityRoutes(r *gin.Engine, cfg *config.Env, ah *handler.ActivityHandler, rbac *service.RBACService) {
	pub := r.Group("/public")
	pub.GET("/activities", ah.Public)
	pub.GET("/activities/gallery", ah.ListPublicGallery) // Public Gallery
	pub.GET("/activities/:id/photos", ah.GetActivityPhotos) // Photos
	pub.GET("/activities.rss", ah.PublicRSS)
	pub.GET("/activities.ics", ah.PublicICS)

	api := r.Group("/v1/activities")
	api.Use(middleware.AuthJWT(cfg))
	api.POST("/upload", middleware.RequireRoles(rbac, model.RoleAdmin, model.RoleOrgAdmin), ah.UploadProposal)
	api.DELETE("/upload", middleware.RequireRoles(rbac, model.RoleAdmin, model.RoleOrgAdmin), ah.DeleteProposal)
	api.POST("", middleware.RequireRoles(rbac, model.RoleAdmin, model.RoleOrgAdmin), ah.Create)
	api.POST("/:id/submit", middleware.RequireRoles(rbac, model.RoleAdmin, model.RoleOrgAdmin), ah.Submit)
	api.POST("/:id/approve", middleware.RequireRoles(rbac, model.RoleBEMAdmin, model.RoleDEMAAdmin), ah.Approve)
	api.POST("/:id/revision", middleware.RequireRoles(rbac, model.RoleAdmin, model.RoleOrgAdmin, model.RoleBEMAdmin, model.RoleDEMAAdmin), ah.Revision)
	api.POST("/:id/cover", middleware.RequireRoles(rbac, model.RoleBEMAdmin, model.RoleDEMAAdmin), ah.ApproveCover)
	api.POST("/:id/gallery", middleware.RequireRoles(rbac, model.RoleAdmin, model.RoleOrgAdmin), ah.AddGalleryPhoto) // Upload Photo
	api.DELETE("/:id/gallery", middleware.RequireRoles(rbac, model.RoleAdmin, model.RoleOrgAdmin), ah.RemoveGalleryPhoto) // Remove Photo
	api.GET("/pending-cover", middleware.RequireRoles(rbac, model.RoleBEMAdmin, model.RoleDEMAAdmin), ah.ListPendingCover)
	api.GET("/org/:org_id", middleware.RequireRoles(rbac, model.RoleAdmin, model.RoleOrgAdmin, model.RoleBEMAdmin, model.RoleDEMAAdmin), ah.ListByOrg)
}
