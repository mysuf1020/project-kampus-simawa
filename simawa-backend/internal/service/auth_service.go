package service

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"simawa-backend/internal/config"
	"simawa-backend/internal/model"
	"simawa-backend/internal/repository"
)

type AuthService struct {
	cfg        *config.Env
	users      repository.UserRepository
	userRoles  repository.UserRoleRepository
	refreshTok repository.RefreshTokenRepository

	mu        sync.Mutex
	failTrack map[string]failedLogin
	audit     *AuditService
}

type failedLogin struct {
	count      int
	blockUntil time.Time
}

func NewAuthService(
	cfg *config.Env,
	users repository.UserRepository,
	userRoles repository.UserRoleRepository,
	refresh repository.RefreshTokenRepository,
	audit *AuditService,
) *AuthService {
	return &AuthService{
		cfg:        cfg,
		users:      users,
		userRoles:  userRoles,
		refreshTok: refresh,
		failTrack:  make(map[string]failedLogin),
		audit:      audit,
	}
}

/* ====== DTOs ====== */

type LoginRequest struct {
	Login    string // email (bukan lagi username)
	Password string
}

type AuthTokens struct {
	AccessToken  string
	RefreshToken string
	ExpiresIn    int64 // seconds
	TokenType    string
}

type RefreshRequest struct {
	RefreshToken string
}

/* ====== Public ====== */

func (s *AuthService) Login(ctx context.Context, req *LoginRequest) (*AuthTokens, error) {
	if req == nil {
		return nil, errors.New("nil request")
	}
	login := strings.TrimSpace(strings.ToLower(req.Login))
	if !strings.HasSuffix(login, "@raharja.info") && login != "admin@simawa.local" {
		// semua user biasa wajib pakai email @raharja.info
		// admin@simawa.local dibiarkan untuk kebutuhan seeding / admin internal
		return nil, errors.New("invalid credentials")
	}
	if s.isBlocked(req.Login) {
		return nil, errors.New("account locked, try again later")
	}
	u, err := s.users.FindByLogin(ctx, req.Login)
	if err != nil {
		s.registerFailure(req.Login)
		return nil, errors.New("invalid credentials")
	}
	if err := s.users.CheckPassword(ctx, u, req.Password); err != nil {
		s.registerFailure(req.Login)
		return nil, errors.New("invalid credentials")
	}
	s.resetFailure(req.Login)
	if s.audit != nil {
		s.audit.Log(ctx, u.ID, "login_success", map[string]any{"login": req.Login})
	}

	// enforce single active session (refresh token) per user
	_ = s.refreshTok.DeleteByUser(ctx, u.ID)

	accessTTL := s.accessTTL()
	access, _, err := s.buildAccessToken(u, accessTTL)
	if err != nil {
		return nil, err
	}

	refreshTTL := s.refreshTTL()
	refresh, err := s.buildAndStoreRefreshToken(ctx, u, refreshTTL)
	if err != nil {
		return nil, err
	}

	return &AuthTokens{
		AccessToken:  access,
		RefreshToken: refresh,
		ExpiresIn:    int64(accessTTL / time.Second),
		TokenType:    "Bearer",
	}, nil
}

