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

// AuditInfo contains request metadata for audit logging
type AuditInfo struct {
	IPAddress string
	UserAgent string
}

func (s *OrgMemberService) Add(ctx context.Context, requester uuid.UUID, orgID uuid.UUID, userID uuid.UUID, role string, auditInfo *AuditInfo) error {
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
	var orgName string
	if s.rbac != nil {
		normalized := strings.ToUpper(strings.TrimSpace(role))
		if normalized == "ADMIN" || normalized == model.RoleOrgAdmin {
			org, err := s.orgRepo.GetByID(ctx, orgID)
			if err != nil {
				return err
			}
			orgName = org.Name
			code := OrgRoleCodeFromSlug(org.Slug)
			if err := s.rbac.AssignOrgRole(ctx, userID, code, orgID); err != nil {
				return err
			}
		}
	}

	if s.audit != nil {
		ip, ua := "", ""
		if auditInfo != nil {
			ip, ua = auditInfo.IPAddress, auditInfo.UserAgent
		}
		s.audit.LogDetailed(ctx, AuditLogInput{
			UserID:      requester,
			Action:      "org_member_add",
			EntityType:  "ORG_MEMBER",
			EntityID:    orgID.String(),
			Description: "Menambahkan anggota ke organisasi " + orgName + " dengan role " + role,
			IPAddress:   ip,
			UserAgent:   ua,
			Metadata:    map[string]any{"org_id": orgID, "user_id": userID, "role": role},
		})
	}
	return nil
}

func (s *OrgMemberService) List(ctx context.Context, orgID uuid.UUID) ([]model.OrgMember, error) {
	return s.repo.ListByOrg(ctx, orgID)
}

func (s *OrgMemberService) UpdateRole(ctx context.Context, requester uuid.UUID, orgID uuid.UUID, userID uuid.UUID, role string, auditInfo *AuditInfo) error {
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
	var orgName string
	if s.rbac != nil {
		normalized := strings.ToUpper(strings.TrimSpace(role))
		if normalized == "ADMIN" || normalized == model.RoleOrgAdmin {
			org, err := s.orgRepo.GetByID(ctx, orgID)
			if err != nil {
				return err
			}
			orgName = org.Name
			code := OrgRoleCodeFromSlug(org.Slug)
			if err := s.rbac.AssignOrgRole(ctx, userID, code, orgID); err != nil {
				return err
			}
		}
	}
	if s.audit != nil {
		ip, ua := "", ""
		if auditInfo != nil {
			ip, ua = auditInfo.IPAddress, auditInfo.UserAgent
		}
		s.audit.LogDetailed(ctx, AuditLogInput{
			UserID:      requester,
			Action:      "org_member_update",
			EntityType:  "ORG_MEMBER",
			EntityID:    orgID.String(),
			Description: "Mengubah role anggota di organisasi " + orgName + " menjadi " + role,
			IPAddress:   ip,
			UserAgent:   ua,
			Metadata:    map[string]any{"org_id": orgID, "user_id": userID, "role": role},
		})
	}
	return nil
}

func (s *OrgMemberService) Delete(ctx context.Context, requester uuid.UUID, orgID uuid.UUID, userID uuid.UUID, auditInfo *AuditInfo) error {
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
		ip, ua := "", ""
		if auditInfo != nil {
			ip, ua = auditInfo.IPAddress, auditInfo.UserAgent
		}
		s.audit.LogDetailed(ctx, AuditLogInput{
			UserID:      requester,
			Action:      "org_member_delete",
			EntityType:  "ORG_MEMBER",
			EntityID:    orgID.String(),
			Description: "Menghapus anggota dari organisasi",
			IPAddress:   ip,
			UserAgent:   ua,
			Metadata:    map[string]any{"org_id": orgID, "user_id": userID},
		})
	}
	return nil
}
