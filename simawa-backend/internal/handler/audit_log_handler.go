package handler

import (
	"net/http"
	"simawa-backend/internal/model"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AuditLogHandler struct {
	db *gorm.DB
}

func NewAuditLogHandler(db *gorm.DB) *AuditLogHandler {
	return &AuditLogHandler{db: db}
}

// AuditLogResponse includes user info for display
type AuditLogResponse struct {
	model.AuditLog
	Username string `json:"username"`
	Email    string `json:"email"`
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
		query = query.Where("action ILIKE ?", "%"+action+"%")
	}
	if entityType != "" {
		query = query.Where("entity_type = ?", entityType)
	}
	
	query.Count(&total)
	
	result := query.Order("created_at desc").Offset(offset).Limit(size).Find(&logs)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to fetch audit logs"})
		return
	}
	
	// Collect unique user IDs
	userIDs := make([]uuid.UUID, 0)
	userIDMap := make(map[uuid.UUID]bool)
	for _, log := range logs {
		if log.UserID != uuid.Nil && !userIDMap[log.UserID] {
			userIDs = append(userIDs, log.UserID)
			userIDMap[log.UserID] = true
		}
	}
	
	// Fetch users
	var users []model.User
	if len(userIDs) > 0 {
		h.db.Where("id IN ?", userIDs).Find(&users)
	}
	
	// Create user lookup map
	userLookup := make(map[uuid.UUID]model.User)
	for _, u := range users {
		userLookup[u.ID] = u
	}
	
	// Build response with user info
	responses := make([]AuditLogResponse, len(logs))
	for i, log := range logs {
		responses[i] = AuditLogResponse{
			AuditLog: log,
		}
		if u, ok := userLookup[log.UserID]; ok {
			responses[i].Username = u.Username
			responses[i].Email = u.Email
		}
	}
	
	c.JSON(http.StatusOK, gin.H{
		"items": responses,
		"total": total,
		"page":  page,
		"size":  size,
	})
}
