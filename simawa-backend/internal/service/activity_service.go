package service

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
	"simawa-backend/internal/model"
	"simawa-backend/internal/repository"
)

type ActivityService struct {
	repo    repository.ActivityRepository
	org     repository.OrganizationRepository
	history repository.ActivityHistoryRepository
	rbac    *RBACService
	notify  *NotificationService
	audit   *AuditService
}

func NewActivityService(repo repository.ActivityRepository, org repository.OrganizationRepository, history repository.ActivityHistoryRepository, rbac *RBACService, notify *NotificationService, audit *AuditService) *ActivityService {
	return &ActivityService{repo: repo, org: org, history: history, rbac: rbac, notify: notify, audit: audit}
}

type CreateActivityInput struct {
	OrgID              uuid.UUID
	Title              string
	Description        string
	Location           string
	Type               string
	CollabType         string
	CollaboratorOrgIDs []string
	Public             bool
	StartAt            time.Time
	EndAt              time.Time
	CoverKey           string
	Metadata           map[string]any
	CreatedBy          uuid.UUID
}

func (s *ActivityService) Create(ctx context.Context, in *CreateActivityInput) (*model.Activity, error) {
	if in == nil {
		return nil, errors.New("input nil")
	}
	if in.Title == "" || in.OrgID == uuid.Nil {
		return nil, errors.New("title/org required")
	}
	
	// Check if user can manage this org
	org, err := s.org.GetByID(ctx, in.OrgID)
	if err != nil {
		return nil, errors.New("organization not found")
	}
	ok, err := s.rbac.CanManageOrg(ctx, in.CreatedBy, org)
	if err != nil || !ok {
		return nil, errors.New("forbidden: you don't have permission to create activity for this organization")
	}
	
	collabType := in.CollabType
	if collabType == "" {
		collabType = "INTERNAL"
	}

	var collabJSON datatypes.JSON
	if len(in.CollaboratorOrgIDs) > 0 {
		b, _ := json.Marshal(in.CollaboratorOrgIDs)
		collabJSON = b
	}

	a := &model.Activity{
		OrgID:              in.OrgID,
		Title:              in.Title,
		Description:        in.Description,
		Location:           in.Location,
		Type:               in.Type,
		CollabType:         collabType,
		CollaboratorOrgIDs: collabJSON,
		Public:             in.Public,
		Status:             model.ActivityStatusDraft,
		StartAt:            in.StartAt,
		EndAt:              in.EndAt,
		CoverKey:           in.CoverKey,
		Metadata:           in.Metadata,
		CreatedBy:          in.CreatedBy,
		UpdatedBy:          in.CreatedBy,
	}
	if err := s.repo.Create(ctx, a); err != nil {
		return nil, err
	}
	s.appendHistory(ctx, a, in.CreatedBy, "CREATE", in.Description)
	return a, nil
}

func (s *ActivityService) Submit(ctx context.Context, userID uuid.UUID, id uuid.UUID) (*model.Activity, error) {
	a, err := s.repo.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	if a.Status != model.ActivityStatusDraft {
		return nil, errors.New("only draft can be submitted")
	}
	a.Status = model.ActivityStatusPending
	a.UpdatedBy = userID
	if err := s.repo.Update(ctx, a); err != nil {
		return nil, err
	}
	s.appendHistory(ctx, a, userID, "SUBMIT", "")
	s.audit.Log(ctx, userID, "activity_submit", map[string]any{"activity_id": a.ID})
	_ = s.notify.Push(ctx, userID, "Proposal diajukan", a.Title, map[string]any{"activity_id": a.ID})
	return a, nil
}

