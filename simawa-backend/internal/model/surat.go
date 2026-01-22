package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

const (
	SuratStatusDraft    = "DRAFT"
	SuratStatusPending  = "PENDING"
	SuratStatusApproved = "APPROVED"
	SuratStatusRejected = "REJECTED"
	SuratStatusRevision = "REVISION"
)

const (
	SuratVariantPeminjaman = "PEMINJAMAN"
	SuratVariantPengajuan  = "PENGAJUAN"
	SuratVariantPermohonan = "PERMOHONAN"
	SuratVariantUndangan   = "UNDANGAN"
)

type Surat struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	OrgID        uuid.UUID      `gorm:"type:uuid;index" json:"org_id"`
	TargetOrgID  *uuid.UUID     `gorm:"type:uuid;index" json:"target_org_id,omitempty"`
	Variant      string         `gorm:"type:varchar(32);index" json:"variant"`
	Status       string         `gorm:"type:varchar(20);index" json:"status"`
	Number       string         `gorm:"type:varchar(128);index" json:"number"`
	Subject      string         `gorm:"type:varchar(255);index" json:"subject"`
	ToRole       string         `gorm:"type:varchar(255);index" json:"to_role"`
	ToName       string         `gorm:"type:varchar(255);index" json:"to_name"`
	ToPlace      string         `gorm:"type:varchar(255)" json:"to_place"`
	ToCity       string         `gorm:"type:varchar(255)" json:"to_city"`
	FileKey      string         `gorm:"type:varchar(512);index" json:"file_key"`
	FileURL      string         `gorm:"type:varchar(1024)" json:"file_url"`
	ApprovalNote string         `gorm:"type:text" json:"approval_note"`
	CreatedBy    *uuid.UUID     `gorm:"type:uuid;column:created_by" json:"created_by"`
	SubmittedBy  *uuid.UUID     `gorm:"type:uuid;column:submitted_by" json:"submitted_by"`
	ApprovedBy   *uuid.UUID     `gorm:"type:uuid;column:approved_by" json:"approved_by"`
	MetaJSON     datatypes.JSON `json:"meta_json"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
}

