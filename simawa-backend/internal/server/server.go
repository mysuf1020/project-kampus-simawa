package server

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/minio/minio-go/v7"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"

	"simawa-backend/internal/config"
	"simawa-backend/internal/handler"
	database "simawa-backend/internal/infrastructure/db"
	minioInfra "simawa-backend/internal/infrastructure/minio"
	redisInfra "simawa-backend/internal/infrastructure/redis"
	"simawa-backend/internal/middleware"
	"simawa-backend/internal/model"
	"simawa-backend/internal/repository"
	"simawa-backend/internal/router"
	"simawa-backend/internal/service"
)

type Server struct {
	Config    *config.Env
	DB        *gorm.DB
	Minio     *minio.Client
	Redis     *redis.Client
	Engine    *gin.Engine
	StartTime time.Time

	Repositories struct {
		User         repository.UserRepository
		UserRole     repository.UserRoleRepository
		RefreshToken repository.RefreshTokenRepository
		OTP          repository.OTPRepository
		Surat        repository.SuratRepository
		Org          repository.OrganizationRepository
		Activity     repository.ActivityRepository
		LPJ          repository.LPJRepository
		OrgMember    repository.OrgMemberRepository
		OrgJoinReq   repository.OrgJoinRequestRepository
		Notify       repository.NotificationRepository
		ActHistory   repository.ActivityHistoryRepository
		Audit        repository.AuditLogRepository
		LPJHistory   repository.LPJHistoryRepository
		Asset        repository.AssetRepository
		AssetBorrow  repository.AssetBorrowingRepository
	}

	Services struct {
		User      *service.UserService
		RBAC      *service.RBACService
		Auth      *service.AuthService
		Surat     service.SuratService
		Org       *service.OrganizationService
		Activity  *service.ActivityService
		LPJ       *service.LPJService
		Member    *service.OrgMemberService
		JoinReq   *service.OrgJoinRequestService
		Notify    *service.NotificationService
		Dashboard *service.DashboardService
		Audit     *service.AuditService
		Captcha   *service.CaptchaService
		Report    *service.ReportService
		Asset     *service.AssetService
	}

	Handlers struct {
		User      *handler.UserHandler
		Auth      *handler.AuthHandler
		Surat     *handler.SuratHandler
		Org       *handler.OrganizationHandler
		Activity  *handler.ActivityHandler
		LPJ       *handler.LPJHandler
		Member    *handler.OrgMemberHandler
		JoinReq   *handler.OrgJoinRequestHandler
		Notify    *handler.NotificationHandler
		Dashboard *handler.DashboardHandler
		Health    *handler.HealthHandler
		Audit     *handler.AuditLogHandler
		Report    *handler.ReportHandler
		Asset     *handler.AssetHandler
	}
}

func NewServer(cfg *config.Env) (*Server, error) {
	s := &Server{Config: cfg, StartTime: time.Now()}

	if err := s.initDatabase(); err != nil {
		return nil, err
	}
	if err := s.autoMigrate(); err != nil {
		return nil, err
	}
	s.initMinio()
	s.initRedis()
	s.initRepositories()
	s.initServices()
	s.initHandlers()
	s.initRouter()
	s.initRedis()

	return s, nil
}

func (s *Server) initDatabase() error {
	s.DB = database.Init(s.Config)
	return nil
}

func (s *Server) autoMigrate() error {
	if s.DB == nil {
		return fmt.Errorf("db not initialized")
	}
	if err := s.DB.AutoMigrate(
		&model.User{},
		&model.Role{},
		&model.UserRole{},
		&model.RefreshToken{},
		&model.Surat{},
		&model.Organization{},
		&model.Activity{},
		&model.LPJ{},
		&model.OrgMember{},
		&model.OrgJoinRequest{},
		&model.Notification{},
		&model.ActivityHistory{},
		&model.LPJHistory{},
		&model.AuditLog{},
		&model.OTP{},
		&model.Asset{},
		&model.AssetBorrowing{},
	); err != nil {
		return err
	}
	// Create performance indexes
	return database.CreateIndexes(s.DB)
}

func (s *Server) initMinio() {
	// optional; allow disabled via env or empty endpoint
	if s.Config.Minio.Disabled || s.Config.Minio.Endpoint == "" {
		return
	}
	s.Minio = minioInfra.Init(s.Config)
}

func (s *Server) initRedis() {
	if s.Config.Redis.Address == "" {
		return
	}
	s.Redis = redisInfra.NewClient(&s.Config.Redis)
}