func (s *ActivityService) Approve(ctx context.Context, approver uuid.UUID, id uuid.UUID, note string, approve bool) (*model.Activity, error) {
	// Double-check: only BEM_ADMIN can approve activities
	canApprove, err := s.rbac.CanApproveActivity(ctx, approver)
	if err != nil || !canApprove {
		return nil, errors.New("forbidden: only BEM Admin can approve activities")
	}

	a, err := s.repo.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	if a.Status != model.ActivityStatusPending {
		return nil, errors.New("not pending")
	}
	if approve {
		a.Status = model.ActivityStatusApproved
		// cover approval manual; default false, set true via explicit endpoint
	} else {
		a.Status = model.ActivityStatusRejected
	}
	a.ApprovalNote = note
	a.UpdatedBy = approver
	if err := s.repo.Update(ctx, a); err != nil {
		return nil, err
	}
	_ = s.notify.Push(ctx, a.CreatedBy, "Proposal diperbarui", a.Status, map[string]any{"activity_id": a.ID})
	s.appendHistory(ctx, a, approver, map[bool]string{true: "APPROVE", false: "REJECT"}[approve], note)
	s.audit.Log(ctx, approver, "activity_approve", map[string]any{"activity_id": a.ID, "approve": approve})
	return a, nil
}

func (s *ActivityService) MarkCompleted(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*model.Activity, error) {
	a, err := s.repo.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	a.Status = model.ActivityStatusCompleted
	a.UpdatedBy = userID
	if err := s.repo.Update(ctx, a); err != nil {
		return nil, err
	}
	s.appendHistory(ctx, a, userID, "COMPLETE", "")
	return a, nil
}

func (s *ActivityService) ListByOrg(ctx context.Context, orgID uuid.UUID, status, actType string, publicOnly bool, page, size int, start, end time.Time) ([]model.Activity, error) {
	return s.repo.List(ctx, orgID, status, actType, publicOnly, page, size, start, end)
}

func (s *ActivityService) ListPublic(ctx context.Context, from time.Time) ([]model.Activity, error) {
	return s.repo.ListPublic(ctx, from)
}

func (s *ActivityService) Get(ctx context.Context, id uuid.UUID) (*model.Activity, error) {
	return s.repo.Get(ctx, id)
}

func (s *ActivityService) AddRevision(ctx context.Context, userID uuid.UUID, id uuid.UUID, note string) (*model.Activity, error) {
	a, err := s.repo.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	s.appendHistory(ctx, a, userID, "REVISION", note)
	return a, nil
}

func (s *ActivityService) appendHistory(ctx context.Context, a *model.Activity, userID uuid.UUID, action, note string) {
	if s.history == nil || a == nil {
		return
	}
	_ = s.history.Create(ctx, &model.ActivityHistory{
		ActivityID: a.ID,
		OrgID:      a.OrgID,
		UserID:     userID,
		Action:     action,
		Note:       note,
	})
}

func (s *ActivityService) AddGalleryPhoto(ctx context.Context, userID uuid.UUID, id uuid.UUID, url string) (*model.Activity, error) {
	a, err := s.repo.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	
	// Check permission via RBAC or ownership (simple check here, RBAC in middleware usually)
	// But service should probably enforce or assume caller checked.
	// We'll append to GalleryURLs
	
	var urls []string
	if len(a.GalleryURLs) > 0 {
		_ = json.Unmarshal(a.GalleryURLs, &urls)
	}
	urls = append(urls, url)
	
	b, _ := json.Marshal(urls)
	a.GalleryURLs = datatypes.JSON(b)
	
	if err := s.repo.Update(ctx, a); err != nil {
		return nil, err
	}
	s.appendHistory(ctx, a, userID, "ADD_PHOTO", "")
	return a, nil
}

func (s *ActivityService) RemoveGalleryPhoto(ctx context.Context, userID uuid.UUID, id uuid.UUID, urlToRemove string) (*model.Activity, error) {
	a, err := s.repo.Get(ctx, id)
	if err != nil {
		return nil, err
	}

	var urls []string
	if len(a.GalleryURLs) > 0 {
		_ = json.Unmarshal(a.GalleryURLs, &urls)
	}
	
	newURLs := make([]string, 0, len(urls))
	found := false
	for _, u := range urls {
		if u == urlToRemove {
			found = true
			continue
		}
		newURLs = append(newURLs, u)
	}
	
	if !found {
		return a, nil // No change
	}

	b, _ := json.Marshal(newURLs)
	a.GalleryURLs = datatypes.JSON(b)

	if err := s.repo.Update(ctx, a); err != nil {
		return nil, err
	}
	s.appendHistory(ctx, a, userID, "REMOVE_PHOTO", "")
	return a, nil
}
