package dto

import "github.com/google/uuid"

// Create / Update Request payloads
type CreateUserRequest struct {
	Username     string `json:"username" binding:"required"`
	FirstName    string `json:"firstname" binding:"required"`
	SecondName   string `json:"secondname"`
	Organisasi   bool   `json:"organisasi"`
	UKM          string `json:"ukm"` // optional, empty allowed
	HMJ          string `json:"hmj"` // optional, empty allowed
	Jurusan      string `json:"jurusan" binding:"required"`
	NIM          string `json:"nim"`
	Email        string `json:"email" binding:"required,email"`
	Phone        string `json:"phone" binding:"required"`
	Alamat       string `json:"alamat" binding:"required"`
	TanggalLahir string `json:"tanggal_lahir" binding:"required"` // "yyyyMMdd", sekarang wajib
	Password     string `json:"password" binding:"required"`
}

type UpdateUserRequest struct {
	ID           uuid.UUID `json:"-"`
	FirstName    *string   `json:"firstname"`
	SecondName   *string   `json:"secondname"`
	Organisasi   *bool     `json:"organisasi"`
	UKM          *string   `json:"ukm"`
	HMJ          *string   `json:"hmj"`
	Jurusan      *string   `json:"jurusan"`
	Phone        *string   `json:"phone"`
	Alamat       *string   `json:"alamat"`
	TanggalLahir *string   `json:"tanggal_lahir"` // "yyyyMMdd"
	Password     *string   `json:"password"`
}

type UserListFilter struct {
	Q    string
	Page int
	Size int
}
