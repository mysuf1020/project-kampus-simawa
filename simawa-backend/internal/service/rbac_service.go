package service

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"simawa-backend/internal/model"
	"simawa-backend/internal/repository"
)

type RBACService struct {
	userRoles repository.UserRoleRepository
}

// NewRBACService builds an RBACService.
func NewRBACService(userRoles repository.UserRoleRepository) *RBACService {
	return &RBACService{userRoles: userRoles}
}

// HasRole returns true jika user punya role (berdasarkan code).
func (s *RBACService) HasRole(ctx context.Context, userID uuid.UUID, roleCode string) (bool, error) {
	roles, err := s.userRoles.ListByUser(ctx, userID)
	if err != nil {
		return false, err
	}
	target := strings.ToUpper(strings.TrimSpace(roleCode))
	for _, r := range roles {
		if strings.EqualFold(r.Code, target) {
			return true, nil
		}
	}
	return false, nil
}

// RequireAny memastikan user punya salah satu role yang dibutuhkan.
func (s *RBACService) RequireAny(ctx context.Context, userID uuid.UUID, roleCodes ...string) error {
	if len(roleCodes) == 0 {
		return errors.New("no role codes provided")
	}
	roles, err := s.userRoles.ListByUser(ctx, userID)
	if err != nil {
		return err
	}
	set := map[string]struct{}{}
	for _, rc := range roleCodes {
		set[strings.ToUpper(strings.TrimSpace(rc))] = struct{}{}
	}
	for _, r := range roles {
		if _, ok := set[strings.ToUpper(r.Code)]; ok {
			return nil
		}
	}
	return errors.New("forbidden: missing required role")
}

// IsAdmin adalah helper untuk ADMIN/BEM/DEMA.
func (s *RBACService) IsAdmin(ctx context.Context, userID uuid.UUID) (bool, error) {
	return s.RequireAny(ctx, userID, model.RoleAdmin, model.RoleBEMAdmin, model.RoleDEMAAdmin) == nil, nil
}

// IsOrg adalah helper untuk ORG_ADMIN.
func (s *RBACService) IsOrg(ctx context.Context, userID uuid.UUID) (bool, error) {
	return s.RequireAny(ctx, userID, model.RoleOrgAdmin) == nil, nil
}

// UserHasAnyRole is a helper used by middleware to check any allowed roles.
func (s *RBACService) UserHasAnyRole(ctx context.Context, userID uuid.UUID, allowed []string) (bool, error) {
	if err := s.RequireAny(ctx, userID, allowed...); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

// CanSearchUsers allows internal managers to search user directory (for adding members):
// - ADMIN / BEM_ADMIN / DEMA_ADMIN allowed
// - Any org-scoped role (ORG_*) allowed
func (s *RBACService) CanSearchUsers(ctx context.Context, userID uuid.UUID) (bool, error) {
	if err := s.RequireAny(ctx, userID, model.RoleAdmin, model.RoleBEMAdmin, model.RoleDEMAAdmin); err == nil {
		return true, nil
	}
	ok, err := s.userRoles.HasAnyRolePrefix(ctx, userID, "ORG_")
	if err != nil {
		return false, err
	}
	return ok, nil
}

// AssignRolesByCodes ensures roles exist then assigns to user.
func (s *RBACService) AssignRolesByCodes(ctx context.Context, userID uuid.UUID, codes []string) error {
	if len(codes) == 0 {
		return errors.New("no roles provided")
	}
	for _, code := range codes {
		ur := &model.UserRole{
			UserID:   userID,
			RoleCode: strings.ToUpper(strings.TrimSpace(code)),
		}
		if err := s.userRoles.Assign(ctx, ur); err != nil {
			return err
		}
	}
	return nil
}

// AssignOrgRole assigns a role scoped to a specific organization.
func (s *RBACService) AssignOrgRole(ctx context.Context, userID uuid.UUID, roleCode string, orgID uuid.UUID) error {
	ur := &model.UserRole{
		UserID:   userID,
		RoleCode: strings.ToUpper(strings.TrimSpace(roleCode)),
		OrgID:    &orgID,
	}
	return s.userRoles.Assign(ctx, ur)
}

// ListAssignments returns raw user_roles (termasuk org scope) untuk kebutuhan akses granular.
func (s *RBACService) ListAssignments(ctx context.Context, userID uuid.UUID) ([]model.UserRole, error) {
	return s.userRoles.ListAssignments(ctx, userID)
}

// CanManageOrg determines if user can manage given org:
// - ADMIN selalu boleh manage semua organisasi
// - BEM_ADMIN jika org.Type == BEM
// - DEMA_ADMIN jika org.Type == DEMA
// - ORG_ADMIN selalu scoped ke org.ID (via user_roles.org_id)
func (s *RBACService) CanManageOrg(ctx context.Context, userID uuid.UUID, org *model.Organization) (bool, error) {
	if org == nil {
		return false, errors.New("org nil")
	}
	// ADMIN global
	if err := s.RequireAny(ctx, userID, model.RoleAdmin); err == nil {
		return true, nil
	}
	switch org.Type {
	case model.OrgTypeBEM:
		if err := s.RequireAny(ctx, userID, model.RoleBEMAdmin); err == nil {
			return true, nil
		}
	case model.OrgTypeDEMA:
		if err := s.RequireAny(ctx, userID, model.RoleDEMAAdmin); err == nil {
			return true, nil
		}
	}
	// Backward-compatible: ORG_ADMIN scoped (via user_roles.org_id).
	ok, err := s.userRoles.HasRoleForOrg(ctx, userID, model.RoleOrgAdmin, org.ID)
	if err != nil {
		return false, err
	}
	if ok {
		return true, nil
	}

	// Org-specific roles (example: ORG_ABSTER, ORG_HIMTIF) are stored scoped by org_id.
	// Any role_code with prefix "ORG_" for the same org_id grants manage access.
	ok, err = s.userRoles.HasAnyRoleForOrgPrefix(ctx, userID, org.ID, "ORG_")
	if err != nil {
		return false, err
	}
	return ok, nil
}