func (s *Server) initRepositories() {
	s.Repositories.User = repository.NewUserRepository(s.DB)
	s.Repositories.UserRole = repository.NewUserRoleRepository(s.DB)
	s.Repositories.RefreshToken = repository.NewRefreshTokenRepository(s.DB)
	s.Repositories.Surat = repository.NewSuratRepository(s.DB)
	s.Repositories.Org = repository.NewOrganizationRepository(s.DB)
	s.Repositories.Activity = repository.NewActivityRepository(s.DB)
	s.Repositories.LPJ = repository.NewLPJRepository(s.DB)
	s.Repositories.OrgMember = repository.NewOrgMemberRepository(s.DB)
	s.Repositories.OrgJoinReq = repository.NewOrgJoinRequestRepository(s.DB)
	s.Repositories.Notify = repository.NewNotificationRepository(s.DB)
	s.Repositories.ActHistory = repository.NewActivityHistoryRepository(s.DB)
	s.Repositories.Audit = repository.NewAuditLogRepository(s.DB)
	s.Repositories.LPJHistory = repository.NewLPJHistoryRepository(s.DB)
	s.Repositories.OTP = repository.NewOTPRepository(s.DB)
	s.Repositories.Asset = repository.NewAssetRepository(s.DB)
	s.Repositories.AssetBorrow = repository.NewAssetBorrowingRepository(s.DB)
}

func (s *Server) initServices() {
	s.Services.User = service.NewUserService(s.Repositories.User, s.Config.App.EmailDomain)
	s.Services.RBAC = service.NewRBACService(s.Repositories.UserRole)
	s.Services.Audit = service.NewAuditService(s.Repositories.Audit)
	s.Services.Captcha = service.NewCaptchaService(s.Config)
	s.Services.Notify = service.NewNotificationService(s.Repositories.Notify)
	emailSvc := service.NewEmailService(&s.Config.SMTP)
	s.Services.Auth = service.NewAuthService(s.Config, s.Repositories.User, s.Repositories.UserRole, s.Repositories.RefreshToken, s.Repositories.OTP, s.Redis, emailSvc, s.Services.Audit)
	s.Services.Surat = service.NewSuratServiceWithRepo(s.Repositories.Surat, s.Repositories.Org, s.Services.Audit, s.Services.Notify)
	s.Services.Org = service.NewOrganizationService(s.Repositories.Org, s.Services.RBAC, s.Services.Audit)
	s.Services.Activity = service.NewActivityService(s.Repositories.Activity, s.Repositories.Org, s.Repositories.ActHistory, s.Services.RBAC, s.Services.Notify, s.Services.Audit)
	s.Services.LPJ = service.NewLPJService(s.Repositories.LPJ, s.Repositories.Activity, s.Repositories.Org, s.Services.RBAC, s.Services.Notify, s.Repositories.LPJHistory, s.Services.Audit)
	s.Services.Member = service.NewOrgMemberService(s.Repositories.OrgMember, s.Repositories.Org, s.Services.RBAC, s.Services.Audit)
	s.Services.JoinReq = service.NewOrgJoinRequestService(s.Repositories.OrgJoinReq, s.Repositories.Org, s.Repositories.User, s.Repositories.OrgMember, s.Services.RBAC, s.Services.Audit)
	s.Services.Dashboard = service.NewDashboardService(s.DB)
	s.Services.Report = service.NewReportService(s.Repositories.Activity, s.Repositories.Surat, s.Repositories.LPJ)
	s.Services.Asset = service.NewAssetService(s.Repositories.Asset, s.Repositories.AssetBorrow, s.Services.Audit)

	// Ensure base roles exist
	_ = s.Repositories.UserRole.EnsureBaseRoles(context.Background())

	go s.reminderLoop()
}

