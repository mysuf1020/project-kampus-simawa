package middleware

import (
	"github.com/gin-gonic/gin"
	"simawa-backend/internal/service"
)

// AuditContext injects client IP and User-Agent into the request context
// so that audit service Log() can capture them automatically.
func AuditContext() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := service.WithAuditInfo(c.Request.Context(), c.ClientIP(), c.Request.UserAgent())
		c.Request = c.Request.WithContext(ctx)
		c.Next()
	}
}
