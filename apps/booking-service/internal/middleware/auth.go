package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// RequireAuth validates that Kong has injected the X-User-Id header.
func RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetHeader("X-User-Id")
		if userID == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		c.Set("user_id", userID)
		c.Next()
	}
}
