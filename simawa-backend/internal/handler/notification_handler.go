package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"simawa-backend/internal/service"
	"simawa-backend/pkg/response"
)

type NotificationHandler struct {
	svc *service.NotificationService
}

func NewNotificationHandler(svc *service.NotificationService) *NotificationHandler {
	return &NotificationHandler{svc: svc}
}

func (h *NotificationHandler) List(c *gin.Context) {
	userID, _ := uuid.Parse(c.GetString("sub"))
	rows, err := h.svc.List(c.Request.Context(), userID, 20)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": rows})
}

func (h *NotificationHandler) MarkRead(c *gin.Context) {
	userID, _ := uuid.Parse(c.GetString("sub"))
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err("invalid id"))
		return
	}
	if err := h.svc.MarkRead(c.Request.Context(), id, userID); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, gin.H{"read": true})
}

type mentionReq struct {
	UserID string         `json:"user_id" binding:"required,uuid"`
	Title  string         `json:"title" binding:"required"`
	Body   string         `json:"body"`
	Data   map[string]any `json:"data"`
}

func (h *NotificationHandler) Mention(c *gin.Context) {
	var req mentionReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	userID, _ := uuid.Parse(req.UserID)
	if err := h.svc.Push(c.Request.Context(), userID, req.Title, req.Body, req.Data); err != nil {
		c.JSON(http.StatusInternalServerError, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, gin.H{"sent": true})
}
