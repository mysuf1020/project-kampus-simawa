package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
	"gorm.io/gorm"
	"simawa-backend/internal/model"
	"simawa-backend/internal/repository"
)

type LPJService struct {
	repo    repository.LPJRepository
	act     repository.ActivityRepository
	rbac    *RBACService
	notify  *NotificationService
	history repository.LPJHistoryRepository
	audit   *AuditService
}

func NewLPJService(repo repository.LPJRepository, act repository.ActivityRepository, rbac *RBACService, notify *NotificationService, history repository.LPJHistoryRepository, audit *AuditService) *LPJService {
	return &LPJService{repo: repo, act: act, rbac: rbac, notify: notify, history: history, audit: audit}
}

type SubmitLPJInput struct {
	ActivityID *uuid.UUID
	OrgID      uuid.UUID
	Summary    string
	BudgetPlan float64
	BudgetReal float64
	ReportKey  string
	FileSize   int64
	Photos     []string
	UserID     uuid.UUID
}

func (s *LPJService) Submit(ctx context.Context, in *SubmitLPJInput) (*model.LPJ, error) {
	if in == nil || in.OrgID == uuid.Nil {
		return nil, errors.New("invalid input")
	}
	if strings.TrimSpace(in.ReportKey) == "" {
		return nil, errors.New("report_key required")
	}
	if in.ActivityID != nil {
		act, err := s.act.Get(ctx, *in.ActivityID)
		if err != nil {
			return nil, err
		}
		if act.OrgID != in.OrgID {
			return nil, errors.New("activity org mismatch")
		}
		ok, err := s.rbac.CanManageOrg(ctx, in.UserID, &model.Organization{ID: act.OrgID, Type: model.OrgTypeUKM})
		if err != nil || !ok {
			return nil, errors.New("forbidden")
		}
	} else {
		ok, err := s.rbac.CanManageOrg(ctx, in.UserID, &model.Organization{ID: in.OrgID, Type: model.OrgTypeUKM})
		if err != nil || !ok {
			return nil, errors.New("forbidden")
		}
	}
	var existing *model.LPJ
	var err error
	if in.ActivityID != nil {
		existing, err = s.repo.GetByActivity(ctx, *in.ActivityID)
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
	}

	if err == nil && existing != nil {
		if existing.Status != model.LPJStatusRevision && existing.Status != model.LPJStatusRejected {
			return nil, errors.New("lpj already submitted")
		}
		existing.Summary = in.Summary
		existing.BudgetPlan = in.BudgetPlan
		existing.BudgetReal = in.BudgetReal
		existing.ReportKey = in.ReportKey
		existing.FileSize = in.FileSize
		existing.Photos = toJSONArr(in.Photos)
		existing.Status = model.LPJStatusPending
		existing.Note = ""
		existing.SubmittedBy = in.UserID
		existing.RevisionNo++
		existing.ReviewedBy = nil
		existing.ReviewedAt = nil
		if err := s.repo.Update(ctx, existing); err != nil {
			return nil, err
		}
		_ = s.notify.Push(ctx, in.UserID, "LPJ dikirim ulang", in.Summary, map[string]any{"activity_id": in.ActivityID})
		s.appendHistory(ctx, existing, in.UserID, "RESUBMIT", in.Summary)
		if s.audit != nil {
			s.audit.Log(ctx, in.UserID, "lpj_resubmit", map[string]any{"activity_id": in.ActivityID})
		}
		return existing, nil
	}

	l := &model.LPJ{
		ActivityID:  in.ActivityID,
		OrgID:       in.OrgID,
		Summary:     in.Summary,
		BudgetPlan:  in.BudgetPlan,
		BudgetReal:  in.BudgetReal,
		ReportKey:   in.ReportKey,
		FileSize:    in.FileSize,
		Photos:      toJSONArr(in.Photos),
		Status:      model.LPJStatusPending,
		SubmittedBy: in.UserID,
		RevisionNo:  0,
		ReviewedAt:  nil,
		ReviewedBy:  nil,
	}
	if err := s.repo.Create(ctx, l); err != nil {
		return nil, err
	}
	_ = s.notify.Push(ctx, in.UserID, "LPJ dikirim", in.Summary, map[string]any{"activity_id": in.ActivityID})
	s.appendHistory(ctx, l, in.UserID, "SUBMIT", in.Summary)
	if s.audit != nil {
		s.audit.Log(ctx, in.UserID, "lpj_submit", map[string]any{"activity_id": in.ActivityID})
	}
	return l, nil
}

