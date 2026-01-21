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
	api.Use(middleware.RequireRoles(rbac, model.RoleAdmin, model.RoleOrgAdmin, model.RoleBEMAdmin, model.RoleDEMAAdmin))

	api.POST("", sh.Create)
	api.POST("/preview", sh.Generate)
	api.POST("/:id/submit", sh.Submit)
	api.POST("/:id/approve", sh.Approve)
	api.POST("/:id/revise", sh.Revise)
	api.GET("/outbox/:org_id", sh.ListOutbox)
	api.GET("/inbox", sh.ListInbox)
	api.GET("/archive", sh.ListArchive)
	api.GET("", sh.List)
	api.GET("/:id", sh.Get)
	api.GET("/:id/download", sh.Download)
}
