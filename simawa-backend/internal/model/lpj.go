package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

const (
	LPJStatusPending  = "PENDING"
	LPJStatusApproved = "APPROVED"
	LPJStatusRejected = "REJECTED"
	LPJStatusRevision = "REVISION_REQUESTED"
)

type LPJ struct {
	ID          uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	ActivityID  *uuid.UUID     `gorm:"type:uuid;index" json:"activity_id"` // optional; LPJ bisa berdiri sendiri
	OrgID       uuid.UUID      `gorm:"type:uuid;index" json:"org_id"`
	Summary     string         `gorm:"type:text" json:"summary"`
	BudgetPlan  float64        `json:"budget_plan"`
	BudgetReal  float64        `json:"budget_real"`
	ReportKey   string         `gorm:"size:255" json:"report_key"`
	FileSize    int64          `json:"file_size"`
	Photos      datatypes.JSON `json:"photos"` // array of file keys
	Status      string         `gorm:"size:20;index" json:"status"`
	Note        string         `gorm:"type:text" json:"note"`
	SubmittedBy uuid.UUID      `gorm:"type:uuid" json:"submitted_by"`
	RevisionNo  int            `gorm:"default:0" json:"revision_no"`
	ReviewedBy  *uuid.UUID     `gorm:"type:uuid" json:"reviewed_by"`
	ReviewedAt  *time.Time     `json:"reviewed_at"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
}
