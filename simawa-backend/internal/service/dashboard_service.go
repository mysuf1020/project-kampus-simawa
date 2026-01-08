package service

import (
	"context"

	"gorm.io/gorm"
)

type DashboardService struct {
	db *gorm.DB
}

type DashboardSummary struct {
	ActivitiesPending int64    `json:"activities_pending"`
	CoverPending      int64    `json:"cover_pending"`
	LPJPending        int64    `json:"lpj_pending"`
	SuratPending      int64    `json:"surat_pending"`
	OrgTotal          int64    `json:"org_total"`
	UsersTotal        int64    `json:"users_total"`
	LastAchievements  []string `json:"last_achievements"`
}

func NewDashboardService(db *gorm.DB) *DashboardService {
	return &DashboardService{db: db}
}

func (s *DashboardService) Summary(ctx context.Context) (*DashboardSummary, error) {
	sum := &DashboardSummary{}
	if err := s.db.WithContext(ctx).Table("activities").Where("status = ?", "PENDING").Count(&sum.ActivitiesPending).Error; err != nil {
		return nil, err
	}
	if err := s.db.WithContext(ctx).Table("activities").Where("cover_key <> '' AND cover_approved = ?", false).Count(&sum.CoverPending).Error; err != nil {
		return nil, err
	}
	if err := s.db.WithContext(ctx).Table("lpjs").Where("status = ?", "PENDING").Count(&sum.LPJPending).Error; err != nil {
		return nil, err
	}
	if err := s.db.WithContext(ctx).Table("surats").Where("status = ?", "PENDING").Count(&sum.SuratPending).Error; err != nil {
		return nil, err
	}
	if err := s.db.WithContext(ctx).Table("organizations").Count(&sum.OrgTotal).Error; err != nil {
		return nil, err
	}
	if err := s.db.WithContext(ctx).Table("users").Count(&sum.UsersTotal).Error; err != nil {
		return nil, err
	}
	var names []string
	_ = s.db.WithContext(ctx).Table("lpjs").Select("summary").Where("status = ?", "APPROVED").Order("updated_at DESC").Limit(5).Scan(&names).Error
	sum.LastAchievements = names
	return sum, nil
}
