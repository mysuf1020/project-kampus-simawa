package service

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
	"simawa-backend/internal/model"
	"simawa-backend/internal/repository"
)

type OrgMemberService struct {
	repo    repository.OrgMemberRepository
	orgRepo repository.OrganizationRepository
	rbac    *RBACService
	audit   *AuditService
}

func NewOrgMemberService(repo repository.OrgMemberRepository, orgRepo repository.OrganizationRepository, rbac *RBACService, audit *AuditService) *OrgMemberService {
	return &OrgMemberService{repo: repo, orgRepo: orgRepo, rbac: rbac, audit: audit}
}

func (s *OrgMemberService) Add(ctx context.Context, requester uuid.UUID, orgID uuid.UUID, userID uuid.UUID, role string) error {
	if s.rbac != nil {
		org, err := s.orgRepo.GetByID(ctx, orgID)
		if err != nil {
			return err
		}
		ok, err := s.rbac.CanManageOrg(ctx, requester, org)
		if err != nil || !ok {
			return errors.New("forbidden")
		}
	}
	m := &model.OrgMember{
		OrgID:  orgID,
		UserID: userID,
		Role:   role,
	}
	if err := s.repo.Add(ctx, m); err != nil {
		return err
	}

	// Jika role mengandung ADMIN, berikan juga role org-spesifik scoped (ORG_<SLUG>) di user_roles.
	if s.rbac != nil {
		normalized := strings.ToUpper(strings.TrimSpace(role))
		if normalized == "ADMIN" || normalized == model.RoleOrgAdmin {
			org, err := s.orgRepo.GetByID(ctx, orgID)
			if err != nil {
				return err
			}
			code := OrgRoleCodeFromSlug(org.Slug)
			if err := s.rbac.AssignOrgRole(ctx, userID, code, orgID); err != nil {
				return err
			}
		}
	}

	if s.audit != nil {
		s.audit.Log(ctx, requester, "org_member_add", map[string]any{"org_id": orgID, "user_id": userID, "role": role})
	}
	return nil
}

func (s *OrgMemberService) List(ctx context.Context, orgID uuid.UUID) ([]model.OrgMember, error) {
	return s.repo.ListByOrg(ctx, orgID)
}

func (s *OrgMemberService) UpdateRole(ctx context.Context, requester uuid.UUID, orgID uuid.UUID, userID uuid.UUID, role string) error {
	if s.rbac != nil {
		org, err := s.orgRepo.GetByID(ctx, orgID)
		if err != nil {
			return err
		}
		ok, err := s.rbac.CanManageOrg(ctx, requester, org)
		if err != nil || !ok {
			return errors.New("forbidden")
		}
	}
	if err := s.repo.UpdateRole(ctx, orgID, userID, role); err != nil {
		return err
	}
	if s.rbac != nil {
		normalized := strings.ToUpper(strings.TrimSpace(role))
		if normalized == "ADMIN" || normalized == model.RoleOrgAdmin {
			org, err := s.orgRepo.GetByID(ctx, orgID)
			if err != nil {
				return err
			}
			code := OrgRoleCodeFromSlug(org.Slug)
			if err := s.rbac.AssignOrgRole(ctx, userID, code, orgID); err != nil {
				return err
			}
		}
	}
	if s.audit != nil {
		s.audit.Log(ctx, requester, "org_member_update", map[string]any{"org_id": orgID, "user_id": userID, "role": role})
	}
	return nil
}

func (s *OrgMemberService) Delete(ctx context.Context, requester uuid.UUID, orgID uuid.UUID, userID uuid.UUID) error {
	if s.rbac != nil {
		org, err := s.orgRepo.GetByID(ctx, orgID)
		if err != nil {
			return err
		}
		ok, err := s.rbac.CanManageOrg(ctx, requester, org)
		if err != nil || !ok {
			return errors.New("forbidden")
		}
	}
	if err := s.repo.Delete(ctx, orgID, userID); err != nil {
		return err
	}
	if s.audit != nil {
		s.audit.Log(ctx, requester, "org_member_delete", map[string]any{"org_id": orgID, "user_id": userID})
	}
	return nil
}
