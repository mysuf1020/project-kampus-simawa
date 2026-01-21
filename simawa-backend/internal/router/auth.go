package router

import (
	"github.com/gin-gonic/gin"

	"simawa-backend/internal/handler"
)

func RegisterAuthRoutes(r *gin.Engine, ah *handler.AuthHandler) {
	r.POST("/auth/login", ah.Login)
	r.POST("/auth/login/verify", ah.LoginVerify)
	r.POST("/auth/register", ah.Register)
	r.POST("/auth/verify-email", ah.VerifyEmail)
	r.POST("/auth/otp/resend", ah.ResendOTP)
	r.POST("/auth/forgot-password", ah.ForgotPassword)
	r.POST("/auth/reset-password", ah.ResetPassword)
	r.POST("/auth/refresh", ah.Refresh)
	r.POST("/auth/logout", ah.Logout)
}
