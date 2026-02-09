package service

import (
	"context"
	"errors"
	"strings"

	"encoding/json"
	"github.com/google/uuid"
	"gorm.io/datatypes"
	"simawa-backend/internal/model"
	"simawa-backend/internal/repository"
)

type OrganizationService struct {
	repo  repository.OrganizationRepository
	rbac  *RBACService
	audit *AuditService
}

func NewOrganizationService(repo repository.OrganizationRepository, rbac *RBACService, audit *AuditService) *OrganizationService {
	return &OrganizationService{repo: repo, rbac: rbac, audit: audit}
}

func (s *OrganizationService) List(ctx context.Context, orgType string) ([]model.Organization, error) {
	return s.repo.List(ctx, orgType)
}

func (s *OrganizationService) Create(ctx context.Context, userID uuid.UUID, input CreateOrgInput) (*model.Organization, error) {
	org := &model.Organization{
		Name:        strings.TrimSpace(input.Name),
		Slug:        strings.TrimSpace(input.Slug),
		Type:        model.OrganizationType(strings.ToUpper(strings.TrimSpace(input.Type))),
		Description: strings.TrimSpace(input.Description),
	}
	if err := s.repo.Create(ctx, org); err != nil {
		return nil, err
	}
	if s.audit != nil {
		s.audit.Log(ctx, userID, "org_create", map[string]any{"org_id": org.ID, "name": org.Name})
	}
	return org, nil
}

func (s *OrganizationService) Delete(ctx context.Context, userID uuid.UUID, id uuid.UUID) error {
	if err := s.repo.Delete(ctx, id); err != nil {
		return err
	}
	if s.audit != nil {
		s.audit.Log(ctx, userID, "org_delete", map[string]any{"org_id": id})
	}
	return nil
}

func (s *OrganizationService) Get(ctx context.Context, id uuid.UUID) (*model.Organization, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *OrganizationService) GetBySlug(ctx context.Context, slug string) (*model.Organization, error) {
	return s.repo.GetBySlug(ctx, slug)
}

func (s *OrganizationService) CanManageOrg(ctx context.Context, userID uuid.UUID, org *model.Organization) (bool, error) {
	if s.rbac == nil {
		return false, errors.New("rbac not available")
	}
	return s.rbac.CanManageOrg(ctx, userID, org)
}

func (s *OrganizationService) Update(ctx context.Context, userID uuid.UUID, org *model.Organization, patch UpdateOrgInput) (*model.Organization, error) {
	ok, err := s.rbac.CanManageOrg(ctx, userID, org)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, errors.New("forbidden")
	}
	if patch.Name != nil && strings.TrimSpace(*patch.Name) != "" {
		org.Name = strings.TrimSpace(*patch.Name)
	}
	if patch.Slug != nil && strings.TrimSpace(*patch.Slug) != "" {
		org.Slug = strings.TrimSpace(*patch.Slug)
	}
	if patch.Type != nil && strings.TrimSpace(*patch.Type) != "" {
		org.Type = model.OrganizationType(strings.ToUpper(strings.TrimSpace(*patch.Type)))
	}
	if patch.Description != nil {
		org.Description = strings.TrimSpace(*patch.Description)
	}
	if patch.LogoKey != nil {
		org.LogoKey = strings.TrimSpace(*patch.LogoKey)
	}
	if patch.LogoURL != nil {
		org.LogoURL = strings.TrimSpace(*patch.LogoURL)
	}
	if patch.HeroImage != nil {
		org.HeroImage = strings.TrimSpace(*patch.HeroImage)
	}
	if patch.Contact != nil {
		org.Contact = strings.TrimSpace(*patch.Contact)
	}
	if patch.ContactEmail != nil {
		org.ContactEmail = strings.TrimSpace(*patch.ContactEmail)
	}
	if patch.ContactPhone != nil {
		org.ContactPhone = strings.TrimSpace(*patch.ContactPhone)
	}
	if patch.WebsiteURL != nil {
		org.WebsiteURL = strings.TrimSpace(*patch.WebsiteURL)
	}
	if patch.InstagramURL != nil {
		org.InstagramURL = strings.TrimSpace(*patch.InstagramURL)
	}
	if patch.TwitterURL != nil {
		org.TwitterURL = strings.TrimSpace(*patch.TwitterURL)
	}
	if patch.LinkedinURL != nil {
		org.LinkedinURL = strings.TrimSpace(*patch.LinkedinURL)
	}
	if patch.Links != nil {
		org.Links = patch.Links
	}
	if patch.GalleryURLs != nil {
		b, _ := json.Marshal(patch.GalleryURLs)
		org.GalleryURLs = datatypes.JSON(b)
	}
	if err := s.repo.Update(ctx, org); err != nil {
		return nil, err
	}
	if s.audit != nil {
		s.audit.Log(ctx, userID, "org_update", map[string]any{"org_id": org.ID})
	}
	return org, nil
}

type CreateOrgInput struct {
	Name        string
	Slug        string
	Type        string
	Description string
}

type UpdateOrgInput struct {
	Name         *string
	Slug         *string
	Type         *string
	Description  *string
	LogoKey      *string
	LogoURL      *string
	HeroImage    *string
	Contact      *string
	ContactEmail *string
	ContactPhone *string
	WebsiteURL   *string
	InstagramURL *string
	TwitterURL   *string
	LinkedinURL  *string
	GalleryURLs  []string
	Links        map[string]any
}
