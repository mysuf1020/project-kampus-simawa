package model

import (
	"time"

	"github.com/google/uuid"
)

type OrgJoinRequestStatus string

const (
	OrgJoinRequestPending  OrgJoinRequestStatus = "PENDING"
	OrgJoinRequestApproved OrgJoinRequestStatus = "APPROVED"
	OrgJoinRequestRejected OrgJoinRequestStatus = "REJECTED"
)

// OrgJoinRequest stores a request from a user to join an organization.
// This is intentionally separate from OrgMember so org admins can review first.
type OrgJoinRequest struct {
	ID     uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	OrgID  uuid.UUID `gorm:"type:uuid;index;not null" json:"org_id"`
	UserID *uuid.UUID `gorm:"type:uuid;index" json:"user_id,omitempty"`

	ApplicantName  string `gorm:"size:128;not null;default:''" json:"applicant_name"`
	ApplicantEmail string `gorm:"size:128;not null;default:''" json:"applicant_email"`
	ApplicantNIM   string `gorm:"size:32;not null;default:''" json:"applicant_nim"`
	ApplicantPhone string `gorm:"size:32;not null;default:''" json:"applicant_phone"`
	ApplicantJurusan string `gorm:"size:128;not null;default:''" json:"applicant_jurusan"`

	Message string               `gorm:"size:512;not null;default:''" json:"message"`
	Status  OrgJoinRequestStatus `gorm:"size:16;index;not null;default:'PENDING'" json:"status"`

	ReviewedAt   *time.Time `json:"reviewed_at,omitempty"`
	ReviewedBy   *uuid.UUID `gorm:"type:uuid" json:"reviewed_by,omitempty"`
	DecisionNote string     `gorm:"size:255;not null;default:''" json:"decision_note"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
