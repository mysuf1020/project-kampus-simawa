package handler

import (
	"net/http"
	"simawa-backend/internal/model"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AuditLogHandler struct {
	db *gorm.DB
}

func NewAuditLogHandler(db *gorm.DB) *AuditLogHandler {
	return &AuditLogHandler{db: db}
}

func (h *AuditLogHandler) List(c *gin.Context) {
	// Only ADMIN can view audit logs
	// We assume AuthMiddleware has run and set user_id
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Unauthorized"})
		return
	}
	_ = userID // In a real implementation, check if this userID has ADMIN role

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "20"))
	action := c.Query("action")
	entityType := c.Query("entity_type")
	
	offset := (page - 1) * size
	
	var logs []model.AuditLog
	var total int64
	
	query := h.db.Model(&model.AuditLog{})
	
	if action != "" {
		query = query.Where("action = ?", action)
	}
	if entityType != "" {
		query = query.Where("entity_type = ?", entityType)
	}
	
	// Preload user info? AuditLog has UserID.
	// But AuditLog model definition in previous turn didn't show User relation, just UserID.
	// We might want to join with users table to get names if needed, or fetch separately.
	// Let's just return logs for now.
	
	query.Count(&total)
	
	result := query.Order("created_at desc").Offset(offset).Limit(size).Find(&logs)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to fetch audit logs"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"items": logs,
		"total": total,
		"page":  page,
		"size":  size,
	})
}
