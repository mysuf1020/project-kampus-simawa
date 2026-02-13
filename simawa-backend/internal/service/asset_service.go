package service

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"simawa-backend/internal/model"
	"simawa-backend/internal/repository"
)

type AssetService struct {
	assetRepo     repository.AssetRepository
	borrowingRepo repository.AssetBorrowingRepository
	audit         *AuditService
}

func NewAssetService(ar repository.AssetRepository, br repository.AssetBorrowingRepository, audit *AuditService) *AssetService {
	return &AssetService{assetRepo: ar, borrowingRepo: br, audit: audit}
}

// --- Asset CRUD ---

func (s *AssetService) CreateAsset(ctx context.Context, userID uuid.UUID, orgID uuid.UUID, name, description string, quantity int) (*model.Asset, error) {
	if name == "" {
		return nil, errors.New("nama asset wajib diisi")
	}
	if quantity < 1 {
		quantity = 1
	}
	a := &model.Asset{
		OrgID:       orgID,
		Name:        name,
		Description: description,
		Quantity:    quantity,
		Status:      model.AssetStatusAvailable,
	}
	if err := s.assetRepo.Create(ctx, a); err != nil {
		return nil, err
	}
	if s.audit != nil {
		s.audit.Log(ctx, userID, "asset_create", map[string]any{"asset_id": a.ID, "org_id": orgID})
	}
	return a, nil
}

func (s *AssetService) UpdateAsset(ctx context.Context, userID uuid.UUID, id uint, name, description string, quantity int) (*model.Asset, error) {
	a, err := s.assetRepo.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	if name != "" {
		a.Name = name
	}
	a.Description = description
	if quantity > 0 {
		a.Quantity = quantity
	}
	if err := s.assetRepo.Update(ctx, a); err != nil {
		return nil, err
	}
	if s.audit != nil {
		s.audit.Log(ctx, userID, "asset_update", map[string]any{"asset_id": a.ID, "org_id": a.OrgID})
	}
	return a, nil
}

func (s *AssetService) DeleteAsset(ctx context.Context, userID uuid.UUID, id uint) error {
	a, err := s.assetRepo.Get(ctx, id)
	if err != nil {
		return err
	}
	if err := s.assetRepo.Delete(ctx, id); err != nil {
		return err
	}
	if s.audit != nil {
		s.audit.Log(ctx, userID, "asset_delete", map[string]any{"asset_id": id, "org_id": a.OrgID})
	}
	return nil
}

func (s *AssetService) GetAsset(ctx context.Context, id uint) (*model.Asset, error) {
	return s.assetRepo.Get(ctx, id)
}

func (s *AssetService) ListAssets(ctx context.Context, orgID uuid.UUID) ([]model.Asset, error) {
	return s.assetRepo.ListByOrg(ctx, orgID)
}

// --- Borrowing ---

type BorrowInput struct {
	AssetID    uint
	OrgID      uuid.UUID
	BorrowerID uuid.UUID
	SuratID    *uint
	Quantity   int
	BorrowDate time.Time
	ReturnDate time.Time
	Note       string
}

func (s *AssetService) BorrowAsset(ctx context.Context, input BorrowInput) (*model.AssetBorrowing, error) {
	asset, err := s.assetRepo.Get(ctx, input.AssetID)
	if err != nil {
		return nil, errors.New("asset tidak ditemukan")
	}
	if asset.Status == model.AssetStatusBorrowed {
		return nil, errors.New("asset sedang dipinjam")
	}
	if input.Quantity < 1 {
		input.Quantity = 1
	}

	b := &model.AssetBorrowing{
		AssetID:    input.AssetID,
		SuratID:    input.SuratID,
		BorrowerID: input.BorrowerID,
		OrgID:      input.OrgID,
		Quantity:   input.Quantity,
		BorrowDate: input.BorrowDate,
		ReturnDate: input.ReturnDate,
		Status:     "BORROWED",
		Note:       input.Note,
	}
	if err := s.borrowingRepo.Create(ctx, b); err != nil {
		return nil, err
	}

	// Update asset status
	asset.Status = model.AssetStatusBorrowed
	_ = s.assetRepo.Update(ctx, asset)

	if s.audit != nil {
		s.audit.Log(ctx, input.BorrowerID, "asset_borrow", map[string]any{"asset_id": input.AssetID, "org_id": input.OrgID, "borrowing_id": b.ID})
	}
	return b, nil
}

func (s *AssetService) ReturnAsset(ctx context.Context, userID uuid.UUID, borrowingID uint) (*model.AssetBorrowing, error) {
	b, err := s.borrowingRepo.Get(ctx, borrowingID)
	if err != nil {
		return nil, errors.New("peminjaman tidak ditemukan")
	}
	if b.Status == "RETURNED" {
		return nil, errors.New("asset sudah dikembalikan")
	}

	now := time.Now()
	b.ReturnedAt = &now
	b.Status = "RETURNED"
	if err := s.borrowingRepo.Update(ctx, b); err != nil {
		return nil, err
	}

	// Update asset status back to available
	asset, err := s.assetRepo.Get(ctx, b.AssetID)
	if err == nil {
		asset.Status = model.AssetStatusAvailable
		_ = s.assetRepo.Update(ctx, asset)
	}

	if s.audit != nil {
		s.audit.Log(ctx, userID, "asset_return", map[string]any{"asset_id": b.AssetID, "org_id": b.OrgID, "borrowing_id": b.ID})
	}
	return b, nil
}

func (s *AssetService) ListBorrowings(ctx context.Context, orgID uuid.UUID) ([]model.AssetBorrowing, error) {
	return s.borrowingRepo.ListByOrg(ctx, orgID)
}

func (s *AssetService) ListBorrowingsBySurat(ctx context.Context, suratID uint) ([]model.AssetBorrowing, error) {
	return s.borrowingRepo.ListBySurat(ctx, suratID)
}
