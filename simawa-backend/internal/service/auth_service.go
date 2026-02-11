package service

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"

	"simawa-backend/internal/config"
	"simawa-backend/internal/dto"
	"simawa-backend/internal/model"

	"simawa-backend/internal/repository"
)

type otpEntry struct {
	code      string
	expiresAt time.Time
}

type AuthService struct {
	cfg        *config.Env
	users      repository.UserRepository
	userRoles  repository.UserRoleRepository
	refreshTok repository.RefreshTokenRepository
	otpRepo    repository.OTPRepository
	redis      *redis.Client
	email      *EmailService

	mu        sync.Mutex
	failTrack map[string]failedLogin
	otpStore  map[string]otpEntry // in-memory fallback for OTP when Redis unavailable
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
	otpRepo repository.OTPRepository,
	redis *redis.Client,
	email *EmailService,
	audit *AuditService,
) *AuthService {
	return &AuthService{
		cfg:        cfg,
		users:      users,
		userRoles:  userRoles,
		refreshTok: refresh,
		otpRepo:    otpRepo,
		redis:      redis,
		email:      email,
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

// Register creates a new user and sends verification OTP
func (s *AuthService) Register(ctx context.Context, req *dto.RegisterRequest) (*model.User, error) {
	if req == nil {
		return nil, errors.New("nil request")
	}

	// 1. Validate email domain (mahasiswa only)
	email := strings.TrimSpace(strings.ToLower(req.Email))
	if !strings.HasSuffix(email, "@raharja.info") {
		return nil, errors.New("Email harus menggunakan domain @raharja.info")
	}

	// 2. Check if user exists
	existing, _ := s.users.FindByLogin(ctx, email)
	if existing != nil {
		return nil, errors.New("Email sudah terdaftar. Silakan login atau gunakan email lain.")
	}

	// 3. Hash password
	hash, err := repository.BcryptHash(req.Password)
	if err != nil {
		return nil, err
	}

	// Check if NIM already exists
	existingNIM, _ := s.users.FindByNIM(ctx, req.NIM)
	if existingNIM != nil {
		return nil, errors.New("NIM sudah terdaftar. Hubungi admin jika ini milik Anda.")
	}

	// Check if username already exists
	existingUsername, _ := s.users.FindByLogin(ctx, req.Username)
	if existingUsername != nil {
		return nil, errors.New("Username sudah digunakan. Silakan pilih username lain.")
	}

	// 4. Create User
	newUser := &model.User{
		Username:     req.Username,
		FirstName:    req.FirstName,
		SecondName:   req.SecondName,
		Email:        email,
		NIM:          req.NIM,
		Jurusan:      req.Jurusan,
		Phone:        req.Phone,
		Gender:       req.Gender,
		Alamat:       req.Alamat,
		Organisasi:   req.Organisasi,
		PasswordHash: hash,
	}
	
	if err := s.users.Create(ctx, newUser); err != nil {
		return nil, err
	}

	// 5. Assign default Role USER
	if s.userRoles != nil {
		_ = s.userRoles.Assign(ctx, &model.UserRole{
			UserID:   newUser.ID,
			RoleCode: model.RoleUser,
		})
	}

	// 6. Generate & Send OTP
	otp, err := s.generateOTP(ctx, email, "verify")
	if err != nil {
		// Log error but don't fail registration
		fmt.Printf("[OTP] Failed to generate OTP for %s: %v\n", email, err)
	}
	
	// Send verification email
	if s.email != nil && otp != "" {
		if err := s.email.SendOTP(email, otp, "register"); err != nil {
			fmt.Printf("[EMAIL] Failed to send verification email to %s: %v\n", email, err)
		}
	}
	
	if s.audit != nil {
		s.audit.Log(ctx, newUser.ID, "register_otp_sent", map[string]any{"email": email})
	}

	return newUser, nil
}

// VerifyEmail verifies the OTP and activates the account
func (s *AuthService) VerifyEmail(ctx context.Context, email, otp string) error {
	email = strings.TrimSpace(strings.ToLower(email))
	
	// Check OTP
	valid, err := s.validateOTP(ctx, email, "verify", otp)
	if err != nil {
		return err
	}
	if !valid {
		return errors.New("Kode OTP salah atau sudah kedaluwarsa.")
	}

	// Update User
	u, err := s.users.FindByLogin(ctx, email)
	if err != nil {
		return errors.New("Pengguna tidak ditemukan.")
	}

	now := time.Now()
	u.EmailVerifiedAt = &now
	if err := s.users.Update(ctx, u); err != nil {
		return err
	}

	if s.audit != nil {
		s.audit.Log(ctx, u.ID, "email_verified", nil)
	}
	return nil
}

// Login Step 1: Validate Creds & Trigger OTP
// Returns error if invalid, nil if OTP sent.
func (s *AuthService) Login(ctx context.Context, req *LoginRequest) error {
	if req == nil {
		return errors.New("nil request")
	}
	login := strings.TrimSpace(strings.ToLower(req.Login))
	
	// Check failure block
	if s.isBlocked(login) {
		return errors.New("Akun terkunci sementara karena terlalu banyak percobaan. Coba lagi nanti.")
	}

	u, err := s.users.FindByLogin(ctx, login)
	if err != nil {
		s.registerFailure(login)
		return errors.New("Email/username atau password salah.")
	}

	// Check password
	if err := s.users.CheckPassword(ctx, u, req.Password); err != nil {
		s.registerFailure(login)
		return errors.New("Email/username atau password salah.")
	}
	s.resetFailure(login)

	// Check Verification
	if u.EmailVerifiedAt == nil && login != "admin@simawa.local" {
		return errors.New("Email belum diverifikasi. Silakan cek email Anda untuk kode OTP.")
	}

	// Generate & Send OTP
	otp, err := s.generateOTP(ctx, login, "login")
	if err != nil {
		return errors.New("Gagal mengirim kode OTP. Silakan coba lagi.")
	}

	// Send OTP via Email
	if s.email != nil {
		if err := s.email.SendOTP(login, otp, "login"); err != nil {
			fmt.Printf("[EMAIL] Failed to send login OTP to %s: %v\n", login, err)
		}
	} else {
		// Dev mode: print to console
		fmt.Printf("[OTP] Login OTP for %s: %s\n", login, otp)
	}

	if s.audit != nil {
		s.audit.Log(ctx, u.ID, "login_otp_generated", map[string]any{"email": login})
	}
	
	return nil
}

// LoginVerify Step 2: Verify OTP and Issue Token
func (s *AuthService) LoginVerify(ctx context.Context, req *dto.LoginOTPRequest) (*AuthTokens, error) {
	login := strings.TrimSpace(strings.ToLower(req.Login))

	valid, err := s.validateOTP(ctx, login, "login", req.OTP)
	if err != nil {
		return nil, err
	}
	if !valid {
		return nil, errors.New("Kode OTP salah atau sudah kedaluwarsa.")
	}

	u, err := s.users.FindByLogin(ctx, login)
	if err != nil {
		return nil, errors.New("Pengguna tidak ditemukan.")
	}

	if s.audit != nil {
		s.audit.Log(ctx, u.ID, "login_success", map[string]any{"login": login})
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

// ResendOTP Resends OTP for verify or login
func (s *AuthService) ResendOTP(ctx context.Context, email, purpose string) error {
	email = strings.TrimSpace(strings.ToLower(email))
	
	// Check if user exists
	_, err := s.users.FindByLogin(ctx, email)
	if err != nil {
		return errors.New("Pengguna tidak ditemukan.")
	}
	
	otp, err := s.generateOTP(ctx, email, purpose)
	if err != nil {
		return err
	}
	
	// Send OTP via Email
	if s.email != nil {
		if err := s.email.SendOTP(email, otp, purpose); err != nil {
			fmt.Printf("[ResendOTP] Failed to send OTP to %s: %v\n", email, err)
			return err
		}
		fmt.Printf("[ResendOTP] OTP sent to %s for purpose: %s\n", email, purpose)
	} else {
		fmt.Printf("[ResendOTP] Email service nil - OTP for %s: %s\n", email, otp)
	}
	
	return nil
}

func (s *AuthService) LoginLegacy(ctx context.Context, req *LoginRequest) (*AuthTokens, error) {
	// Replaced by 2-step Login. Keeping code here if needed for rollback, 
	// or user can call LoginVerify directly if we allowed static OTP (not implemented).
	// This function is effectively the old Login() logic.
	return nil, errors.New("use 2-step login")
}

// ChangePassword allows a logged-in user to change their password
func (s *AuthService) ChangePassword(ctx context.Context, userID uuid.UUID, req *dto.ChangePasswordRequest) error {
	u, err := s.users.GetByUUID(ctx, userID)
	if err != nil {
		return errors.New("Pengguna tidak ditemukan.")
	}

	// Verify old password
	if err := s.users.CheckPassword(ctx, u, req.OldPassword); err != nil {
		return errors.New("Password lama tidak sesuai.")
	}

	// Hash new password
	hash, err := repository.BcryptHash(req.NewPassword)
	if err != nil {
		return err
	}

	u.PasswordHash = hash
	if err := s.users.Update(ctx, u); err != nil {
		return err
	}

	// Optional: Revoke all sessions?
	// _ = s.refreshTok.DeleteByUser(ctx, u.ID)

	if s.audit != nil {
		s.audit.Log(ctx, u.ID, "password_changed", nil)
	}
	return nil
}

// ForgotPassword initiates the password reset flow
func (s *AuthService) ForgotPassword(ctx context.Context, email string) error {
	email = strings.TrimSpace(strings.ToLower(email))
	u, err := s.users.FindByLogin(ctx, email)
	if err != nil {
		// Return nil to prevent email enumeration? 
		// For this project, explicit error might be fine, or just return nil.
		// Let's return nil but log it.
		return nil
	}

	otp, err := s.generateOTP(ctx, email, "reset")
	if err != nil {
		fmt.Printf("[ForgotPassword] Failed to generate OTP: %v\n", err)
		return err
	}
	fmt.Printf("[ForgotPassword] Generated OTP for %s: %s\n", email, otp)

	// Send OTP via Email
	if s.email != nil {
		fmt.Printf("[ForgotPassword] Sending OTP via email service...\n")
		if err := s.email.SendOTP(email, otp, "reset"); err != nil {
			fmt.Printf("[EMAIL] Failed to send reset password OTP to %s: %v\n", email, err)
			return err
		}
		fmt.Printf("[ForgotPassword] Email sent successfully\n")
	} else {
		fmt.Printf("[ForgotPassword] Email service is nil - printing OTP instead\n")
		fmt.Printf("[OTP] Reset Password OTP for %s: %s\n", email, otp)
	}

	if s.audit != nil {
		s.audit.Log(ctx, u.ID, "reset_password_requested", nil)
	}
	return nil
}

// ResetPassword completes the password reset flow
func (s *AuthService) ResetPassword(ctx context.Context, req *dto.ResetPasswordRequest) error {
	email := strings.TrimSpace(strings.ToLower(req.Email))
	
	valid, err := s.validateOTP(ctx, email, "reset", req.OTP)
	if err != nil {
		return err
	}
	if !valid {
		return errors.New("Kode OTP salah atau sudah kedaluwarsa.")
	}

	u, err := s.users.FindByLogin(ctx, email)
	if err != nil {
		return errors.New("Pengguna tidak ditemukan.")
	}

	hash, err := repository.BcryptHash(req.NewPassword)
	if err != nil {
		return err
	}

	u.PasswordHash = hash
	if err := s.users.Update(ctx, u); err != nil {
		return err
	}

	// Revoke all sessions on password reset
	_ = s.refreshTok.DeleteByUser(ctx, u.ID)

	if s.audit != nil {
		s.audit.Log(ctx, u.ID, "password_reset_success", nil)
	}

	return nil
}

/* ====== Internals ====== */

func (s *AuthService) generateOTP(ctx context.Context, email, purpose string) (string, error) {
	// 6 digit numeric
	digits := "0123456789"
	otpB := make([]byte, 6)
	if _, err := rand.Read(otpB); err != nil {
		return "", err
	}
	for i := 0; i < 6; i++ {
		otpB[i] = digits[int(otpB[i])%10]
	}
	otp := string(otpB)

	// Store in database (primary storage)
	if s.otpRepo != nil {
		otpModel := &model.OTP{
			Email:     email,
			Purpose:   purpose,
			Code:      otp,
			ExpiresAt: time.Now().Add(5 * time.Minute),
			CreatedAt: time.Now(),
		}
		if err := s.otpRepo.Create(ctx, otpModel); err != nil {
			fmt.Printf("[OTP] DB save error: %v\n", err)
		}
	}

	// Also store in Redis if available (for faster lookup)
	key := fmt.Sprintf("otp:%s:%s", purpose, email)
	if s.redis != nil {
		_ = s.redis.Set(ctx, key, otp, 5*time.Minute).Err()
	}

	return otp, nil
}

func (s *AuthService) validateOTP(ctx context.Context, email, purpose, otp string) (bool, error) {
	// Try Redis first if available (faster)
	key := fmt.Sprintf("otp:%s:%s", purpose, email)
	if s.redis != nil {
		val, err := s.redis.Get(ctx, key).Result()
		if err == nil && val == otp {
			s.redis.Del(ctx, key)
			// Also mark as used in DB
			if s.otpRepo != nil {
				if dbOtp, _ := s.otpRepo.GetValid(ctx, email, purpose); dbOtp != nil {
					_ = s.otpRepo.MarkUsed(ctx, dbOtp.ID)
				}
			}
			return true, nil
		}
	}

	// Fallback to database
	if s.otpRepo != nil {
		dbOtp, err := s.otpRepo.GetValid(ctx, email, purpose)
		if err != nil {
			return false, nil
		}
		if dbOtp.Code == otp {
			_ = s.otpRepo.MarkUsed(ctx, dbOtp.ID)
			// Also delete from Redis if available
			if s.redis != nil {
				s.redis.Del(ctx, key)
			}
			return true, nil
		}
	}

	return false, nil
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

func (s *AuthService) accessTTL() time.Duration {
	if s.cfg != nil && s.cfg.Auth.AccessTokenExpiry > 0 {
		return s.cfg.Auth.AccessTokenExpiry
	}
	return 15 * time.Minute
}

func (s *AuthService) refreshTTL() time.Duration {
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
