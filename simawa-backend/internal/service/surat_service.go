package service

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"

	"simawa-backend/internal/model"
	"simawa-backend/internal/repository"
	"simawa-backend/internal/util/suratpdf"
)

type CreateSuratInput struct {
	OrgID       uuid.UUID
	TargetOrgID *uuid.UUID
	Payload     suratpdf.Payload
	Theme       *suratpdf.Theme
	CreatedBy   uuid.UUID
	Status      string
}

type InboxFilter struct {
	OrgIDs []uuid.UUID
	Roles  []string
	Status string
	Page   int
	Size   int
}

type SuratService interface {
	Generate(ctx context.Context, payload suratpdf.Payload, theme *suratpdf.Theme) ([]byte, error)
	GenerateAndUpload(ctx context.Context, payload suratpdf.Payload, theme *suratpdf.Theme, mc *minio.Client, bucket string) (string, error)
	Create(ctx context.Context, in *CreateSuratInput, mc *minio.Client, bucket string) (*model.Surat, error)
	Submit(ctx context.Context, userID uuid.UUID, id uint) (*model.Surat, error)
	Decide(ctx context.Context, approver uuid.UUID, id uint, approve bool, note string) (*model.Surat, error)
	SaveMetadata(ctx context.Context, m *model.Surat) error
	Get(ctx context.Context, id uint) (*model.Surat, error)
	List(ctx context.Context, q repository.ListSuratQuery) ([]model.Surat, int64, error)
	ListByOrg(ctx context.Context, orgID uuid.UUID, status string, page, size int) ([]model.Surat, int64, error)
	ListInbox(ctx context.Context, in InboxFilter) ([]model.Surat, int64, error)
	PresignOrURL(ctx context.Context, mc *minio.Client, bucket string, key string, expire time.Duration) (string, error)

	CreateTemplate(ctx context.Context, t *model.SuratTemplate) error
	UpdateTemplate(ctx context.Context, t *model.SuratTemplate) error
	DeleteTemplate(ctx context.Context, id uint) error
	GetTemplate(ctx context.Context, id uint) (*model.SuratTemplate, error)
	ListTemplates(ctx context.Context) ([]model.SuratTemplate, error)

	RenderFromTemplate(ctx context.Context, t *model.SuratTemplate, overrides map[string]any, mc *minio.Client, bucket string, createdBy uuid.UUID, orgID uuid.UUID, targetOrgID *uuid.UUID, status string) (*model.Surat, error)
}

type suratService struct {
	suratRepo repository.SuratRepository
	tplRepo   repository.SuratTemplateRepository
	audit     *AuditService
	notify    *NotificationService
	orgRepo   repository.OrganizationRepository
}

func NewSuratServiceWithRepo(suratRepo repository.SuratRepository, tplRepo repository.SuratTemplateRepository, orgRepo repository.OrganizationRepository, audit *AuditService, notify *NotificationService) SuratService {
	return &suratService{suratRepo: suratRepo, tplRepo: tplRepo, orgRepo: orgRepo, audit: audit, notify: notify}
}
func NewSuratService() SuratService { return &suratService{} }

func (s *suratService) Generate(ctx context.Context, payload suratpdf.Payload, theme *suratpdf.Theme) ([]byte, error) {
	return suratpdf.Render(payload, theme)
}

func (s *suratService) GenerateAndUpload(ctx context.Context, payload suratpdf.Payload, theme *suratpdf.Theme, mc *minio.Client, bucket string) (string, error) {
	if mc == nil || bucket == "" {
		return "", fmt.Errorf("minio disabled or bucket missing")
	}
	pdfBytes, err := suratpdf.Render(payload, theme)
	if err != nil {
		return "", err
	}
	key := fmt.Sprintf("surat/%s.pdf", uuid.New().String())
	_, err = mc.PutObject(ctx, bucket, key, bytes.NewReader(pdfBytes), int64(len(pdfBytes)), minio.PutObjectOptions{ContentType: "application/pdf"})
	if err != nil {
		return "", err
	}
	return key, nil
}

func (s *suratService) SaveMetadata(ctx context.Context, m *model.Surat) error {
	if s.suratRepo == nil {
		return fmt.Errorf("surat repository not wired")
	}
	if m.Status == "" {
		m.Status = model.SuratStatusDraft
	}
	return s.suratRepo.Create(ctx, m)
}

