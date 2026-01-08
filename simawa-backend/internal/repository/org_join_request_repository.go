package repository

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"simawa-backend/internal/model"
)

type OrgJoinRequestRepository interface {
	Create(ctx context.Context, r *model.OrgJoinRequest) error
	GetByID(ctx context.Context, id uuid.UUID) (*model.OrgJoinRequest, error)
	ListByOrg(ctx context.Context, orgID uuid.UUID, status string) ([]model.OrgJoinRequest, error)
	FindPendingByOrgUser(ctx context.Context, orgID uuid.UUID, userID uuid.UUID) (*model.OrgJoinRequest, error)
	FindPendingByOrgEmail(ctx context.Context, orgID uuid.UUID, email string) (*model.OrgJoinRequest, error)
	Update(ctx context.Context, r *model.OrgJoinRequest) error
}

type orgJoinRequestRepository struct {
	db *gorm.DB
}

func NewOrgJoinRequestRepository(db *gorm.DB) OrgJoinRequestRepository {
	return &orgJoinRequestRepository{db: db}
}

func (r *orgJoinRequestRepository) Create(ctx context.Context, req *model.OrgJoinRequest) error {
	return r.db.WithContext(ctx).Create(req).Error
}

func (r *orgJoinRequestRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.OrgJoinRequest, error) {
	var row model.OrgJoinRequest
	if err := r.db.WithContext(ctx).First(&row, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *orgJoinRequestRepository) ListByOrg(ctx context.Context, orgID uuid.UUID, status string) ([]model.OrgJoinRequest, error) {
	var rows []model.OrgJoinRequest
	q := r.db.WithContext(ctx).Model(&model.OrgJoinRequest{}).Where("org_id = ?", orgID)
	if status != "" {
		q = q.Where("status = ?", status)
	}
	if err := q.Order("created_at DESC").Find(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

func (r *orgJoinRequestRepository) FindPendingByOrgUser(ctx context.Context, orgID uuid.UUID, userID uuid.UUID) (*model.OrgJoinRequest, error) {
	var row model.OrgJoinRequest
	if err := r.db.WithContext(ctx).
		First(&row, "org_id = ? AND user_id = ? AND status = ?", orgID, userID, model.OrgJoinRequestPending).
		Error; err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *orgJoinRequestRepository) FindPendingByOrgEmail(ctx context.Context, orgID uuid.UUID, email string) (*model.OrgJoinRequest, error) {
	var row model.OrgJoinRequest
	if err := r.db.WithContext(ctx).
		First(&row, "org_id = ? AND applicant_email = ? AND status = ?", orgID, email, model.OrgJoinRequestPending).
		Error; err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *orgJoinRequestRepository) Update(ctx context.Context, req *model.OrgJoinRequest) error {
	return r.db.WithContext(ctx).Save(req).Error
}
