package repository

import (
	"context"

	"gorm.io/gorm"

	"simawa-backend/internal/model"
)

type SuratTemplateRepository interface {
	Create(ctx context.Context, t *model.SuratTemplate) error
	Update(ctx context.Context, t *model.SuratTemplate) error
	Delete(ctx context.Context, id uint) error
	Get(ctx context.Context, id uint) (*model.SuratTemplate, error)
	List(ctx context.Context) ([]model.SuratTemplate, error)
}

type suratTemplateRepository struct{ db *gorm.DB }

func NewSuratTemplateRepository(db *gorm.DB) SuratTemplateRepository {
	return &suratTemplateRepository{db: db}
}

func (r *suratTemplateRepository) Create(ctx context.Context, t *model.SuratTemplate) error {
	return r.db.WithContext(ctx).Create(t).Error
}
func (r *suratTemplateRepository) Update(ctx context.Context, t *model.SuratTemplate) error {
	return r.db.WithContext(ctx).Save(t).Error
}
func (r *suratTemplateRepository) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&model.SuratTemplate{}, id).Error
}
func (r *suratTemplateRepository) Get(ctx context.Context, id uint) (*model.SuratTemplate, error) {
	var row model.SuratTemplate
	if err := r.db.WithContext(ctx).First(&row, id).Error; err != nil {
		return nil, err
	}
	return &row, nil
}
func (r *suratTemplateRepository) List(ctx context.Context) ([]model.SuratTemplate, error) {
	var rows []model.SuratTemplate
	if err := r.db.WithContext(ctx).Order("id DESC").Find(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}
