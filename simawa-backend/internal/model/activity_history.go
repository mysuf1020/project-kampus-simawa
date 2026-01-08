package model

import (
	"time"

	"github.com/google/uuid"
)

type ActivityHistory struct {
	ID         uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	ActivityID uuid.UUID `gorm:"type:uuid;index" json:"activity_id"`
	OrgID      uuid.UUID `gorm:"type:uuid;index" json:"org_id"`
	UserID     uuid.UUID `gorm:"type:uuid;index" json:"user_id"`
	Action     string    `gorm:"size:50" json:"action"` // SUBMIT, APPROVE, REJECT, REVISION, COMPLETE
	Note       string    `gorm:"type:text" json:"note"`
	CreatedAt  time.Time `json:"created_at"`
}
