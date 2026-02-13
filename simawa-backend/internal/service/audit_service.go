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

// AuditLogInput contains all fields for creating an audit log entry
type AuditLogInput struct {
	UserID      uuid.UUID
	Action      string
	EntityType  string
	EntityID    string
	Description string
	IPAddress   string
	UserAgent   string
	Metadata    map[string]any
}

// contextKey type for audit context keys
type contextKey string

const (
	CtxKeyIP        contextKey = "audit_ip"
	CtxKeyUserAgent contextKey = "audit_ua"
)

// WithAuditInfo returns a context enriched with IP and UserAgent for audit logging.
func WithAuditInfo(ctx context.Context, ip, ua string) context.Context {
	ctx = context.WithValue(ctx, CtxKeyIP, ip)
	ctx = context.WithValue(ctx, CtxKeyUserAgent, ua)
	return ctx
}

// Log creates an audit log entry (legacy method for backward compatibility)
func (s *AuditService) Log(ctx context.Context, userID uuid.UUID, action string, meta map[string]any) {
	if s == nil || s.repo == nil {
		return
	}
	ip, _ := ctx.Value(CtxKeyIP).(string)
	ua, _ := ctx.Value(CtxKeyUserAgent).(string)
	_ = s.repo.Create(ctx, &model.AuditLog{
		UserID:    userID,
		Action:    action,
		IPAddress: ip,
		UserAgent: ua,
		Metadata:  meta,
	})
}

// LogDetailed creates an audit log entry with full details
func (s *AuditService) LogDetailed(ctx context.Context, input AuditLogInput) {
	if s == nil || s.repo == nil {
		return
	}
	_ = s.repo.Create(ctx, &model.AuditLog{
		UserID:      input.UserID,
		Action:      input.Action,
		EntityType:  input.EntityType,
		EntityID:    input.EntityID,
		Description: input.Description,
		IPAddress:   input.IPAddress,
		UserAgent:   input.UserAgent,
		Metadata:    input.Metadata,
	})
}
