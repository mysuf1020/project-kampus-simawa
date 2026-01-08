package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

type Notification struct {
	ID        uuid.UUID         `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID    uuid.UUID         `gorm:"type:uuid;index" json:"user_id"`
	Title     string            `gorm:"size:200" json:"title"`
	Body      string            `gorm:"type:text" json:"body"`
	Data      datatypes.JSONMap `json:"data"`
	ReadAt    *time.Time        `json:"read_at"`
	CreatedAt time.Time         `json:"created_at"`
}
