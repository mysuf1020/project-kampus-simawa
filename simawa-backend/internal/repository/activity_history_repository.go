package repository

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"simawa-backend/internal/model"
)

type ActivityHistoryRepository interface {
	Create(ctx context.Context, h *model.ActivityHistory) error
	ListByActivity(ctx context.Context, activityID uuid.UUID) ([]model.ActivityHistory, error)
}

type activityHistoryRepository struct {
	db *gorm.DB
}

func NewActivityHistoryRepository(db *gorm.DB) ActivityHistoryRepository {
	return &activityHistoryRepository{db: db}
}

func (r *activityHistoryRepository) Create(ctx context.Context, h *model.ActivityHistory) error {
	return r.db.WithContext(ctx).Create(h).Error
}

func (r *activityHistoryRepository) ListByActivity(ctx context.Context, activityID uuid.UUID) ([]model.ActivityHistory, error) {
	var rows []model.ActivityHistory
	if err := r.db.WithContext(ctx).
		Where("activity_id = ?", activityID).
		Order("created_at ASC").
		Find(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}
