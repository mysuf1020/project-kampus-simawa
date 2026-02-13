package repository

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"simawa-backend/internal/model"
)

type LPJRepository interface {
	Create(ctx context.Context, lpj *model.LPJ) error
	Update(ctx context.Context, lpj *model.LPJ) error
	GetByActivity(ctx context.Context, activityID uuid.UUID) (*model.LPJ, error)
	Get(ctx context.Context, id uuid.UUID) (*model.LPJ, error)
	ListByOrg(ctx context.Context, orgID uuid.UUID, status string, page, size int) ([]model.LPJ, error)
	ListAll(ctx context.Context, status string, page, size int) ([]model.LPJ, error)
}

type lpjRepository struct {
	db *gorm.DB
}

func NewLPJRepository(db *gorm.DB) LPJRepository {
	return &lpjRepository{db: db}
}

func (r *lpjRepository) Create(ctx context.Context, lpj *model.LPJ) error {
	return r.db.WithContext(ctx).Create(lpj).Error
}

func (r *lpjRepository) Update(ctx context.Context, lpj *model.LPJ) error {
	return r.db.WithContext(ctx).Save(lpj).Error
}

func (r *lpjRepository) GetByActivity(ctx context.Context, activityID uuid.UUID) (*model.LPJ, error) {
	var lpj model.LPJ
	if err := r.db.WithContext(ctx).First(&lpj, "activity_id = ?", activityID).Error; err != nil {
		return nil, err
	}
	return &lpj, nil
}

func (r *lpjRepository) Get(ctx context.Context, id uuid.UUID) (*model.LPJ, error) {
	var lpj model.LPJ
	if err := r.db.WithContext(ctx).First(&lpj, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &lpj, nil
}

func (r *lpjRepository) ListAll(ctx context.Context, status string, page, size int) ([]model.LPJ, error) {
	var rows []model.LPJ
	q := r.db.WithContext(ctx)
	if status != "" {
		q = q.Where("status = ?", status)
	}
	if page <= 0 {
		page = 1
	}
	if size <= 0 || size > 100 {
		size = 10
	}
	offset := (page - 1) * size
	if err := q.Order("created_at DESC").Limit(size).Offset(offset).Find(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

func (r *lpjRepository) ListByOrg(ctx context.Context, orgID uuid.UUID, status string, page, size int) ([]model.LPJ, error) {
	var rows []model.LPJ
	q := r.db.WithContext(ctx).Where("org_id = ?", orgID)
	if status != "" {
		q = q.Where("status = ?", status)
	}
	if page <= 0 {
		page = 1
	}
	if size <= 0 || size > 100 {
		size = 10
	}
	offset := (page - 1) * size
	if err := q.Order("created_at DESC").Limit(size).Offset(offset).Find(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}
