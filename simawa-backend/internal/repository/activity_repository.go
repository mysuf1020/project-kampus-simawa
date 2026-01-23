package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"simawa-backend/internal/model"
)

type ActivityRepository interface {
	Create(ctx context.Context, a *model.Activity) error
	Update(ctx context.Context, a *model.Activity) error
	Get(ctx context.Context, id uuid.UUID) (*model.Activity, error)
	List(ctx context.Context, orgID uuid.UUID, status, actType string, publicOnly bool, page, size int, start, end time.Time) ([]model.Activity, error)
	ListPublic(ctx context.Context, from time.Time) ([]model.Activity, error)
}

type activityRepository struct {
	db *gorm.DB
}

func NewActivityRepository(db *gorm.DB) ActivityRepository {
	return &activityRepository{db: db}
}

func (r *activityRepository) Create(ctx context.Context, a *model.Activity) error {
	return r.db.WithContext(ctx).Create(a).Error
}

func (r *activityRepository) Update(ctx context.Context, a *model.Activity) error {
	return r.db.WithContext(ctx).Save(a).Error
}

func (r *activityRepository) Get(ctx context.Context, id uuid.UUID) (*model.Activity, error) {
	var a model.Activity
	if err := r.db.WithContext(ctx).First(&a, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *activityRepository) List(ctx context.Context, orgID uuid.UUID, status, actType string, publicOnly bool, page, size int, start, end time.Time) ([]model.Activity, error) {
	var rows []model.Activity
	q := r.db.WithContext(ctx).Model(&model.Activity{}).Where("org_id = ?", orgID)
	if status != "" {
		q = q.Where("status = ?", status)
	}
	if actType != "" {
		q = q.Where("type = ?", actType)
	}
	if publicOnly {
		q = q.Where("public = ?", true)
	}
	if !start.IsZero() {
		q = q.Where("start_at >= ?", start)
	}
	if !end.IsZero() {
		q = q.Where("start_at <= ?", end)
	}
	if page <= 0 {
		page = 1
	}
	if size <= 0 || size > 100 {
		size = 10
	}
	offset := (page - 1) * size
	if err := q.Order("start_at ASC").Limit(size).Offset(offset).Find(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

func (r *activityRepository) ListPublic(ctx context.Context, from time.Time) ([]model.Activity, error) {
	var rows []model.Activity
	if err := r.db.WithContext(ctx).
		Model(&model.Activity{}).
		Where("public = ? AND status = ?", true, model.ActivityStatusApproved).
		Where("start_at >= ?", from).
		Order("start_at ASC").
		Find(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

