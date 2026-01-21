package router

import (
	"github.com/gin-gonic/gin"

	"simawa-backend/internal/config"
	"simawa-backend/internal/handler"
	"simawa-backend/internal/middleware"
	"simawa-backend/internal/model"
	"simawa-backend/internal/service"
)

func RegisterUserRoutes(r *gin.Engine, cfg *config.Env, uh *handler.UserHandler, rbac *service.RBACService) {
	v1 := r.Group("/v1")
	v1.Use(middleware.AuthJWT(cfg))

	v1.GET("/users/search", uh.Search)
	v1.PUT("/users/change-password", uh.ChangePassword)

	// Admin roles that can manage users: ADMIN, BEM_ADMIN, DEMA_ADMIN
	adminRoles := []string{model.RoleAdmin, model.RoleBEMAdmin, model.RoleDEMAAdmin}

	v1.POST("/users",
		middleware.RequireRoles(rbac, adminRoles...),
		uh.Create,
	)

	v1.GET("/users",
		middleware.RequireRoles(rbac, adminRoles...),
		uh.List,
	)

	v1.GET("/users/:id",
		middleware.RequireRoles(rbac, adminRoles...),
		uh.GetByID,
	)

	v1.GET("/users/:id/roles",
		middleware.RequireRoles(rbac, adminRoles...),
		uh.ListAssignments,
	)

	v1.POST("/users/:id/roles",
		middleware.RequireRoles(rbac, adminRoles...),
		uh.AssignRoles,
	)
}
