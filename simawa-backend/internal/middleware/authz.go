package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"simawa-backend/internal/service"
)

func RequireRoles(rbac *service.RBACService, allowed ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		raw, ok := c.Get("user_id")
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "missing user context"})
			return
		}
		var userID uuid.UUID
		switch t := raw.(type) {
		case uuid.UUID:
			userID = t
		case *uuid.UUID:
			if t == nil {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "invalid user context"})
				return
			}
			userID = *t
		case string:
			id, err := uuid.Parse(t)
			if err != nil {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "invalid user id"})
				return
			}
			userID = id
		default:
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "invalid user context"})
			return
		}

		ok2, err := rbac.UserHasAnyRole(c.Request.Context(), userID, allowed)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
			return
		}
		if !ok2 {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "insufficient role"})
			return
		}
		c.Next()
	}
}
