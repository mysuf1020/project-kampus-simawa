package repository

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"simawa-backend/internal/model"
)

type OrgMemberRepository interface {
	Add(ctx context.Context, m *model.OrgMember) error
	ListByOrg(ctx context.Context, orgID uuid.UUID) ([]model.OrgMember, error)
	IsMember(ctx context.Context, orgID uuid.UUID, userID uuid.UUID) (bool, error)
	UpdateRole(ctx context.Context, orgID uuid.UUID, userID uuid.UUID, role string) error
	Delete(ctx context.Context, orgID uuid.UUID, userID uuid.UUID) error
}

type orgMemberRepository struct {
	db *gorm.DB
}

func NewOrgMemberRepository(db *gorm.DB) OrgMemberRepository {
	return &orgMemberRepository{db: db}
}

func (r *orgMemberRepository) Add(ctx context.Context, m *model.OrgMember) error {
	return r.db.WithContext(ctx).Create(m).Error
}

func (r *orgMemberRepository) ListByOrg(ctx context.Context, orgID uuid.UUID) ([]model.OrgMember, error) {
	var rows []model.OrgMember
	if err := r.db.WithContext(ctx).Preload("User").Where("org_id = ?", orgID).Find(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

func (r *orgMemberRepository) IsMember(ctx context.Context, orgID uuid.UUID, userID uuid.UUID) (bool, error) {
	var count int64
	if err := r.db.WithContext(ctx).
		Model(&model.OrgMember{}).
		Where("org_id = ? AND user_id = ?", orgID, userID).
		Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *orgMemberRepository) UpdateRole(ctx context.Context, orgID uuid.UUID, userID uuid.UUID, role string) error {
	return r.db.WithContext(ctx).
		Model(&model.OrgMember{}).
		Where("org_id = ? AND user_id = ?", orgID, userID).
		Update("role", role).Error
}

func (r *orgMemberRepository) Delete(ctx context.Context, orgID uuid.UUID, userID uuid.UUID) error {
	return r.db.WithContext(ctx).
		Where("org_id = ? AND user_id = ?", orgID, userID).
		Delete(&model.OrgMember{}).Error
}
