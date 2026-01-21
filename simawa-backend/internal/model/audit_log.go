package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

type AuditLog struct {
	ID          uuid.UUID         `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID      uuid.UUID         `gorm:"type:uuid;index" json:"user_id"`
	Action      string            `gorm:"size:100;index" json:"action"`
	EntityType  string            `gorm:"size:50;index" json:"entity_type"`
	EntityID    string            `gorm:"size:100;index" json:"entity_id"`
	IPAddress   string            `gorm:"size:45" json:"ip_address"`
	UserAgent   string            `gorm:"size:512" json:"user_agent"`
	Description string            `gorm:"type:text" json:"description"`
	Metadata    datatypes.JSONMap `json:"metadata"`
	CreatedAt   time.Time         `json:"created_at"`
}
