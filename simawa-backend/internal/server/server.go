package server

import (
	"context"
	"errors"
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
}

func (s *Server) initServices() {
	s.Services.User = service.NewUserService(s.Repositories.User, s.Config.App.EmailDomain)
	s.Services.RBAC = service.NewRBACService(s.Repositories.UserRole)
	s.Services.Audit = service.NewAuditService(s.Repositories.Audit)
	s.Services.Captcha = service.NewCaptchaService(s.Config)
	s.Services.Notify = service.NewNotificationService(s.Repositories.Notify)
	emailSvc := service.NewEmailService(&s.Config.SMTP)
	s.Services.Auth = service.NewAuthService(s.Config, s.Repositories.User, s.Repositories.UserRole, s.Repositories.RefreshToken, s.Redis, emailSvc, s.Services.Audit)
	s.Services.Surat = service.NewSuratServiceWithRepo(s.Repositories.Surat, s.Repositories.Org, s.Services.Audit, s.Services.Notify)
	s.Services.Org = service.NewOrganizationService(s.Repositories.Org, s.Services.RBAC, s.Services.Audit)
	s.Services.Activity = service.NewActivityService(s.Repositories.Activity, s.Repositories.ActHistory, s.Services.RBAC, s.Services.Notify, s.Services.Audit)
	s.Services.LPJ = service.NewLPJService(s.Repositories.LPJ, s.Repositories.Activity, s.Services.RBAC, s.Services.Notify, s.Repositories.LPJHistory, s.Services.Audit)
	s.Services.Member = service.NewOrgMemberService(s.Repositories.OrgMember, s.Repositories.Org, s.Services.RBAC, s.Services.Audit)
	s.Services.JoinReq = service.NewOrgJoinRequestService(s.Repositories.OrgJoinReq, s.Repositories.Org, s.Repositories.User, s.Repositories.OrgMember, s.Services.RBAC, s.Services.Audit)
	s.Services.Dashboard = service.NewDashboardService(s.DB)
	s.Services.Report = service.NewReportService(s.Repositories.Activity, s.Repositories.Surat, s.Repositories.LPJ)

	// Seed base roles
	_ = s.Repositories.UserRole.EnsureBaseRoles(context.Background())
	// Seed base organizations
	_ = s.Repositories.Org.EnsureSeeds(context.Background(), seedOrganizations())
	// One-off rename: "Raharja FC" -> "FC Raharja" while keeping slug "raharja-fc".
	_ = s.renameOrgIfNeeded(context.Background(), "raharja-fc", "Raharja FC", "FC Raharja")
	// Seed default super admin
	_ = s.seedAdminUser()

	go s.reminderLoop()
}

func (s *Server) renameOrgIfNeeded(ctx context.Context, slug string, from string, to string) error {
	org, err := s.Repositories.Org.GetBySlug(ctx, slug)
	if err != nil {
		return nil
	}
	if org.Name != from {
		return nil
	}
	org.Name = to
	return s.Repositories.Org.Update(ctx, org)
}

