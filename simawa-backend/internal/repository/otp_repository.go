package repository

import (
	"context"
	"time"

	"gorm.io/gorm"
	"simawa-backend/internal/model"
)

type OTPRepository interface {
	Create(ctx context.Context, otp *model.OTP) error
	GetValid(ctx context.Context, email, purpose string) (*model.OTP, error)
	MarkUsed(ctx context.Context, id interface{}) error
	DeleteExpired(ctx context.Context) error
}

type otpRepository struct {
	db *gorm.DB
}

func NewOTPRepository(db *gorm.DB) OTPRepository {
	return &otpRepository{db: db}
}

func (r *otpRepository) Create(ctx context.Context, otp *model.OTP) error {
	// Delete any existing unused OTP for this email+purpose first
	r.db.WithContext(ctx).
		Where("email = ? AND purpose = ? AND used_at IS NULL", otp.Email, otp.Purpose).
		Delete(&model.OTP{})
	
	return r.db.WithContext(ctx).Create(otp).Error
}

func (r *otpRepository) GetValid(ctx context.Context, email, purpose string) (*model.OTP, error) {
	var otp model.OTP
	err := r.db.WithContext(ctx).
		Where("email = ? AND purpose = ? AND used_at IS NULL AND expires_at > ?", 
			email, purpose, time.Now()).
		Order("created_at DESC").
		First(&otp).Error
	if err != nil {
		return nil, err
	}
	return &otp, nil
}

func (r *otpRepository) MarkUsed(ctx context.Context, id interface{}) error {
	now := time.Now()
	return r.db.WithContext(ctx).
		Model(&model.OTP{}).
		Where("id = ?", id).
		Update("used_at", &now).Error
}

func (r *otpRepository) DeleteExpired(ctx context.Context) error {
	return r.db.WithContext(ctx).
		Where("expires_at < ? OR used_at IS NOT NULL", time.Now()).
		Delete(&model.OTP{}).Error
}
