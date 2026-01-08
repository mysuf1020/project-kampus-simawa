package service

import (
	"context"

	"github.com/google/uuid"
	"simawa-backend/internal/model"
	"simawa-backend/internal/repository"
)

type AuditService struct {
	repo repository.AuditLogRepository
}

func NewAuditService(repo repository.AuditLogRepository) *AuditService {
	return &AuditService{repo: repo}
}

func (s *AuditService) Log(ctx context.Context, userID uuid.UUID, action string, meta map[string]any) {
	if s == nil || s.repo == nil {
		return
	}
	_ = s.repo.Create(ctx, &model.AuditLog{
		UserID:   userID,
		Action:   action,
		Metadata: meta,
	})
}