func (s *AuthService) Refresh(ctx context.Context, req *RefreshRequest) (*AuthTokens, error) {
	if req == nil || req.RefreshToken == "" {
		return nil, errors.New("refresh token required")
	}
	rt, err := s.refreshTok.Get(ctx, req.RefreshToken)
	if err != nil || rt == nil || rt.RevokedAt != nil {
		return nil, errors.New("invalid refresh token")
	}
	if time.Now().After(rt.ExpiresAt) {
		return nil, errors.New("refresh token expired")
	}

	// after (sinkron dengan UUID)
	u, err := s.users.GetByUUID(ctx, rt.UserID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	accessTTL := s.accessTTL()
	refreshTTL := s.refreshTTL()

	// rotate refresh token
	newRefresh, err := s.rotateRefresh(ctx, rt, u, refreshTTL)
	if err != nil {
		return nil, err
	}
	access, _, err := s.buildAccessToken(u, accessTTL)
	if err != nil {
		return nil, err
	}

	return &AuthTokens{
		AccessToken:  access,
		RefreshToken: newRefresh,
		ExpiresIn:    int64(accessTTL / time.Second),
		TokenType:    "Bearer",
	}, nil
}

func (s *AuthService) Logout(ctx context.Context, refreshToken string) error {
	if refreshToken == "" {
		return errors.New("refresh token required")
	}
	return s.refreshTok.Revoke(ctx, refreshToken)
}

/* ====== Internals ====== */

func (s *AuthService) accessTTL() time.Duration {
	if s.cfg != nil && s.cfg.Auth.AccessTokenExpiry > 0 {
		return s.cfg.Auth.AccessTokenExpiry
	}
	return 15 * time.Minute
}
func (s *AuthService) refreshTTL() time.Duration {
	// fallback: 7d
	return 7 * 24 * time.Hour
}

func (s *AuthService) isBlocked(login string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	fl := s.failTrack[login]
	if fl.blockUntil.After(time.Now()) {
		return true
	}
	return false
}

func (s *AuthService) registerFailure(login string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	fl := s.failTrack[login]
	fl.count++
	if fl.count >= 5 {
		fl.blockUntil = time.Now().Add(15 * time.Minute)
		fl.count = 0
	}
	s.failTrack[login] = fl
}

func (s *AuthService) resetFailure(login string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.failTrack, login)
}

func (s *AuthService) jwtSecret() []byte {
	secret := ""
	if s.cfg != nil {
		secret = s.cfg.Auth.JWTSecret
	}
	if secret == "" {
		secret = "change-me"
	}
	return []byte(secret)
}

func (s *AuthService) buildAccessToken(u *model.User, ttl time.Duration) (string, time.Time, error) {
	now := time.Now()
	exp := now.Add(ttl)

	roleCodes := []string{}
	if s.userRoles != nil {
		if rows, err := s.userRoles.ListAssignments(context.Background(), u.ID); err == nil {
			seen := map[string]struct{}{}
			for _, r := range rows {
				code := strings.ToUpper(strings.TrimSpace(r.RoleCode))
				if code == "" {
					continue
				}
				if _, ok := seen[code]; ok {
					continue
				}
				seen[code] = struct{}{}
				roleCodes = append(roleCodes, code)
			}
		}
	}
	if len(roleCodes) == 0 {
		roleCodes = []string{model.RoleUser}
	}

	claims := jwt.MapClaims{
		"sub":   u.ID.String(),
		"exp":   exp.Unix(),
		"iat":   now.Unix(),
		"nbf":   now.Unix(),
		"email": u.Email,
		"usr":   u.Username,
		"roles": roleCodes,
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	ss, err := token.SignedString(s.jwtSecret())
	if err != nil {
		return "", time.Time{}, err
	}
	return ss, exp, nil
}

func (s *AuthService) buildAndStoreRefreshToken(ctx context.Context, u *model.User, ttl time.Duration) (string, error) {
	now := time.Now()
	exp := now.Add(ttl)

	raw, err := secureRandomString(48)
	if err != nil {
		return "", err
	}
	rt := &model.RefreshToken{
		UserID:    u.ID,
		Token:     raw,
		CreatedAt: now,
		ExpiresAt: exp,
	}
	if err := s.refreshTok.Create(ctx, rt); err != nil {
		return "", err
	}
	return rt.Token, nil
}

func (s *AuthService) rotateRefresh(ctx context.Context, old *model.RefreshToken, u *model.User, ttl time.Duration) (string, error) {
	now := time.Now()
	exp := now.Add(ttl)

	raw, err := secureRandomString(48)
	if err != nil {
		return "", err
	}
	newRT := &model.RefreshToken{
		UserID:    u.ID,
		Token:     raw,
		CreatedAt: now,
		ExpiresAt: exp,
	}
	if err := s.refreshTok.Rotate(ctx, old.Token, newRT); err != nil {
		return "", err
	}
	return newRT.Token, nil
}

func secureRandomString(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	// base64 URL-safe, strip padding
	s := base64.RawURLEncoding.EncodeToString(b)
	return s, nil
}
