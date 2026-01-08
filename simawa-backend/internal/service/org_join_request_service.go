package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"simawa-backend/internal/model"
	"simawa-backend/internal/repository"
)

var (
	ErrAlreadyMember      = errors.New("already member")
	ErrJoinAlreadyPending = errors.New("join already pending")
	ErrJoinAlreadyDecided = errors.New("join request already decided")
)

type OrgJoinRequestService struct {
	orgRepo   repository.OrganizationRepository
	userRepo  repository.UserRepository
	memberRepo repository.OrgMemberRepository
	repo      repository.OrgJoinRequestRepository
	rbac      *RBACService
	audit     *AuditService
}

func NewOrgJoinRequestService(
	repo repository.OrgJoinRequestRepository,
	orgRepo repository.OrganizationRepository,
	userRepo repository.UserRepository,
	memberRepo repository.OrgMemberRepository,
	rbac *RBACService,
	audit *AuditService,
) *OrgJoinRequestService {
	return &OrgJoinRequestService{
		repo:       repo,
		orgRepo:    orgRepo,
		userRepo:   userRepo,
		memberRepo: memberRepo,
		rbac:       rbac,
		audit:      audit,
	}
}

func (s *OrgJoinRequestService) Submit(ctx context.Context, userID uuid.UUID, orgID uuid.UUID, message string) (*model.OrgJoinRequest, error) {
	trimmed := strings.TrimSpace(message)
	if len(trimmed) > 512 {
		return nil, errors.New("message too long")
	}

	// Ensure org exists
	if _, err := s.orgRepo.GetByID(ctx, orgID); err != nil {
		return nil, err
	}

	// Already member?
	if s.memberRepo != nil {
		isMember, err := s.memberRepo.IsMember(ctx, orgID, userID)
		if err != nil {
			return nil, err
		}
		if isMember {
			return nil, ErrAlreadyMember
		}
	}

	// Pending request exists?
	if _, err := s.repo.FindPendingByOrgUser(ctx, orgID, userID); err == nil {
		return nil, ErrJoinAlreadyPending
	} else if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	u, err := s.userRepo.GetByUUID(ctx, userID)
	if err != nil {
		return nil, err
	}

	uid := userID
	req := &model.OrgJoinRequest{
		OrgID:          orgID,
		UserID:         &uid,
		ApplicantName:  strings.TrimSpace(strings.Join([]string{u.FirstName, u.SecondName}, " ")),
		ApplicantEmail: strings.TrimSpace(u.Email),
		ApplicantNIM:   strings.TrimSpace(u.NIM),
		ApplicantPhone: strings.TrimSpace(u.Phone),
		ApplicantJurusan: strings.TrimSpace(u.Jurusan),
		Message:        trimmed,
		Status:         model.OrgJoinRequestPending,
	}

	if err := s.repo.Create(ctx, req); err != nil {
		return nil, err
	}
	if s.audit != nil {
		s.audit.Log(ctx, userID, "org_join_request_submit", map[string]any{"org_id": orgID, "request_id": req.ID})
	}
	return req, nil
}

type PublicJoinRequestInput struct {
	Name    string
	Email   string
	NIM     string
	Phone   string
	Jurusan string
	Message string
}

func (s *OrgJoinRequestService) SubmitPublic(ctx context.Context, orgID uuid.UUID, input PublicJoinRequestInput) (*model.OrgJoinRequest, error) {
	name := strings.TrimSpace(input.Name)
	email := strings.TrimSpace(strings.ToLower(input.Email))
	nim := strings.TrimSpace(input.NIM)
	phone := strings.TrimSpace(input.Phone)
	jurusan := strings.TrimSpace(input.Jurusan)
	message := strings.TrimSpace(input.Message)

	if name == "" || email == "" || nim == "" {
		return nil, errors.New("name, email, and nim are required")
	}
	if len(name) > 128 || len(email) > 128 || len(nim) > 32 || len(phone) > 32 || len(jurusan) > 128 {
		return nil, errors.New("input too long")
	}
	if len(message) > 512 {
		return nil, errors.New("message too long")
	}

	if _, err := s.orgRepo.GetByID(ctx, orgID); err != nil {
		return nil, err
	}

	if _, err := s.repo.FindPendingByOrgEmail(ctx, orgID, email); err == nil {
		return nil, ErrJoinAlreadyPending
	} else if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	req := &model.OrgJoinRequest{
		OrgID:            orgID,
		ApplicantName:    name,
		ApplicantEmail:   email,
		ApplicantNIM:     nim,
		ApplicantPhone:   phone,
		ApplicantJurusan: jurusan,
		Message:          message,
		Status:           model.OrgJoinRequestPending,
	}

	if err := s.repo.Create(ctx, req); err != nil {
		return nil, err
	}
	return req, nil
}

func (s *OrgJoinRequestService) ListByOrg(ctx context.Context, requester uuid.UUID, orgID uuid.UUID, status string) ([]model.OrgJoinRequest, error) {
	org, err := s.orgRepo.GetByID(ctx, orgID)
	if err != nil {
		return nil, err
	}
	if s.rbac != nil {
		ok, err := s.rbac.CanManageOrg(ctx, requester, org)
		if err != nil {
			return nil, err
		}
		if !ok {
			return nil, errors.New("forbidden")
		}
	}
	return s.repo.ListByOrg(ctx, orgID, status)
}

type DecideJoinRequestInput struct {
	Approve      bool
	Role         string
	DecisionNote string
}

func (s *OrgJoinRequestService) Decide(ctx context.Context, requester uuid.UUID, orgID uuid.UUID, requestID uuid.UUID, input DecideJoinRequestInput) (*model.OrgJoinRequest, error) {
	req, err := s.repo.GetByID(ctx, requestID)
	if err != nil {
		return nil, err
	}
	if req.OrgID != orgID {
		return nil, errors.New("invalid request")
	}

	org, err := s.orgRepo.GetByID(ctx, orgID)
	if err != nil {
		return nil, err
	}
	if s.rbac != nil {
		ok, err := s.rbac.CanManageOrg(ctx, requester, org)
		if err != nil {
			return nil, err
		}
		if !ok {
			return nil, errors.New("forbidden")
		}
	}

	if req.Status != model.OrgJoinRequestPending {
		return nil, ErrJoinAlreadyDecided
	}

	note := strings.TrimSpace(input.DecisionNote)
	if len(note) > 255 {
		return nil, errors.New("note too long")
	}

	now := time.Now()
	req.ReviewedAt = &now
	req.ReviewedBy = &requester
	req.DecisionNote = note

	if input.Approve {
		// Jika request berasal dari user login (punya user_id), kita bisa langsung buat membership.
		if s.memberRepo != nil && req.UserID != nil {
			isMember, err := s.memberRepo.IsMember(ctx, orgID, *req.UserID)
			if err != nil {
				return nil, err
			}
			if !isMember {
				role := strings.ToUpper(strings.TrimSpace(input.Role))
				if role == "" {
					role = "MEMBER"
				}
				if err := s.memberRepo.Add(ctx, &model.OrgMember{
					OrgID:  orgID,
					UserID: *req.UserID,
					Role:   role,
				}); err != nil {
					return nil, err
				}
			}
		}
		req.Status = model.OrgJoinRequestApproved
	} else {
		req.Status = model.OrgJoinRequestRejected
	}

	if err := s.repo.Update(ctx, req); err != nil {
		return nil, err
	}
	if s.audit != nil {
		s.audit.Log(ctx, requester, "org_join_request_decide", map[string]any{"org_id": orgID, "request_id": req.ID, "approved": input.Approve})
	}
	return req, nil
}
