package repository

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"simawa-backend/internal/model"
)

type LPJHistoryRepository interface {
	Create(ctx context.Context, h *model.LPJHistory) error
	ListByActivity(ctx context.Context, activityID uuid.UUID) ([]model.LPJHistory, error)
}

type lpjHistoryRepository struct {
	db *gorm.DB
}

func NewLPJHistoryRepository(db *gorm.DB) LPJHistoryRepository {
	return &lpjHistoryRepository{db: db}
}

func (r *lpjHistoryRepository) Create(ctx context.Context, h *model.LPJHistory) error {
	return r.db.WithContext(ctx).Create(h).Error
}

func (r *lpjHistoryRepository) ListByActivity(ctx context.Context, activityID uuid.UUID) ([]model.LPJHistory, error) {
	var rows []model.LPJHistory
	if err := r.db.WithContext(ctx).Where("activity_id = ?", activityID).Order("created_at ASC").Find(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}