func (s *suratService) Create(ctx context.Context, in *CreateSuratInput, mc *minio.Client, bucket string) (*model.Surat, error) {
	if in == nil {
		return nil, errors.New("input nil")
	}
	if s.suratRepo == nil {
		return nil, fmt.Errorf("surat repository not wired")
	}
	if in.OrgID == uuid.Nil {
		return nil, errors.New("org_id required")
	}

	status := strings.ToUpper(strings.TrimSpace(in.Status))
	if status == "" {
		status = model.SuratStatusPending
	}
	if in.Payload.CreatedAt.IsZero() {
		in.Payload.CreatedAt = time.Now()
	}

	// Prefill header/logo dari organisasi jika ada dan belum diisi.
	if s.orgRepo != nil {
		if org, err := s.orgRepo.GetByID(ctx, in.OrgID); err == nil && org != nil {
			if in.Payload.Header == nil {
				in.Payload.Header = &suratpdf.Header{}
			}
			if in.Payload.Header.LeftLogo == "" {
				in.Payload.Header.LeftLogo = org.LogoKey
			}
			if in.Payload.Header.RightLogo == "" {
				in.Payload.Header.RightLogo = org.LogoKey
			}
			if strings.TrimSpace(in.Payload.Header.OrgName) == "" && len(in.Payload.Header.Title) == 0 && strings.TrimSpace(org.Name) != "" {
				in.Payload.Header.OrgName = org.Name
			}
		}
	}

	key, err := s.GenerateAndUpload(ctx, in.Payload, in.Theme, mc, bucket)
	if err != nil {
		return nil, err
	}

	meta := map[string]any{
		"place_and_date": in.Payload.Meta.PlaceAndDate,
		"footer":         in.Payload.Footer,
		"created_at":     in.Payload.CreatedAt,
	}
	metaB, _ := json.Marshal(meta)

	var createdByPtr *uuid.UUID
	var submittedByPtr *uuid.UUID
	if in.CreatedBy != uuid.Nil {
		createdByPtr = &in.CreatedBy
		if status != model.SuratStatusDraft {
			submittedByPtr = &in.CreatedBy
		}
	}

	row := &model.Surat{
		OrgID:       in.OrgID,
		TargetOrgID: in.TargetOrgID,
		Variant:     string(in.Payload.Variant),
		Status:      status,
		Number:      in.Payload.Meta.Number,
		Subject:     in.Payload.Meta.Subject,
		ToRole:      in.Payload.Meta.ToRole,
		ToName:      in.Payload.Meta.ToName,
		ToPlace:     in.Payload.Meta.ToPlace,
		ToCity:      in.Payload.Meta.ToCity,
		FileKey:     key,
		FileURL:     "",
		CreatedBy:   createdByPtr,
		SubmittedBy: submittedByPtr,
		MetaJSON:    metaB,
	}

	if err := s.suratRepo.Create(ctx, row); err != nil {
		return nil, err
	}

	if s.audit != nil && in.CreatedBy != uuid.Nil {
		s.audit.Log(ctx, in.CreatedBy, "surat_create", map[string]any{"surat_id": row.ID, "org_id": row.OrgID, "status": row.Status})
	}
	return row, nil
}

func (s *suratService) Submit(ctx context.Context, userID uuid.UUID, id uint) (*model.Surat, error) {
	if s.suratRepo == nil {
		return nil, fmt.Errorf("surat repository not wired")
	}
	row, err := s.suratRepo.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	if row.Status != model.SuratStatusDraft {
		return nil, errors.New("only draft can be submitted")
	}
	row.Status = model.SuratStatusPending
	if userID != uuid.Nil {
		row.SubmittedBy = &userID
	}
	if err := s.suratRepo.Update(ctx, row); err != nil {
		return nil, err
	}
	if s.audit != nil && userID != uuid.Nil {
		s.audit.Log(ctx, userID, "surat_submit", map[string]any{"surat_id": row.ID, "org_id": row.OrgID})
	}
	return row, nil
}

func (s *suratService) Decide(ctx context.Context, approver uuid.UUID, id uint, approve bool, note string) (*model.Surat, error) {
	if s.suratRepo == nil {
		return nil, fmt.Errorf("surat repository not wired")
	}
	row, err := s.suratRepo.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	if row.Status != model.SuratStatusPending {
		return nil, errors.New("only pending can be decided")
	}
	if approve {
		row.Status = model.SuratStatusApproved
	} else {
		row.Status = model.SuratStatusRejected
	}
	row.ApprovalNote = note
	if approver != uuid.Nil {
		row.ApprovedBy = &approver
	}
	if err := s.suratRepo.Update(ctx, row); err != nil {
		return nil, err
	}
	if s.audit != nil && approver != uuid.Nil {
		s.audit.Log(ctx, approver, "surat_decide", map[string]any{"surat_id": row.ID, "approve": approve})
	}
	if s.notify != nil && row.CreatedBy != nil {
		_ = s.notify.Push(ctx, *row.CreatedBy, "Status surat diperbarui", fmt.Sprintf("Surat %s", strings.ToLower(row.Status)), map[string]any{"surat_id": row.ID})
	}
	return row, nil
}

