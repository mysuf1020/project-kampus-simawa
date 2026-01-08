package repository

import (
	"context"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"simawa-backend/internal/model"
)

type ListSuratQuery struct {
	Q           string
	Variant     string
	Status      string
	DateFrom    string
	DateTo      string
	OrgID       *uuid.UUID
	TargetOrgID *uuid.UUID
	ToRole      string
	ForOrgIDs   []uuid.UUID
	ForRoles    []string
	Page        int
	Size        int
}

type SuratRepository interface {
	Create(ctx context.Context, m *model.Surat) error
	Update(ctx context.Context, m *model.Surat) error
	Get(ctx context.Context, id uint) (*model.Surat, error)
	List(ctx context.Context, q ListSuratQuery) ([]model.Surat, int64, error)
}

type suratRepository struct{ db *gorm.DB }

func NewSuratRepository(db *gorm.DB) SuratRepository { return &suratRepository{db: db} }

func (r *suratRepository) Create(ctx context.Context, m *model.Surat) error {
	return r.db.WithContext(ctx).Create(m).Error
}

func (r *suratRepository) Update(ctx context.Context, m *model.Surat) error {
	return r.db.WithContext(ctx).Save(m).Error
}

func (r *suratRepository) Get(ctx context.Context, id uint) (*model.Surat, error) {
	var row model.Surat
	if err := r.db.WithContext(ctx).First(&row, id).Error; err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *suratRepository) List(ctx context.Context, q ListSuratQuery) ([]model.Surat, int64, error) {
	var rows []model.Surat
	tx := r.db.WithContext(ctx).Model(&model.Surat{})

	if q.Q != "" {
		tx = tx.Where("subject ILIKE ? OR number ILIKE ? OR to_name ILIKE ?", "%"+q.Q+"%", "%"+q.Q+"%", "%"+q.Q+"%")
	}
	if q.Variant != "" {
		tx = tx.Where("variant = ?", q.Variant)
	}
	if q.Status != "" {
		tx = tx.Where("status = ?", strings.ToUpper(q.Status))
	}
	if q.DateFrom != "" {
		tx = tx.Where("created_at >= ?", q.DateFrom)
	}
	if q.DateTo != "" {
		tx = tx.Where("created_at <= ?", q.DateTo)
	}
	if q.OrgID != nil {
		tx = tx.Where("org_id = ?", *q.OrgID)
	}
	if q.TargetOrgID != nil {
		tx = tx.Where("target_org_id = ?", *q.TargetOrgID)
	}
	if q.ToRole != "" {
		tx = tx.Where("to_role = ?", q.ToRole)
	}
	if len(q.ForOrgIDs) > 0 || len(q.ForRoles) > 0 {
		tx = tx.Where(func(db *gorm.DB) *gorm.DB {
			sub := db
			first := true
			if len(q.ForOrgIDs) > 0 {
				sub = sub.Where("org_id IN ? OR target_org_id IN ?", q.ForOrgIDs, q.ForOrgIDs)
				first = false
			}
			if len(q.ForRoles) > 0 {
				if first {
					sub = sub.Where("to_role IN ?", q.ForRoles)
				} else {
					sub = sub.Or("to_role IN ?", q.ForRoles)
				}
			}
			return sub
		})
	}

	var total int64
	_ = tx.Count(&total).Error

	page := q.Page
	if page < 1 {
		page = 1
	}
	size := q.Size
	if size <= 0 || size > 100 {
		size = 10
	}
	offset := (page - 1) * size

	if err := tx.Order("id DESC").Limit(size).Offset(offset).Find(&rows).Error; err != nil {
		return nil, 0, err
	}
	return rows, total, nil
}