func (s *Server) initHandlers() {
	s.Handlers.User = handler.NewUserHandler(s.Services.User, s.Services.Auth, s.Services.RBAC)
	s.Handlers.Auth = handler.NewAuthHandler(s.Services.Auth, s.Services.Captcha)
	s.Handlers.Surat = handler.NewSuratHandler(s.Services.Surat, s.Minio, s.Config.Minio.Bucket, s.Services.RBAC)
	minioPublicBaseURL := ""
	if !s.Config.Minio.Disabled && s.Config.Minio.Endpoint != "" {
		scheme := "http"
		if s.Config.Minio.UseSSL {
			scheme = "https"
		}
		minioPublicBaseURL = fmt.Sprintf("%s://%s", scheme, strings.TrimRight(s.Config.Minio.Endpoint, "/"))
	}
	s.Handlers.Org = handler.NewOrganizationHandler(s.Services.Org, s.Minio, s.Config.Minio.Bucket, minioPublicBaseURL)
	s.Handlers.Activity = handler.NewActivityHandler(s.Services.Activity, s.Minio, s.Config.Minio.Bucket)
	s.Handlers.LPJ = handler.NewLPJHandler(s.Services.LPJ, s.Minio, s.Config.Minio.Bucket)
	s.Handlers.Member = handler.NewOrgMemberHandler(s.Services.Member, s.Services.Org, s.Services.RBAC)
	s.Handlers.JoinReq = handler.NewOrgJoinRequestHandler(s.Services.JoinReq)
	s.Handlers.Notify = handler.NewNotificationHandler(s.Services.Notify)
	s.Handlers.Dashboard = handler.NewDashboardHandler(s.Services.Dashboard)
	s.Handlers.Audit = handler.NewAuditLogHandler(s.DB)
	s.Handlers.Health = handler.NewHealthHandler(s.StartTime, s.DB, s.Redis, s.Minio, func() map[string]int64 {
		counts := map[string]int64{}
		var c int64
		s.DB.Model(&model.Activity{}).Where("status = ?", model.ActivityStatusPending).Count(&c)
		counts["activities_pending"] = c
		s.DB.Model(&model.Activity{}).Where("cover_key <> '' AND cover_approved = ?", false).Count(&c)
		counts["activities_cover_pending"] = c
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
	engine.Use(middleware.SecurityMiddleware(s.Redis))
	router.Register(engine, s.Config, s.Handlers.Auth, s.Handlers.User, s.Handlers.Surat, s.Handlers.Org, s.Services.RBAC)
	router.RegisterActivityRoutes(engine, s.Config, s.Handlers.Activity, s.Services.RBAC)
	router.RegisterLPJRoutes(engine, s.Config, s.Handlers.LPJ, s.Services.RBAC)
	router.RegisterMemberRoutes(engine, s.Config, s.Handlers.Member, s.Services.RBAC)
	router.RegisterOrgJoinRequestRoutes(engine, s.Config, s.Handlers.JoinReq, s.Services.RBAC)
	router.RegisterNotificationRoutes(engine, s.Config, s.Handlers.Notify)
	router.RegisterDashboardRoutes(engine, s.Config, s.Handlers.Dashboard, s.Services.RBAC)
	router.RegisterReportRoutes(engine, s.Config, s.Handlers.Report, s.Services.RBAC)
	router.RegisterAuditLogRoutes(engine, s.Config, s.Handlers.Audit)
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

func (s *Server) seedAdminUser() error {
	ctx := context.Background()
	const login = "admin@simawa.local"
	const username = "admin"
	const password = "REDACTED"

	if s.Repositories.User == nil || s.Repositories.UserRole == nil {
		return nil
	}

	if existing, err := s.Repositories.User.FindByLogin(ctx, login); err == nil && existing != nil {
		// Ensure the admin role is present even if the user was seeded earlier.
		_ = s.Repositories.UserRole.Assign(ctx, &model.UserRole{
			UserID:   existing.ID,
			RoleCode: model.RoleAdmin,
		})
		return nil
	} else if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	hash, err := repository.BcryptHash(password)
	if err != nil {
		return err
	}

	user := &model.User{
		Username:     username,
		FirstName:    "Admin",
		SecondName:   "SIMAWA",
		Organisasi:   false,
		Jurusan:      "Teknik",
		NIM:          "0001",
		Email:        login,
		Phone:        "0800000000",
		Alamat:       "",
		PasswordHash: hash,
	}

	if err := s.Repositories.User.Create(ctx, user); err != nil {
		return err
	}

	_ = s.Repositories.UserRole.Assign(ctx, &model.UserRole{
		UserID:   user.ID,
		RoleCode: model.RoleAdmin,
	})

	return nil
}

func seedOrganizations() []model.Organization {
	names := []struct {
		Name string
		Slug string
		Type model.OrganizationType
	}{
		{Name: "Himtif", Type: model.OrgTypeUKM},
		{Name: "Komasi", Type: model.OrgTypeUKM},
		{Name: "Himasikom", Type: model.OrgTypeUKM},
		{Name: "Immi", Type: model.OrgTypeUKM},
		{Name: "Ripala", Type: model.OrgTypeUKM},
		{Name: "Fummri", Type: model.OrgTypeUKM},
		{Name: "Abster", Type: model.OrgTypeUKM},
		{Name: "PB Raharja", Type: model.OrgTypeUKM},
		// Keep the historical slug to avoid breaking existing URLs.
		{Name: "FC Raharja", Slug: "raharja-fc", Type: model.OrgTypeUKM},
		{Name: "Apsi", Type: model.OrgTypeUKM},
		{Name: "Maranatha", Type: model.OrgTypeUKM},
		{Name: "BEM", Type: model.OrgTypeBEM},
		{Name: "DEMA", Type: model.OrgTypeDEMA},
	}

	res := make([]model.Organization, 0, len(names))
	for _, n := range names {
		slug := n.Slug
		if strings.TrimSpace(slug) == "" {
			slug = slugify(n.Name)
		}
		res = append(res, model.Organization{
			Name: n.Name,
			Slug: slug,
			Type: n.Type,
		})
	}
	return res
}

func slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = strings.ReplaceAll(s, " ", "-")
	return s
}
