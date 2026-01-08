package router

import (
	"github.com/gin-gonic/gin"
	"simawa-backend/internal/config"
	"simawa-backend/internal/handler"
	"simawa-backend/internal/middleware"
	"simawa-backend/internal/service"
)

func RegisterMemberRoutes(r *gin.Engine, cfg *config.Env, h *handler.OrgMemberHandler, rbac *service.RBACService) {
	api := r.Group("/v1/orgs/:id/members")
	api.Use(middleware.AuthJWT(cfg))
	api.POST("", h.Add)
	api.PUT("/:user_id", h.Update)
	api.DELETE("/:user_id", h.Delete)
	api.GET("", h.List)
}
