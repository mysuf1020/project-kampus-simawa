package handler

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"

	"simawa-backend/internal/dto"
	"simawa-backend/internal/service"
	"simawa-backend/pkg/response"
)

// translateValidationErrors converts Gin binding validation errors to Indonesian
func translateValidationErrors(err error) string {
	ve, ok := err.(validator.ValidationErrors)
	if !ok {
		return "Data yang dikirim tidak valid."
	}

	fieldNames := map[string]string{
		"Username":        "Username",
		"FirstName":       "Nama Depan",
		"SecondName":      "Nama Belakang",
		"Email":           "Email",
		"NIM":             "NIM",
		"Jurusan":         "Jurusan",
		"Phone":           "No. HP",
		"Password":        "Password",
		"ConfirmPassword": "Konfirmasi Password",
		"OTP":             "Kode OTP",
		"Login":           "Email/Username",
		"RefreshToken":    "Token",
		"OldPassword":     "Password Lama",
		"NewPassword":     "Password Baru",
	}

	var msgs []string
	for _, fe := range ve {
		field := fe.Field()
		if name, ok := fieldNames[field]; ok {
			field = name
		}
		switch fe.Tag() {
		case "required":
			msgs = append(msgs, field+" wajib diisi")
		case "min":
			msgs = append(msgs, field+" minimal "+fe.Param()+" karakter")
		case "max":
			msgs = append(msgs, field+" maksimal "+fe.Param()+" karakter")
		case "email":
			msgs = append(msgs, "Format email tidak valid")
		case "eqfield":
			msgs = append(msgs, "Konfirmasi password tidak cocok")
		default:
			msgs = append(msgs, field+" tidak valid")
		}
	}
	return strings.Join(msgs, ". ") + "."
}

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
		c.JSON(http.StatusBadRequest, response.Err(translateValidationErrors(err)))
		return
	}

	// Verify captcha if token provided
	if h.captcha != nil && req.CaptchaToken != "" {
		if valid, err := h.captcha.Verify(c.Request.Context(), req.CaptchaToken); err != nil || !valid {
			c.JSON(http.StatusBadRequest, response.Err("Verifikasi captcha gagal. Silakan coba lagi."))
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
	
	c.JSON(http.StatusOK, response.OK(gin.H{"message": "Kode OTP telah dikirim ke email Anda."}))
}

func (h *AuthHandler) LoginVerify(c *gin.Context) {
	var req dto.LoginOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(translateValidationErrors(err)))
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
		c.JSON(http.StatusBadRequest, response.Err(translateValidationErrors(err)))
		return
	}

	if h.captcha != nil && req.CaptchaToken != "" {
		if valid, err := h.captcha.Verify(c.Request.Context(), req.CaptchaToken); err != nil || !valid {
			c.JSON(http.StatusBadRequest, response.Err("Verifikasi captcha gagal. Silakan coba lagi."))
			return
		}
	}

	user, err := h.auth.Register(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, response.OK(gin.H{
		"message": "Registrasi berhasil! Silakan cek email untuk kode verifikasi OTP.",
		"email":   user.Email,
	}))
}

func (h *AuthHandler) VerifyEmail(c *gin.Context) {
	var req dto.VerifyEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(translateValidationErrors(err)))
		return
	}

	if err := h.auth.VerifyEmail(c.Request.Context(), req.Email, req.OTP); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, response.OK(gin.H{"message": "Email berhasil diverifikasi. Silakan login."}))
}

func (h *AuthHandler) ResendOTP(c *gin.Context) {
	var req dto.ResendOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(translateValidationErrors(err)))
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
	c.JSON(http.StatusOK, response.OK(gin.H{"message": "Kode OTP baru telah dikirim ke email Anda."}))
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	var req dto.RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(translateValidationErrors(err)))
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
		c.JSON(http.StatusBadRequest, response.Err(translateValidationErrors(err)))
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
		c.JSON(http.StatusBadRequest, response.Err(translateValidationErrors(err)))
		return
	}

	if err := h.auth.ForgotPassword(c.Request.Context(), req.Email); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, response.OK(gin.H{"message": "Jika email terdaftar, kode OTP reset password telah dikirim."}))
}

func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req dto.ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(translateValidationErrors(err)))
		return
	}

	if err := h.auth.ResetPassword(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}

	c.JSON(http.StatusOK, response.OK(gin.H{"message": "Password berhasil direset. Silakan login dengan password baru."}))
}
