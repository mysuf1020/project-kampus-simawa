package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"

	"simawa-backend/internal/model"
	"simawa-backend/internal/repository"
)

var (
	ErrInvalidEmailDomain = errors.New("email must end with @raharja.info")
	ErrPasswordWeak       = errors.New("password does not meet minimal strength")
	ErrOrgMissing         = errors.New("when organisasi=true, either ukm or hmj must be provided")
	ErrBirthDateRequired  = errors.New("birth_date is required (yyyyMMdd)")
	ErrBirthDateInvalid   = errors.New("birth_date must be in format yyyyMMdd")
)

type UserService struct {
	users repository.UserRepository
}

func NewUserService(users repository.UserRepository) *UserService {
	return &UserService{users: users}
}

// --------- DTOs for service layer ---------
type CreateUserInput struct {
	Username   string
	FirstName  string
	SecondName string
	Organisasi bool
	UKM        string // optional; will be converted to *string
	HMJ        string // optional; will be converted to *string
	Jurusan    string
	NIM        string
	Email      string
	Phone      string
	Alamat     string
	BirthRaw   string // "20020415" (yyyyMMdd) dari request; sekarang wajib
	Password   string // plaintext from request
}

type UpdateUserInput struct {
	ID         uuid.UUID
	FirstName  *string
	SecondName *string
	Organisasi *bool
	UKM        *string // pointer => nullable update
	HMJ        *string
	Jurusan    *string
	Phone      *string
	Alamat     *string
	BirthRaw   *string
	Password   *string // optional to change
}

type UserFilter struct {
	Q    string
	Page int
	Size int
	RoleCode   string
	RolePrefix string
	OrgID      *uuid.UUID
}

// --------- Business rules ---------
func (s *UserService) Create(ctx context.Context, in *CreateUserInput) (*model.User, error) {
	if !strings.HasSuffix(strings.ToLower(in.Email), "@raharja.info") {
		return nil, ErrInvalidEmailDomain
	}
	if in.Organisasi {
		if strings.TrimSpace(in.UKM) == "" && strings.TrimSpace(in.HMJ) == "" {
			return nil, ErrOrgMissing
		}
	}
	if !isStrongPassword(in.Password) {
		return nil, ErrPasswordWeak
	}
	hashed, err := repository.BcryptHash(in.Password)
	if err != nil {
		return nil, err
	}

	birthStr := strings.TrimSpace(in.BirthRaw)
	if birthStr == "" {
		return nil, ErrBirthDateRequired
	}
	birthTime, ok := parseYYYYMMDD(birthStr)
	if !ok {
		return nil, ErrBirthDateInvalid
	}

	ukmTrimmed := strings.TrimSpace(in.UKM)
	hmjTrimmed := strings.TrimSpace(in.HMJ)

	u := &model.User{
		Username:     in.Username,
		FirstName:    in.FirstName,
		SecondName:   in.SecondName,
		Organisasi:   in.Organisasi,
		Jurusan:      in.Jurusan,
		NIM:          in.NIM,
		Email:        in.Email,
		Phone:        in.Phone,
		Alamat:       in.Alamat,
		BirthDate:    &birthTime,
		PasswordHash: hashed,
	}
	// kolom UKM/HMJ di DB sekarang NOT NULL (default ""), jadi selalu isi pointer
	u.UKM = &ukmTrimmed
	u.HMJ = &hmjTrimmed

	if err := s.users.Create(ctx, u); err != nil {
		return nil, err
	}
	return u, nil
}

func (s *UserService) Update(ctx context.Context, in *UpdateUserInput) (*model.User, error) {
	u, err := s.users.GetByUUID(ctx, in.ID)
	if err != nil {
		return nil, err
	}
	if in.FirstName != nil {
		u.FirstName = *in.FirstName
	}
	if in.SecondName != nil {
		u.SecondName = *in.SecondName
	}
	if in.Organisasi != nil {
		u.Organisasi = *in.Organisasi
	}
	if in.UKM != nil {
		trimmed := strings.TrimSpace(*in.UKM)
		u.UKM = &trimmed
	}
	if in.HMJ != nil {
		trimmed := strings.TrimSpace(*in.HMJ)
		u.HMJ = &trimmed
	}
	if in.Jurusan != nil {
		u.Jurusan = *in.Jurusan
	}
	if in.Phone != nil {
		u.Phone = *in.Phone
	}
	if in.Alamat != nil {
		u.Alamat = *in.Alamat
	}
	if in.BirthRaw != nil {
		trimmed := strings.TrimSpace(*in.BirthRaw)
		if trimmed != "" {
			if t, ok := parseYYYYMMDD(trimmed); ok {
				u.BirthDate = &t
			} else {
				return nil, ErrBirthDateInvalid
			}
		}
	}
	if in.Password != nil && *in.Password != "" {
		if !isStrongPassword(*in.Password) {
			return nil, ErrPasswordWeak
		}
		h, err := repository.BcryptHash(*in.Password)
		if err != nil {
			return nil, err
		}
		u.PasswordHash = h
	}
	if err := s.users.Update(ctx, u); err != nil {
		return nil, err
	}
	return u, nil
}

func (s *UserService) Get(ctx context.Context, id uuid.UUID) (*model.User, error) {
	return s.users.GetByUUID(ctx, id)
}

func (s *UserService) List(ctx context.Context, f UserFilter) ([]*model.User, int64, error) {
	page := f.Page
	if page <= 0 {
		page = 1
	}
	size := f.Size
	if size <= 0 || size > 100 {
		size = 10
	}
	if f.OrgID != nil || strings.TrimSpace(f.RoleCode) != "" || strings.TrimSpace(f.RolePrefix) != "" {
		return s.users.ListWithRoleFilter(ctx, f.Q, f.RoleCode, f.RolePrefix, f.OrgID, page, size)
	}
	return s.users.List(ctx, f.Q, page, size)
}

func (s *UserService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.users.DeleteByUUID(ctx, id)
}

// ---- helpers ----
func isStrongPassword(pw string) bool {
	// sederhana: minimal 8 char, ada huruf besar, huruf kecil, angka
	if len(pw) < 8 {
		return false
	}
	var up, low, num bool
	for _, r := range pw {
		switch {
		case 'A' <= r && r <= 'Z':
			up = true
		case 'a' <= r && r <= 'z':
			low = true
		case '0' <= r && r <= '9':
			num = true
		}
	}
	return up && low && num
}

func parseYYYYMMDD(s string) (time.Time, bool) {
	if len(s) != 8 {
		return time.Time{}, false
	}
	year := s[0:4]
	month := s[4:6]
	day := s[6:8]
	t, err := time.Parse("2006-01-02", year+"-"+month+"-"+day)
	return t, err == nil
}
