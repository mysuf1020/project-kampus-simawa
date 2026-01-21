package router

import (
	"github.com/gin-gonic/gin"
	"simawa-backend/internal/config"
	"simawa-backend/internal/handler"
	"simawa-backend/internal/middleware"
	"simawa-backend/internal/model"
	"simawa-backend/internal/service"
)

func RegisterReportRoutes(r *gin.Engine, cfg *config.Env, h *handler.ReportHandler, rbac *service.RBACService) {
	api := r.Group("/v1/reports")
	api.Use(middleware.AuthJWT(cfg))
	
	// Only Admin and OrgAdmin can export reports? Or just Admin?
	// Based on request: "Menu laporan kegiatan organisasi". Probably OrgAdmin too.
	// Let's allow Admin, BEM, DEMA, OrgAdmin.
	roles := []string{model.RoleAdmin, model.RoleBEMAdmin, model.RoleDEMAAdmin, model.RoleOrgAdmin}
	
	api.GET("/activities/export", middleware.RequireRoles(rbac, roles...), h.ExportActivities)
	api.GET("/surat/export", middleware.RequireRoles(rbac, roles...), h.ExportSurat)
	api.GET("/lpj/export", middleware.RequireRoles(rbac, roles...), h.ExportLPJ)
}
