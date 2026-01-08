package model

import (
	"time"

	"github.com/google/uuid"
)

type UserRole struct {
	ID        uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID    uuid.UUID  `gorm:"type:uuid;not null;uniqueIndex:ux_user_role" json:"user_id"`
	RoleCode  string     `gorm:"size:64;not null;uniqueIndex:ux_user_role" json:"role_code"`
	OrgID     *uuid.UUID `gorm:"type:uuid;uniqueIndex:ux_user_role" json:"org_id,omitempty"` // optional scope to an organization
	CreatedAt time.Time  `json:"created_at"`
}
