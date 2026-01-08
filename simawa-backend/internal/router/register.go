package router

import (
	"github.com/gin-gonic/gin"

	"simawa-backend/internal/config"
	"simawa-backend/internal/handler"
	"simawa-backend/internal/service"
)

func Register(r *gin.Engine, cfg *config.Env, ah *handler.AuthHandler, uh *handler.UserHandler, sh *handler.SuratHandler, oh *handler.OrganizationHandler, rbac *service.RBACService) {
	RegisterAuthRoutes(r, ah)
	RegisterUserRoutes(r, cfg, uh, rbac)
	RegisterSuratRoutes(r, cfg, sh, rbac)
	RegisterOrgRoutes(r, cfg, oh, rbac)
	// other routes are registered in server init where handlers are available
}
