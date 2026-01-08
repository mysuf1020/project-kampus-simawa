package model

import (
	"time"

	"github.com/google/uuid"
)

type Role struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Code      string    `gorm:"size:64;uniqueIndex;not null" json:"code"`
	Name      string    `gorm:"size:128;not null" json:"name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

const (
	RoleAdmin     = "ADMIN"      // ketua/pengelola organisasi (scoped ke org)
	RoleOrgAdmin  = "ORG_ADMIN"  // admin organisasi (alias tambahan)
	RoleBEMAdmin  = "BEM_ADMIN"  // admin BEM
	RoleDEMAAdmin = "DEMA_ADMIN" // admin DEMA
	RoleUser      = "USER"       // default
)