func (s *LPJService) Approve(ctx context.Context, approver uuid.UUID, lpjID uuid.UUID, note string, approve bool) (*model.LPJ, error) {
	l, err := s.repo.Get(ctx, lpjID)
	if err != nil {
		return nil, err
	}
	if l.Status != model.LPJStatusPending {
		return nil, errors.New("lpj not pending")
	}
	if !approve && strings.TrimSpace(note) == "" {
		return nil, errors.New("note required for reject")
	}
	// ReportKey validation removed - allow approval/rejection without file for flexibility
	now := time.Now()
	l.ReviewedBy = &approver
	l.ReviewedAt = &now
	if approve {
		l.Status = model.LPJStatusApproved
	} else {
		l.Status = model.LPJStatusRejected
	}
	l.Note = note
	if err := s.repo.Update(ctx, l); err != nil {
		return nil, err
	}
	_ = s.notify.Push(ctx, l.SubmittedBy, "LPJ diperbarui", l.Status, map[string]any{"activity_id": l.ActivityID})
	s.appendHistory(ctx, l, approver, map[bool]string{true: "APPROVE", false: "REJECT"}[approve], note)
	if s.audit != nil {
		s.audit.Log(ctx, approver, "lpj_approve", map[string]any{"activity_id": l.ActivityID, "approve": approve})
	}
	return l, nil
}

func (s *LPJService) ListByOrg(ctx context.Context, orgID uuid.UUID) ([]model.LPJ, error) {
	return s.repo.ListByOrg(ctx, orgID, "", 1, 10)
}

func (s *LPJService) ListByOrgWithFilter(ctx context.Context, orgID uuid.UUID, status string, page, size int) ([]model.LPJ, error) {
	return s.repo.ListByOrg(ctx, orgID, status, page, size)
}

func (s *LPJService) AddRevision(ctx context.Context, userID, lpjID uuid.UUID, note string) (*model.LPJ, error) {
	l, err := s.repo.Get(ctx, lpjID)
	if err != nil {
		return nil, err
	}
	if strings.TrimSpace(note) == "" {
		return nil, errors.New("note required")
	}
	if l.Status != model.LPJStatusPending {
		return nil, errors.New("lpj not pending")
	}
	// ReportKey validation removed - allow revision request without file for flexibility
	now := time.Now()
	l.Status = model.LPJStatusRevision
	l.Note = note
	l.ReviewedBy = &userID
	l.ReviewedAt = &now
	if err := s.repo.Update(ctx, l); err != nil {
		return nil, err
	}
	_ = s.notify.Push(ctx, l.SubmittedBy, "LPJ diminta revisi", note, map[string]any{"activity_id": l.ActivityID})
	s.appendHistory(ctx, l, userID, "REVISION_REQUESTED", note)
	if s.audit != nil {
		s.audit.Log(ctx, userID, "lpj_revision_requested", map[string]any{"activity_id": l.ActivityID})
	}
	return l, nil
}

func (s *LPJService) Get(ctx context.Context, lpjID uuid.UUID) (*model.LPJ, error) {
	return s.repo.Get(ctx, lpjID)
}

func (s *LPJService) ListHistory(ctx context.Context, activityID *uuid.UUID) ([]model.LPJHistory, error) {
	if s.history == nil {
		return nil, errors.New("history repository not configured")
	}
	if activityID == nil || *activityID == uuid.Nil {
		return []model.LPJHistory{}, nil
	}
	return s.history.ListByActivity(ctx, *activityID)
}

// PresignReport menghasilkan signed URL untuk laporan LPJ jika storage tersedia.
func (s *LPJService) PresignReport(ctx context.Context, mc *minio.Client, bucket string, key string, expire time.Duration) (string, error) {
	if strings.TrimSpace(key) == "" {
		return "", errors.New("empty file key")
	}
	if mc == nil || bucket == "" {
		return key, nil
	}
	u, err := mc.PresignedGetObject(ctx, bucket, key, expire, nil)
	if err != nil {
		return "", err
	}
	return u.String(), nil
}

func toJSONArr(keys []string) []byte {
	if len(keys) == 0 {
		return []byte("[]")
	}
	b := "["
	for i, k := range keys {
		if i > 0 {
			b += ","
		}
		b += `"` + k + `"`
	}
	b += "]"
	return []byte(b)
}

func (s *LPJService) appendHistory(ctx context.Context, l *model.LPJ, userID uuid.UUID, action, note string) {
	if s.history == nil || l == nil {
		return
	}
	_ = s.history.Create(ctx, &model.LPJHistory{
		ActivityID: l.ActivityID,
		OrgID:      l.OrgID,
		UserID:     userID,
		Action:     action,
		Note:       note,
	})
}
