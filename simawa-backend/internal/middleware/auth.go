package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"

	"simawa-backend/internal/config"
)

// AuthJWT validates Bearer token and injects sub/user_id into context.
func AuthJWT(cfg *config.Env) gin.HandlerFunc {
	return func(c *gin.Context) {
		auth := c.GetHeader("Authorization")
		parts := strings.Split(auth, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "missing bearer token"})
			return
		}
		tok, err := jwt.Parse(parts[1], func(token *jwt.Token) (interface{}, error) {
			return []byte(cfg.Auth.JWTSecret), nil
		})
		if err != nil || !tok.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "invalid token"})
			return
		}
		claims, ok := tok.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "invalid claims"})
			return
		}
		if sub, ok := claims["sub"].(string); ok {
			c.Set("sub", sub)
			c.Set("user_id", sub)
		}
		c.Next()
	}
}