func (s *Server) initHandlers() {
	s.Handlers.User = handler.NewUserHandler(s.Services.User, s.Services.Auth, s.Services.RBAC)
	s.Handlers.Auth = handler.NewAuthHandler(s.Services.Auth, s.Services.Captcha)
	s.Handlers.Asset = handler.NewAssetHandler(s.Services.Asset, s.Services.RBAC)
	s.Handlers.Surat = handler.NewSuratHandler(s.Services.Surat, s.Minio, s.Config.Minio.Bucket, s.Services.RBAC)
	minioPublicBaseURL := ""
	if !s.Config.Minio.Disabled && s.Config.Minio.Endpoint != "" {
		scheme := "http"
		if s.Config.Minio.UseSSL {
			scheme = "https"
		}
		minioPublicBaseURL = fmt.Sprintf("%s://%s", scheme, strings.TrimRight(s.Config.Minio.Endpoint, "/"))
	}
	s.Handlers.Org = handler.NewOrganizationHandler(s.Services.Org, s.Services.Member, s.Minio, s.Config.Minio.Bucket, minioPublicBaseURL)
	s.Handlers.Activity = handler.NewActivityHandler(s.Services.Activity, s.Minio, s.Config.Minio.Bucket)
	s.Handlers.LPJ = handler.NewLPJHandlerWithRBAC(s.Services.LPJ, s.Minio, s.Config.Minio.Bucket, s.Services.RBAC, s.DB)
	s.Handlers.Member = handler.NewOrgMemberHandler(s.Services.Member, s.Services.Org, s.Services.RBAC)
	s.Handlers.JoinReq = handler.NewOrgJoinRequestHandler(s.Services.JoinReq)
	s.Handlers.Notify = handler.NewNotificationHandler(s.Services.Notify)
	s.Handlers.Dashboard = handler.NewDashboardHandler(s.Services.Dashboard)
	s.Handlers.Report = handler.NewReportHandler(s.Services.Report)
	s.Handlers.Audit = handler.NewAuditLogHandler(s.DB)
	s.Handlers.Health = handler.NewHealthHandler(s.StartTime, s.DB, s.Redis, s.Minio, func() map[string]int64 {
		counts := map[string]int64{}
		var c int64
		s.DB.Model(&model.Activity{}).Where("status = ?", model.ActivityStatusPending).Count(&c)
		counts["activities_pending"] = c
		s.DB.Model(&model.LPJ{}).Where("status = ?", model.LPJStatusPending).Count(&c)
		counts["lpj_pending"] = c
		s.DB.Model(&model.Surat{}).Where("status = ?", model.SuratStatusPending).Count(&c)
		counts["surat_pending"] = c
		return counts
	})
}

func (s *Server) initRouter() {
	engine := gin.New()
	engine.Use(gin.Recovery())
	engine.Use(middleware.RequestLogger())
	engine.Use(middleware.AuditContext())
	engine.Use(middleware.SecurityMiddleware(s.Redis))
	router.Register(engine, s.Config, s.Handlers.Auth, s.Handlers.User, s.Handlers.Surat, s.Handlers.Org, s.Services.RBAC)
	router.RegisterActivityRoutes(engine, s.Config, s.Handlers.Activity, s.Services.RBAC)
	router.RegisterLPJRoutes(engine, s.Config, s.Handlers.LPJ, s.Services.RBAC)
	router.RegisterMemberRoutes(engine, s.Config, s.Handlers.Member, s.Services.RBAC)
	router.RegisterOrgJoinRequestRoutes(engine, s.Config, s.Handlers.JoinReq, s.Services.RBAC)
	router.RegisterNotificationRoutes(engine, s.Config, s.Handlers.Notify)
	router.RegisterDashboardRoutes(engine, s.Config, s.Handlers.Dashboard, s.Services.RBAC)
	router.RegisterReportRoutes(engine, s.Config, s.Handlers.Report, s.Services.RBAC)
	router.RegisterAuditLogRoutes(engine, s.Config, s.Handlers.Audit, s.Services.RBAC)
	router.RegisterAssetRoutes(engine, s.Config, s.Handlers.Asset, s.Services.RBAC)
	router.RegisterHealthRoutes(engine, s.Handlers.Health)
	s.Engine = engine
}

func (s *Server) Start() error {
	addr := fmt.Sprintf("%s:%d", s.Config.Server.Host, s.Config.Server.Port)
	return s.Engine.Run(addr)
}

func (s *Server) reminderLoop() {
	if s.Services.Activity == nil || s.Services.Notify == nil {
		return
	}
	ticker := time.NewTicker(12 * time.Hour)
	for range ticker.C {
		ctx := context.Background()
		acts, err := s.Services.Activity.ListPublic(ctx, time.Now().Add(-24*time.Hour))
		if err != nil {
			continue
		}
		now := time.Now()
		for _, a := range acts {
			diff := a.StartAt.Sub(now)
			if diff.Hours() <= 72 && diff.Hours() >= 0 {
				_ = s.Services.Notify.Push(ctx, a.CreatedBy, "Pengingat kegiatan", a.Title, map[string]any{"activity_id": a.ID})
			}
			if diff.Hours() <= 24 && diff.Hours() >= 0 {
				_ = s.Services.Notify.Push(ctx, a.CreatedBy, "Pengingat H-1", a.Title, map[string]any{"activity_id": a.ID})
			}
			if now.After(a.EndAt) && now.Sub(a.EndAt) <= 24*time.Hour {
				_ = s.Services.Notify.Push(ctx, a.CreatedBy, "LPJ diperlukan", a.Title, map[string]any{"activity_id": a.ID})
			}
		}
	}
}

