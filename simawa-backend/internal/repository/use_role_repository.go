package repository

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"simawa-backend/internal/model"
)

type UserRoleRepository interface {
	Assign(ctx context.Context, ur *model.UserRole) error
	ListByUser(ctx context.Context, userID uuid.UUID) ([]model.Role, error)
	ListAssignments(ctx context.Context, userID uuid.UUID) ([]model.UserRole, error)
	EnsureBaseRoles(ctx context.Context) error
	AssignOrgRole(ctx context.Context, userID uuid.UUID, roleCode string, orgID uuid.UUID) error
	HasRoleForOrg(ctx context.Context, userID uuid.UUID, roleCode string, orgID uuid.UUID) (bool, error)
	HasAnyRoleForOrgPrefix(ctx context.Context, userID uuid.UUID, orgID uuid.UUID, prefix string) (bool, error)
	HasAnyRolePrefix(ctx context.Context, userID uuid.UUID, prefix string) (bool, error)
}

type userRoleRepository struct {
	db *gorm.DB
}

func NewUserRoleRepository(db *gorm.DB) UserRoleRepository {
	return &userRoleRepository{db: db}
}

func (r *userRoleRepository) Assign(ctx context.Context, ur *model.UserRole) error {
	return r.db.WithContext(ctx).
		Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "user_id"}, {Name: "role_code"}, {Name: "org_id"}},
			DoUpdates: clause.AssignmentColumns([]string{"role_code", "org_id"}),
		}).
		Create(ur).Error
}

func (r *userRoleRepository) ListByUser(ctx context.Context, userID uuid.UUID) ([]model.Role, error) {
	var roles []model.Role
	err := r.db.WithContext(ctx).
		Table("roles r").
		Select("r.*").
		Joins("join user_roles ur on ur.role_code = r.code").
		Where("ur.user_id = ?", userID).
		Scan(&roles).Error
	return roles, err
}

func (r *userRoleRepository) ListAssignments(ctx context.Context, userID uuid.UUID) ([]model.UserRole, error) {
	var rows []model.UserRole
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).Find(&rows).Error
	return rows, err
}

func (r *userRoleRepository) EnsureBaseRoles(ctx context.Context) error {
	roles := []model.Role{
		{Code: model.RoleAdmin, Name: "Admin"},
		{Code: model.RoleOrgAdmin, Name: "Organization Admin"},
		{Code: model.RoleBEMAdmin, Name: "BEM Admin"},
		{Code: model.RoleDEMAAdmin, Name: "DEMA Admin"},
		{Code: model.RoleUser, Name: "User"},
	}
	for _, v := range roles {
		var exist model.Role
		if err := r.db.WithContext(ctx).Where("code = ?", v.Code).First(&exist).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				if err := r.db.WithContext(ctx).Create(&v).Error; err != nil {
					return err
				}
			} else {
				return err
			}
		}
	}
	return nil
}

func (r *userRoleRepository) AssignOrgRole(ctx context.Context, userID uuid.UUID, roleCode string, orgID uuid.UUID) error {
	ur := &model.UserRole{
		UserID:   userID,
		RoleCode: strings.ToUpper(strings.TrimSpace(roleCode)),
		OrgID:    &orgID,
	}
	return r.Assign(ctx, ur)
}

func (r *userRoleRepository) HasRoleForOrg(ctx context.Context, userID uuid.UUID, roleCode string, orgID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&model.UserRole{}).
		Where("user_id = ? AND role_code = ? AND org_id = ?", userID, strings.ToUpper(strings.TrimSpace(roleCode)), orgID).
		Count(&count).Error
	return count > 0, err
}

func (r *userRoleRepository) HasAnyRoleForOrgPrefix(ctx context.Context, userID uuid.UUID, orgID uuid.UUID, prefix string) (bool, error) {
	p := strings.ToUpper(strings.TrimSpace(prefix))
	if p == "" {
		return false, errors.New("prefix required")
	}
	var count int64
	err := r.db.WithContext(ctx).
		Model(&model.UserRole{}).
		Where("user_id = ? AND org_id = ? AND role_code LIKE ?", userID, orgID, p+"%").
		Count(&count).Error
	return count > 0, err
}

func (r *userRoleRepository) HasAnyRolePrefix(ctx context.Context, userID uuid.UUID, prefix string) (bool, error) {
	p := strings.ToUpper(strings.TrimSpace(prefix))
	if p == "" {
		return false, errors.New("prefix required")
	}
	var count int64
	err := r.db.WithContext(ctx).
		Model(&model.UserRole{}).
		Where("user_id = ? AND role_code LIKE ?", userID, p+"%").
		Count(&count).Error
	return count > 0, err
}
