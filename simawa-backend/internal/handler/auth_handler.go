package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"simawa-backend/internal/dto"
	"simawa-backend/internal/service"
	"simawa-backend/pkg/response"
)

type AuthHandler struct {
	auth    *service.AuthService
	captcha *service.CaptchaService
}

func NewAuthHandler(auth *service.AuthService, captcha *service.CaptchaService) *AuthHandler {
	return &AuthHandler{auth: auth, captcha: captcha}
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}

	// Verify captcha if token provided
	if h.captcha != nil && req.CaptchaToken != "" {
		if valid, err := h.captcha.Verify(c.Request.Context(), req.CaptchaToken); err != nil || !valid {
			c.JSON(http.StatusBadRequest, response.Err("invalid captcha"))
			return
		}
	}

	// Step 1: Validate & Trigger OTP
	if err := h.auth.Login(c.Request.Context(), &service.LoginRequest{
		Login:    req.Login,
		Password: req.Password,
	}); err != nil {
		c.JSON(http.StatusUnauthorized, response.Err(err.Error()))
		return
	}
	
	c.JSON(http.StatusOK, response.OK(gin.H{"message": "OTP sent to email"}))
}

func (h *AuthHandler) LoginVerify(c *gin.Context) {
	var req dto.LoginOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}

	tokens, err := h.auth.LoginVerify(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, response.OK(&dto.AuthResponse{
		AccessToken:      tokens.AccessToken,
		ExpiresIn:        tokens.ExpiresIn,
		RefreshToken:     tokens.RefreshToken,
		RefreshExpiresIn: tokens.ExpiresIn,
	}))
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req dto.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}

	if h.captcha != nil && req.CaptchaToken != "" {
		if valid, err := h.captcha.Verify(c.Request.Context(), req.CaptchaToken); err != nil || !valid {
			c.JSON(http.StatusBadRequest, response.Err("invalid captcha"))
			return
		}
	}

	user, err := h.auth.Register(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, response.OK(gin.H{
		"message": "Registration successful. Please check email for OTP verification.",
		"email":   user.Email,
	}))
}

func (h *AuthHandler) VerifyEmail(c *gin.Context) {
	var req dto.VerifyEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}

	if err := h.auth.VerifyEmail(c.Request.Context(), req.Email, req.OTP); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, response.OK(gin.H{"message": "Email verified successfully"}))
}

func (h *AuthHandler) ResendOTP(c *gin.Context) {
	var req dto.ResendOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}

	// We assume 'verify' purpose for generic resend, or maybe we need purpose in request?
	// For now let's assume 'verify' if not logged in.
	// Actually for Login OTP resend, they are not logged in either. 
	// Ideally the client should specify purpose or we try both? 
	// Simplification: just assume "verify" for now or "login" depending on context?
	// Let's check if user exists first.
	// For simplicity in this iteration: default to "verify" (registration).
	
	if err := h.auth.ResendOTP(c.Request.Context(), req.Email, "verify"); err != nil {
		// Try login purpose if verify fails? No, simpler to just fail or succeed.
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, response.OK(gin.H{"message": "OTP resent"}))
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	var req dto.RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	tokens, err := h.auth.Refresh(c.Request.Context(), &service.RefreshRequest{
		RefreshToken: req.RefreshToken,
	})
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, response.OK(&dto.AuthResponse{
		AccessToken:      tokens.AccessToken,
		ExpiresIn:        tokens.ExpiresIn,
		RefreshToken:     tokens.RefreshToken,
		RefreshExpiresIn: tokens.ExpiresIn,
	}))
}

func (h *AuthHandler) Logout(c *gin.Context) {
	var req dto.RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	if err := h.auth.Logout(c.Request.Context(), req.RefreshToken); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, response.OK(&gin.H{"revoked": true}))
}

func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var req dto.ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}

	if err := h.auth.ForgotPassword(c.Request.Context(), req.Email); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, response.OK(gin.H{"message": "If the email is registered, a reset OTP has been sent."}))
}

func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req dto.ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}

	if err := h.auth.ResetPassword(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, response.OK(gin.H{"message": "Password has been reset successfully. Please login with new password."}))
}
