package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"simawa-backend/internal/model"
)

type RefreshTokenRepository interface {
	Create(ctx context.Context, rt *model.RefreshToken) error
	Get(ctx context.Context, token string) (*model.RefreshToken, error)
	Rotate(ctx context.Context, oldToken string, newRT *model.RefreshToken) error
	Revoke(ctx context.Context, token string) error
	DeleteByUser(ctx context.Context, userID uuid.UUID) error
	PurgeExpired(ctx context.Context, before time.Time) (int64, error)
}

type refreshTokenRepository struct {
	db *gorm.DB
}

func NewRefreshTokenRepository(db *gorm.DB) RefreshTokenRepository {
	return &refreshTokenRepository{db: db}
}

func (r *refreshTokenRepository) Create(ctx context.Context, rt *model.RefreshToken) error {
	return r.db.WithContext(ctx).Create(rt).Error
}

func (r *refreshTokenRepository) Get(ctx context.Context, token string) (*model.RefreshToken, error) {
	var rt model.RefreshToken
	if err := r.db.WithContext(ctx).First(&rt, "token = ?", token).Error; err != nil {
		return nil, err
	}
	return &rt, nil
}

func (r *refreshTokenRepository) Rotate(ctx context.Context, oldToken string, newRT *model.RefreshToken) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Delete(&model.RefreshToken{}, "token = ?", oldToken).Error; err != nil {
			return err
		}
		return tx.Create(newRT).Error
	})
}

func (r *refreshTokenRepository) Revoke(ctx context.Context, token string) error {
	return r.db.WithContext(ctx).Model(&model.RefreshToken{}).
		Where("token = ?", token).
		Update("revoked_at", time.Now()).
		Error
}

func (r *refreshTokenRepository) DeleteByUser(ctx context.Context, userID uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&model.RefreshToken{}, "user_id = ?", userID).Error
}

func (r *refreshTokenRepository) PurgeExpired(ctx context.Context, before time.Time) (int64, error) {
	res := r.db.WithContext(ctx).Where("expires_at < ?", before).Delete(&model.RefreshToken{})
	return res.RowsAffected, res.Error
}
