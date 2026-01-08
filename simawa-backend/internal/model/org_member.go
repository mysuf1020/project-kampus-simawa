package model

import (
	"time"

	"github.com/google/uuid"
)

type OrgMember struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	OrgID     uuid.UUID `gorm:"type:uuid;index" json:"org_id"`
	UserID    uuid.UUID `gorm:"type:uuid;index" json:"user_id"`
	User      *User     `json:"user,omitempty" gorm:"foreignKey:UserID;references:ID"`
	Role      string    `gorm:"size:50" json:"role"` // e.g. ADMIN, MEMBER
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
