package service

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"simawa-backend/internal/config"
)

type CaptchaService struct {
	secret string
}

func NewCaptchaService(cfg *config.Env) *CaptchaService {
	return &CaptchaService{secret: cfg.Captcha.Secret}
}

func (s *CaptchaService) Verify(ctx context.Context, token string) (bool, error) {
	// If no secret configured, skip verification (dev mode)
	if s.secret == "" {
		return true, nil
	}
	if token == "" {
		return false, fmt.Errorf("missing captcha token")
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Post(
		fmt.Sprintf("https://www.google.com/recaptcha/api/siteverify?secret=%s&response=%s", s.secret, token),
		"application/json",
		nil,
	)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	var result struct {
		Success bool `json:"success"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return false, err
	}

	return result.Success, nil
}
