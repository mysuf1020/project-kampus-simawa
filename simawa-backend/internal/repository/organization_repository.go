package repository

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"simawa-backend/internal/model"
)

type OrganizationRepository interface {
	Create(ctx context.Context, org *model.Organization) error
	Update(ctx context.Context, org *model.Organization) error
	GetByID(ctx context.Context, id uuid.UUID) (*model.Organization, error)
	GetBySlug(ctx context.Context, slug string) (*model.Organization, error)
	List(ctx context.Context, orgType string) ([]model.Organization, error)
	EnsureSeeds(ctx context.Context, seeds []model.Organization) error
}

type organizationRepository struct {
	db *gorm.DB
}

func NewOrganizationRepository(db *gorm.DB) OrganizationRepository {
	return &organizationRepository{db: db}
}

func (r *organizationRepository) Create(ctx context.Context, org *model.Organization) error {
	return r.db.WithContext(ctx).Create(org).Error
}

func (r *organizationRepository) Update(ctx context.Context, org *model.Organization) error {
	return r.db.WithContext(ctx).Save(org).Error
}

func (r *organizationRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.Organization, error) {
	var org model.Organization
	if err := r.db.WithContext(ctx).First(&org, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &org, nil
}

func (r *organizationRepository) GetBySlug(ctx context.Context, slug string) (*model.Organization, error) {
	var org model.Organization
	if err := r.db.WithContext(ctx).First(&org, "slug = ?", slug).Error; err != nil {
		return nil, err
	}
	return &org, nil
}

func (r *organizationRepository) List(ctx context.Context, orgType string) ([]model.Organization, error) {
	var orgs []model.Organization
	q := r.db.WithContext(ctx).Model(&model.Organization{})
	if orgType != "" {
		q = q.Where("type = ?", orgType)
	}
	if err := q.Order("name ASC").Find(&orgs).Error; err != nil {
		return nil, err
	}
	return orgs, nil
}

func (r *organizationRepository) EnsureSeeds(ctx context.Context, seeds []model.Organization) error {
	for _, s := range seeds {
		var existing model.Organization
		if err := r.db.WithContext(ctx).Where("slug = ?", s.Slug).First(&existing).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				if err := r.db.WithContext(ctx).Create(&s).Error; err != nil {
					return err
				}
			} else {
				return err
			}
		}
	}
	return nil
}
