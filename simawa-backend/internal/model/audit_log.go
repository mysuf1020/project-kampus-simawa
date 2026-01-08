package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

type AuditLog struct {
	ID        uuid.UUID         `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID    uuid.UUID         `gorm:"type:uuid;index" json:"user_id"`
	Action    string            `gorm:"size:100;index" json:"action"`
	Metadata  datatypes.JSONMap `json:"metadata"`
	CreatedAt time.Time         `json:"created_at"`
}
