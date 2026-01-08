package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"simawa-backend/internal/dto"
	"simawa-backend/internal/service"
	"simawa-backend/pkg/response"
)

type AuthHandler struct {
	auth *service.AuthService
}

func NewAuthHandler(auth *service.AuthService) *AuthHandler {
	return &AuthHandler{auth: auth}
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	tokens, err := h.auth.Login(c.Request.Context(), &service.LoginRequest{
		Login:    req.Login,
		Password: req.Password,
	})
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, response.OK(&dto.AuthResponse{
		AccessToken:      tokens.AccessToken,
		ExpiresIn:        tokens.ExpiresIn,
		RefreshToken:     tokens.RefreshToken,
		RefreshExpiresIn: tokens.ExpiresIn, // simple mirror; adjust when service exposes refresh exp
	}))
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
