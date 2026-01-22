package repository

import (
	"context"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"simawa-backend/internal/model"
)

type UserRepository interface {
	Create(ctx context.Context, u *model.User) error
	Update(ctx context.Context, u *model.User) error
	DeleteByUUID(ctx context.Context, id uuid.UUID) error

	GetByUUID(ctx context.Context, id uuid.UUID) (*model.User, error)
	FindByLogin(ctx context.Context, login string) (*model.User, error) // login via email only
	CheckPassword(ctx context.Context, u *model.User, plain string) error
	ExistsByEmail(ctx context.Context, email string) (bool, error)

	List(ctx context.Context, q string, page, size int) ([]*model.User, int64, error)
	ListWithRoleFilter(ctx context.Context, q string, roleCode string, rolePrefix string, orgID *uuid.UUID, page, size int) ([]*model.User, int64, error)
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(ctx context.Context, u *model.User) error {
	return r.db.WithContext(ctx).Create(u).Error
}

func (r *userRepository) Update(ctx context.Context, u *model.User) error {
	return r.db.WithContext(ctx).Save(u).Error
}

func (r *userRepository) DeleteByUUID(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Delete related records first to avoid foreign key constraints
		// Order matters - delete child records before parent

		// Delete user roles
		if err := tx.Delete(&model.UserRole{}, "user_id = ?", id).Error; err != nil {
			return err
		}
		// Delete org memberships
		if err := tx.Delete(&model.OrgMember{}, "user_id = ?", id).Error; err != nil {
			return err
		}
		// Delete refresh tokens
		if err := tx.Delete(&model.RefreshToken{}, "user_id = ?", id).Error; err != nil {
			return err
		}
		// Delete notifications
		if err := tx.Delete(&model.Notification{}, "user_id = ?", id).Error; err != nil {
			return err
		}
		// Nullify org join requests (keep the request but remove user reference)
		if err := tx.Model(&model.OrgJoinRequest{}).Where("user_id = ?", id).Update("user_id", nil).Error; err != nil {
			return err
		}
		// Then delete the user
		return tx.Delete(&model.User{}, "id = ?", id).Error
	})
}

func (r *userRepository) GetByUUID(ctx context.Context, id uuid.UUID) (*model.User, error) {
	var u model.User
	if err := r.db.WithContext(ctx).First(&u, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *userRepository) FindByLogin(ctx context.Context, login string) (*model.User, error) {
	var u model.User
	email := strings.TrimSpace(strings.ToLower(login))
	if err := r.db.WithContext(ctx).
		Where("LOWER(email) = ?", email).
		First(&u).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *userRepository) CheckPassword(ctx context.Context, u *model.User, plain string) error {
	if u == nil {
		return gorm.ErrRecordNotFound
	}
	if err := bcryptCompare(u.PasswordHash, plain); err != nil {
		return err
	}
	return nil
}

func (r *userRepository) ExistsByEmail(ctx context.Context, email string) (bool, error) {
	var count int64
	emailLower := strings.TrimSpace(strings.ToLower(email))
	if err := r.db.WithContext(ctx).Model(&model.User{}).
		Where("LOWER(email) = ?", emailLower).
		Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *userRepository) List(ctx context.Context, q string, page, size int) ([]*model.User, int64, error) {
	if page < 1 {
		page = 1
	}
	if size <= 0 || size > 100 {
		size = 20
	}
	offset := (page - 1) * size

	var users []*model.User
	tx := r.db.WithContext(ctx).Model(&model.User{})
	if q != "" {
		tx = tx.Where(
			"username ILIKE ? OR first_name ILIKE ? OR second_name ILIKE ? OR email ILIKE ? OR nim ILIKE ?",
			"%"+q+"%",
			"%"+q+"%",
			"%"+q+"%",
			"%"+q+"%",
			"%"+q+"%",
		)
	}

	var total int64
	if err := tx.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if err := tx.Order("created_at DESC").Limit(size).Offset(offset).Find(&users).Error; err != nil {
		return nil, 0, err
	}
	return users, total, nil
}

func (r *userRepository) ListWithRoleFilter(ctx context.Context, q string, roleCode string, rolePrefix string, orgID *uuid.UUID, page, size int) ([]*model.User, int64, error) {
	if page < 1 {
		page = 1
	}
	if size <= 0 || size > 100 {
		size = 20
	}
	offset := (page - 1) * size

	roleCode = strings.TrimSpace(strings.ToUpper(roleCode))
	rolePrefix = strings.TrimSpace(strings.ToUpper(rolePrefix))

	var users []*model.User
	tx := r.db.WithContext(ctx).
		Model(&model.User{}).
		Joins("JOIN user_roles ur ON ur.user_id = users.id")

	if orgID != nil && *orgID != uuid.Nil {
		tx = tx.Where("ur.org_id = ?", *orgID)
	}
	if roleCode != "" {
		tx = tx.Where("ur.role_code = ?", roleCode)
	}
	if rolePrefix != "" {
		tx = tx.Where("ur.role_code LIKE ?", rolePrefix+"%")
	}

	if q != "" {
		tx = tx.Where(
			"users.username ILIKE ? OR users.first_name ILIKE ? OR users.second_name ILIKE ? OR users.email ILIKE ? OR users.nim ILIKE ?",
			"%"+q+"%",
			"%"+q+"%",
			"%"+q+"%",
			"%"+q+"%",
			"%"+q+"%",
		)
	}

	tx = tx.Distinct("users.*")

	var total int64
	if err := tx.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if err := tx.Order("users.created_at DESC").Limit(size).Offset(offset).Find(&users).Error; err != nil {
		return nil, 0, err
	}
	return users, total, nil
}
