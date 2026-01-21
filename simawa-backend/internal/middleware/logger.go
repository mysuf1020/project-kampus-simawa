package middleware

import (
	"bytes"
	"io"
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

// RequestLogger logs detailed request/response information for debugging
func RequestLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery
		method := c.Request.Method

		// Read request body for logging (only for non-GET requests)
		var bodyBytes []byte
		if c.Request.Body != nil && method != "GET" {
			bodyBytes, _ = io.ReadAll(c.Request.Body)
			// Restore body for handler
			c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
		}

		// Process request
		c.Next()

		// Calculate latency
		latency := time.Since(start)
		status := c.Writer.Status()
		clientIP := c.ClientIP()

		// Build query string
		if raw != "" {
			path = path + "?" + raw
		}

		// Color status code
		statusColor := "\033[97;42m" // Green for 2xx
		if status >= 400 && status < 500 {
			statusColor = "\033[97;43m" // Yellow for 4xx
		} else if status >= 500 {
			statusColor = "\033[97;41m" // Red for 5xx
		}
		resetColor := "\033[0m"

		// Log format with colors
		log.Printf("%s %3d %s | %13v | %15s | %-7s %s",
			statusColor, status, resetColor,
			latency,
			clientIP,
			method,
			path,
		)

		// Log request body for non-GET requests (truncate if too long)
		if len(bodyBytes) > 0 {
			bodyStr := string(bodyBytes)
			if len(bodyStr) > 500 {
				bodyStr = bodyStr[:500] + "...(truncated)"
			}
			log.Printf("  📥 Request Body: %s", bodyStr)
		}

		// Log errors if any
		if len(c.Errors) > 0 {
			for _, e := range c.Errors {
				log.Printf("  ❌ Error: %s", e.Error())
			}
		}

		// Log response status message for 4xx/5xx
		if status >= 400 {
			log.Printf("  ⚠️  Response Status: %d - Check handler for details", status)
		}
	}
}
