package repository

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"simawa-backend/internal/model"
)

type NotificationRepository interface {
	Create(ctx context.Context, n *model.Notification) error
	ListByUser(ctx context.Context, userID uuid.UUID, limit int) ([]model.Notification, error)
	MarkRead(ctx context.Context, id uuid.UUID, userID uuid.UUID) error
}

type notificationRepository struct {
	db *gorm.DB
}

func NewNotificationRepository(db *gorm.DB) NotificationRepository {
	return &notificationRepository{db: db}
}

func (r *notificationRepository) Create(ctx context.Context, n *model.Notification) error {
	return r.db.WithContext(ctx).Create(n).Error
}

func (r *notificationRepository) ListByUser(ctx context.Context, userID uuid.UUID, limit int) ([]model.Notification, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	var rows []model.Notification
	if err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).
		Find(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

func (r *notificationRepository) MarkRead(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	return r.db.WithContext(ctx).
		Model(&model.Notification{}).
		Where("id = ? AND user_id = ?", id, userID).
		Update("read_at", gorm.Expr("NOW()")).Error
}

func (r *notificationRepository) CountUnread(ctx context.Context, userID uuid.UUID) (int64, error) {
	var c int64
	err := r.db.WithContext(ctx).Model(&model.Notification{}).Where("user_id = ? AND read_at IS NULL", userID).Count(&c).Error
	return c, err
}
