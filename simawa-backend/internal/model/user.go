package model

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID         uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Username   string    `gorm:"uniqueIndex;size:64;not null" json:"username"`
	FirstName  string    `gorm:"size:64;not null" json:"first_name"`
	SecondName string    `gorm:"size:64;not null;default:''" json:"second_name"`

	Organisasi bool    `gorm:"not null;default:false" json:"organisasi"`
	UKM        *string `gorm:"size:64;not null;default:''" json:"ukm"` // tetap pakai string pointer tapi NOT NULL di DB
	HMJ        *string `gorm:"size:64;not null;default:''" json:"hmj"` // tergantung jenis organisasi

	Jurusan string `gorm:"size:128;not null" json:"jurusan"`
	NIM     string `gorm:"size:32;index;default:''" json:"nim"`
	Email   string `gorm:"uniqueIndex;size:128;not null" json:"email"`
	Phone   string `gorm:"size:32;not null;default:''" json:"phone"`
	Alamat  string `gorm:"size:255;not null;default:''" json:"alamat"`

	BirthDate    *time.Time `gorm:"not null" json:"birth_date"` // sekarang wajib terisi
	PasswordHash string     `gorm:"size:255;not null" json:"-"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
