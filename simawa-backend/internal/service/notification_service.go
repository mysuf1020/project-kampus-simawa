package service

import (
	"context"

	"github.com/google/uuid"
	"simawa-backend/internal/model"
	"simawa-backend/internal/repository"
)

type NotificationService struct {
	repo repository.NotificationRepository
}

func NewNotificationService(repo repository.NotificationRepository) *NotificationService {
	return &NotificationService{repo: repo}
}

func (s *NotificationService) Push(ctx context.Context, userID uuid.UUID, title, body string, data map[string]any) error {
	if s == nil || s.repo == nil {
		return nil
	}
	if title == "" {
		return nil
	}
	n := &model.Notification{
		UserID: userID,
		Title:  title,
		Body:   body,
		Data:   data,
	}
	return s.repo.Create(ctx, n)
}

func (s *NotificationService) List(ctx context.Context, userID uuid.UUID, limit int) ([]model.Notification, error) {
	return s.repo.ListByUser(ctx, userID, limit)
}

func (s *NotificationService) MarkRead(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	return s.repo.MarkRead(ctx, id, userID)
}
