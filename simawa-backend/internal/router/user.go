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

	// Roles that can view users
	viewRoles := []string{model.RoleAdmin, model.RoleBEMAdmin, model.RoleDEMAAdmin}
	// Roles that can manage users (BEM only, not DEMA)
	manageRoles := []string{model.RoleAdmin, model.RoleBEMAdmin}

	v1.POST("/users",
		middleware.RequireRoles(rbac, manageRoles...), // BEM only
		uh.Create,
	)

	v1.GET("/users",
		middleware.RequireRoles(rbac, viewRoles...), // Both can view
		uh.List,
	)

	v1.GET("/users/:id",
		middleware.RequireRoles(rbac, viewRoles...), // Both can view
		uh.GetByID,
	)

	v1.GET("/users/:id/roles",
		middleware.RequireRoles(rbac, viewRoles...), // Both can view
		uh.ListAssignments,
	)

	v1.POST("/users/:id/roles",
		middleware.RequireRoles(rbac, manageRoles...), // BEM only
		uh.AssignRoles,
	)

	v1.DELETE("/users/:id/roles/:role_code",
		middleware.RequireRoles(rbac, manageRoles...), // BEM only
		uh.RemoveRole,
	)

	v1.PUT("/users/:id",
		middleware.RequireRoles(rbac, manageRoles...), // BEM only
		uh.Update,
	)

	v1.DELETE("/users/:id",
		middleware.RequireRoles(rbac, manageRoles...), // BEM only
		uh.Delete,
	)
}
