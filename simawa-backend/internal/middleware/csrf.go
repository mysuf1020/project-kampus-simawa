package middleware

import (
	"crypto/rand"
	"encoding/base64"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

const (
	CSRFTokenHeader = "X-CSRF-Token"
	CSRFTokenCookie = "csrf_token"
	CSRFTokenLength = 32
)

type CSRFStore struct {
	mu     sync.RWMutex
	tokens map[string]time.Time
	ttl    time.Duration
}

func NewCSRFStore(ttl time.Duration) *CSRFStore {
	store := &CSRFStore{
		tokens: make(map[string]time.Time),
		ttl:    ttl,
	}
	go store.cleanup()
	return store
}

func (s *CSRFStore) Generate() (string, error) {
	b := make([]byte, CSRFTokenLength)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	token := base64.URLEncoding.EncodeToString(b)

	s.mu.Lock()
	s.tokens[token] = time.Now().Add(s.ttl)
	s.mu.Unlock()

	return token, nil
}

func (s *CSRFStore) Validate(token string) bool {
	s.mu.RLock()
	expiry, exists := s.tokens[token]
	s.mu.RUnlock()

	if !exists {
		return false
	}

	if time.Now().After(expiry) {
		s.mu.Lock()
		delete(s.tokens, token)
		s.mu.Unlock()
		return false
	}

	return true
}

func (s *CSRFStore) Invalidate(token string) {
	s.mu.Lock()
	delete(s.tokens, token)
	s.mu.Unlock()
}

func (s *CSRFStore) cleanup() {
	ticker := time.NewTicker(5 * time.Minute)
	for range ticker.C {
		s.mu.Lock()
		now := time.Now()
		for token, expiry := range s.tokens {
			if now.After(expiry) {
				delete(s.tokens, token)
			}
		}
		s.mu.Unlock()
	}
}

var defaultCSRFStore = NewCSRFStore(24 * time.Hour)

// CSRFMiddleware provides CSRF protection for state-changing requests
func CSRFMiddleware() gin.HandlerFunc {
	safeMethods := map[string]bool{
		http.MethodGet:     true,
		http.MethodHead:    true,
		http.MethodOptions: true,
		http.MethodTrace:   true,
	}

	return func(c *gin.Context) {
		// Skip CSRF for API endpoints with Bearer token (already protected)
		authHeader := c.GetHeader("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			c.Next()
			return
		}

		// Safe methods don't need CSRF validation
		if safeMethods[c.Request.Method] {
			// Generate token for safe methods if not present
			if _, err := c.Cookie(CSRFTokenCookie); err != nil {
				token, err := defaultCSRFStore.Generate()
				if err == nil {
					c.SetCookie(CSRFTokenCookie, token, int(24*time.Hour.Seconds()), "/", "", false, false)
					c.Header(CSRFTokenHeader, token)
				}
			}
			c.Next()
			return
		}

		// Validate CSRF token for state-changing methods
		headerToken := c.GetHeader(CSRFTokenHeader)
		cookieToken, _ := c.Cookie(CSRFTokenCookie)

		if headerToken == "" || cookieToken == "" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "CSRF token missing"})
			return
		}

		if headerToken != cookieToken {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "CSRF token mismatch"})
			return
		}

		if !defaultCSRFStore.Validate(headerToken) {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "CSRF token invalid or expired"})
			return
		}

		c.Next()
	}
}

// GenerateCSRFToken generates a new CSRF token (for API endpoint)
func GenerateCSRFToken(c *gin.Context) {
	token, err := defaultCSRFStore.Generate()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to generate token"})
		return
	}
	c.SetCookie(CSRFTokenCookie, token, int(24*time.Hour.Seconds()), "/", "", false, false)
	c.JSON(http.StatusOK, gin.H{"csrf_token": token})
}
