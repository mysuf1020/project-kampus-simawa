package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

const (
	ActivityStatusDraft     = "DRAFT"
	ActivityStatusPending   = "PENDING"
	ActivityStatusApproved  = "APPROVED"
	ActivityStatusRejected  = "REJECTED"
	ActivityStatusCompleted = "COMPLETED"
)

type Activity struct {
	ID                 uuid.UUID         `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	OrgID              uuid.UUID         `gorm:"type:uuid;index" json:"org_id"`
	Title              string            `gorm:"size:200" json:"title"`
	Description        string            `gorm:"type:text" json:"description"`
	Location           string            `gorm:"size:255" json:"location"`
	Type               string            `gorm:"size:50" json:"type"` // Rapat/Seminar/Lomba
	CollabType         string            `gorm:"size:20;default:'INTERNAL'" json:"collab_type"` // INTERNAL, COLLAB, CAMPUS
	CollaboratorOrgIDs datatypes.JSON    `gorm:"type:jsonb" json:"collaborator_org_ids"`
	Public             bool              `json:"public"`
	Status             string            `gorm:"size:20;index" json:"status"`
	ApprovalNote       string            `gorm:"type:text" json:"approval_note"`
	StartAt            time.Time         `json:"start_at"`
	EndAt              time.Time         `json:"end_at"`
	CoverKey           string            `gorm:"size:255" json:"cover_key"`
	ProposalKey        string            `gorm:"size:255" json:"proposal_key"`
	ProposalURL        string            `gorm:"size:512" json:"proposal_url"`
	GalleryURLs        datatypes.JSON    `gorm:"type:jsonb" json:"gallery_urls"`
	Metadata           datatypes.JSONMap `json:"metadata"`
	CreatedBy          uuid.UUID         `gorm:"type:uuid" json:"created_by"`
	UpdatedBy          uuid.UUID         `gorm:"type:uuid" json:"updated_by"`
	CreatedAt          time.Time         `json:"created_at"`
	UpdatedAt          time.Time         `json:"updated_at"`
}
