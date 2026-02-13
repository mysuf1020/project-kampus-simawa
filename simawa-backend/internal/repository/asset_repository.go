package repository

import (
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"simawa-backend/internal/model"
)

type AssetRepository interface {
	Create(ctx context.Context, a *model.Asset) error
	Update(ctx context.Context, a *model.Asset) error
	Delete(ctx context.Context, id uint) error
	Get(ctx context.Context, id uint) (*model.Asset, error)
	ListByOrg(ctx context.Context, orgID uuid.UUID) ([]model.Asset, error)
}

type AssetBorrowingRepository interface {
	Create(ctx context.Context, b *model.AssetBorrowing) error
	Update(ctx context.Context, b *model.AssetBorrowing) error
	Get(ctx context.Context, id uint) (*model.AssetBorrowing, error)
	ListByOrg(ctx context.Context, orgID uuid.UUID) ([]model.AssetBorrowing, error)
	ListBySurat(ctx context.Context, suratID uint) ([]model.AssetBorrowing, error)
	ListByAsset(ctx context.Context, assetID uint) ([]model.AssetBorrowing, error)
}

// --- Asset ---

type assetRepo struct{ db *gorm.DB }

func NewAssetRepository(db *gorm.DB) AssetRepository { return &assetRepo{db: db} }

func (r *assetRepo) Create(ctx context.Context, a *model.Asset) error {
	return r.db.WithContext(ctx).Create(a).Error
}

func (r *assetRepo) Update(ctx context.Context, a *model.Asset) error {
	return r.db.WithContext(ctx).Save(a).Error
}

func (r *assetRepo) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&model.Asset{}, id).Error
}

func (r *assetRepo) Get(ctx context.Context, id uint) (*model.Asset, error) {
	var a model.Asset
	if err := r.db.WithContext(ctx).First(&a, id).Error; err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *assetRepo) ListByOrg(ctx context.Context, orgID uuid.UUID) ([]model.Asset, error) {
	var list []model.Asset
	err := r.db.WithContext(ctx).Where("org_id = ?", orgID).Order("name ASC").Find(&list).Error
	return list, err
}

// --- AssetBorrowing ---

type assetBorrowingRepo struct{ db *gorm.DB }

func NewAssetBorrowingRepository(db *gorm.DB) AssetBorrowingRepository {
	return &assetBorrowingRepo{db: db}
}

func (r *assetBorrowingRepo) Create(ctx context.Context, b *model.AssetBorrowing) error {
	return r.db.WithContext(ctx).Create(b).Error
}

func (r *assetBorrowingRepo) Update(ctx context.Context, b *model.AssetBorrowing) error {
	return r.db.WithContext(ctx).Save(b).Error
}

func (r *assetBorrowingRepo) Get(ctx context.Context, id uint) (*model.AssetBorrowing, error) {
	var b model.AssetBorrowing
	if err := r.db.WithContext(ctx).Preload("Asset").First(&b, id).Error; err != nil {
		return nil, err
	}
	return &b, nil
}

func (r *assetBorrowingRepo) ListByOrg(ctx context.Context, orgID uuid.UUID) ([]model.AssetBorrowing, error) {
	var list []model.AssetBorrowing
	err := r.db.WithContext(ctx).Preload("Asset").Where("org_id = ?", orgID).Order("created_at DESC").Find(&list).Error
	return list, err
}

func (r *assetBorrowingRepo) ListBySurat(ctx context.Context, suratID uint) ([]model.AssetBorrowing, error) {
	var list []model.AssetBorrowing
	err := r.db.WithContext(ctx).Preload("Asset").Where("surat_id = ?", suratID).Find(&list).Error
	return list, err
}

func (r *assetBorrowingRepo) ListByAsset(ctx context.Context, assetID uint) ([]model.AssetBorrowing, error) {
	var list []model.AssetBorrowing
	err := r.db.WithContext(ctx).Preload("Asset").Where("asset_id = ?", assetID).Order("created_at DESC").Find(&list).Error
	return list, err
}