func (s *suratService) Get(ctx context.Context, id uint) (*model.Surat, error) {
	if s.suratRepo == nil {
		return nil, fmt.Errorf("surat repository not wired")
	}
	return s.suratRepo.Get(ctx, id)
}

func (s *suratService) List(ctx context.Context, q repository.ListSuratQuery) ([]model.Surat, int64, error) {
	if s.suratRepo == nil {
		return nil, 0, fmt.Errorf("surat repository not wired")
	}
	return s.suratRepo.List(ctx, q)
}

func (s *suratService) ListByOrg(ctx context.Context, orgID uuid.UUID, status string, page, size int) ([]model.Surat, int64, error) {
	q := repository.ListSuratQuery{
		OrgID:  &orgID,
		Status: status,
		Page:   page,
		Size:   size,
	}
	return s.List(ctx, q)
}

func (s *suratService) ListInbox(ctx context.Context, in InboxFilter) ([]model.Surat, int64, error) {
	if s.suratRepo == nil {
		return nil, 0, fmt.Errorf("surat repository not wired")
	}

	roles := make([]string, 0, len(in.Roles))
	isAdmin := false
	for _, r := range in.Roles {
		rc := strings.ToUpper(strings.TrimSpace(r))
		if rc == "" {
			continue
		}
		roles = append(roles, rc)
		if rc == model.RoleAdmin || rc == model.RoleBEMAdmin || rc == model.RoleDEMAAdmin {
			isAdmin = true
		}
	}

	q := repository.ListSuratQuery{
		Status: in.Status,
		Page:   in.Page,
		Size:   in.Size,
	}
	if !isAdmin {
		q.ForOrgIDs = in.OrgIDs
		q.ForRoles = roles
	}
	return s.List(ctx, q)
}

func (s *suratService) PresignOrURL(ctx context.Context, mc *minio.Client, bucket string, key string, expire time.Duration) (string, error) {
	if key == "" {
		return "", fmt.Errorf("empty file key")
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

/* templates */

func (s *suratService) CreateTemplate(ctx context.Context, t *model.SuratTemplate) error {
	if s.tplRepo == nil {
		return fmt.Errorf("template repository not wired")
	}
	return s.tplRepo.Create(ctx, t)
}
func (s *suratService) UpdateTemplate(ctx context.Context, t *model.SuratTemplate) error {
	if s.tplRepo == nil {
		return fmt.Errorf("template repository not wired")
	}
	return s.tplRepo.Update(ctx, t)
}
func (s *suratService) DeleteTemplate(ctx context.Context, id uint) error {
	if s.tplRepo == nil {
		return fmt.Errorf("template repository not wired")
	}
	return s.tplRepo.Delete(ctx, id)
}
func (s *suratService) GetTemplate(ctx context.Context, id uint) (*model.SuratTemplate, error) {
	if s.tplRepo == nil {
		return nil, fmt.Errorf("template repository not wired")
	}
	return s.tplRepo.Get(ctx, id)
}
func (s *suratService) ListTemplates(ctx context.Context) ([]model.SuratTemplate, error) {
	if s.tplRepo == nil {
		return nil, fmt.Errorf("template repository not wired")
	}
	return s.tplRepo.List(ctx)
}

func (s *suratService) RenderFromTemplate(ctx context.Context, t *model.SuratTemplate, overrides map[string]any, mc *minio.Client, bucket string, createdBy uuid.UUID, orgID uuid.UUID, targetOrgID *uuid.UUID, status string) (*model.Surat, error) {
	if t == nil {
		return nil, fmt.Errorf("template nil")
	}
	var theme suratpdf.Theme
	var payload suratpdf.Payload
	_ = json.Unmarshal(t.ThemeJSON, &theme)
	_ = json.Unmarshal(t.PayloadJSON, &payload)

	if overrides != nil {
		b, _ := json.Marshal(overrides)
		_ = json.Unmarshal(b, &payload)
	}
	payload.Variant = suratpdf.Variant(t.Variant)

	return s.Create(ctx, &CreateSuratInput{
		OrgID:       orgID,
		TargetOrgID: targetOrgID,
		Payload:     payload,
		Theme:       &theme,
		CreatedBy:   createdBy,
		Status:      status,
	}, mc, bucket)
}
