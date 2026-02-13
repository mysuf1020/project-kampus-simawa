package model

import (
	"time"

	"github.com/google/uuid"
)

const (
	AssetStatusAvailable = "AVAILABLE"
	AssetStatusBorrowed  = "BORROWED"
)

type Asset struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	OrgID       uuid.UUID `gorm:"type:uuid;index" json:"org_id"`
	Name        string    `gorm:"size:255;not null" json:"name"`
	Description string    `gorm:"size:512" json:"description"`
	Quantity    int       `gorm:"default:1" json:"quantity"`
	Status      string    `gorm:"size:20;default:AVAILABLE;index" json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type AssetBorrowing struct {
	ID           uint       `gorm:"primaryKey" json:"id"`
	AssetID      uint       `gorm:"index" json:"asset_id"`
	SuratID      *uint      `gorm:"index" json:"surat_id,omitempty"`
	BorrowerID   uuid.UUID  `gorm:"type:uuid;index" json:"borrower_id"`
	OrgID        uuid.UUID  `gorm:"type:uuid;index" json:"org_id"`
	Quantity     int        `gorm:"default:1" json:"quantity"`
	BorrowDate   time.Time  `json:"borrow_date"`
	ReturnDate   time.Time  `json:"return_date"`
	ReturnedAt   *time.Time `json:"returned_at,omitempty"`
	Status       string     `gorm:"size:20;default:BORROWED;index" json:"status"` // BORROWED, RETURNED
	Note         string     `gorm:"size:512" json:"note"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`

	// Relations (for JSON response)
	Asset *Asset `gorm:"foreignKey:AssetID" json:"asset,omitempty"`
}
