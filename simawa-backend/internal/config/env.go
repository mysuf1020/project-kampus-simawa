package config

import (
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/kelseyhightower/envconfig"
)

type Env struct {
	Environment string    `envconfig:"APP_ENV" default:"development"`
	Server      ServerEnv `envconfig:"-"`
	Database    DatabaseEnv
	Minio       MinioEnv
	Auth        AuthEnv
	Redis       RedisEnv
	Captcha     CaptchaEnv
	SMTP        SMTPEnv
	App         AppEnv
}

type ServerEnv struct {
	Host string `envconfig:"APP_HOST" default:"0.0.0.0"`
	Port int    `envconfig:"APP_PORT" default:"8080"`
	Name string `envconfig:"APP_NAME" default:"simawa"`
}

type DatabaseEnv struct {
	Host     string        `envconfig:"DB_HOST" default:"127.0.0.1"`
	Port     int           `envconfig:"DB_PORT" default:"5432"`
	User     string        `envconfig:"DB_USER" default:"postgres"`
	Password string        `envconfig:"DB_PASS" default:"123"`
	Name     string        `envconfig:"DB_NAME" default:"postgres"`
	SSLMode  string        `envconfig:"DB_SSLMODE" default:"disable"`
	MaxIdle  int           `envconfig:"DB_MAX_IDLE" default:"5"`
	MaxOpen  int           `envconfig:"DB_MAX_OPEN" default:"20"`
	LifeTime time.Duration `envconfig:"DB_CONN_LIFETIME" default:"300s"`
}

type MinioEnv struct {
	Endpoint  string `envconfig:"MINIO_ENDPOINT" default:"127.0.0.1:9000"`
	AccessKey string `envconfig:"MINIO_ACCESS_KEY" default:"minioadmin"`
	SecretKey string `envconfig:"MINIO_SECRET_KEY" default:"minioadmin"`
	UseSSL    bool   `envconfig:"MINIO_USE_SSL" default:"false"`
	Bucket    string `envconfig:"MINIO_BUCKET" default:"simawa"`
	Disabled  bool   `envconfig:"MINIO_DISABLED" default:"false"`
}

type AuthEnv struct {
	JWTSecret         string        `envconfig:"JWT_SECRET" default:"supersecret"`
	AccessTokenExpiry time.Duration `envconfig:"ACCESS_TOKEN_EXP" default:"1h"`
}

type RedisEnv struct {
	Address  string `envconfig:"REDIS_ADDRESS" default:"127.0.0.1:6379"`
	Password string `envconfig:"REDIS_PASSWORD" default:""`
	DB       int    `envconfig:"REDIS_DB" default:"0"`
}

type CaptchaEnv struct {
	Secret string `envconfig:"CAPTCHA_SECRET" default:""`
}

type SMTPEnv struct {
	Host     string `envconfig:"SMTP_HOST" default:"smtp.gmail.com"`
	Port     int    `envconfig:"SMTP_PORT" default:"587"`
	User     string `envconfig:"SMTP_USER" default:""`
	Password string `envconfig:"SMTP_PASSWORD" default:""`
	From     string `envconfig:"SMTP_FROM" default:"noreply@raharja.info"`
	FromName string `envconfig:"SMTP_FROM_NAME" default:"SIMAWA Raharja"`
}

type AppEnv struct {
	EmailDomain string `envconfig:"EMAIL_DOMAIN" default:"@raharja.info"`
}

// GetEnv mirrors the backoffice-backend style: load .env files by gin mode,
// then populate structured configuration.
func GetEnv() (*Env, error) {
	// Always try to load .env first
	_ = godotenv.Load(".env")
	
	// Then override with mode-specific env if exists
	if gin.Mode() != gin.ReleaseMode {
		switch gin.Mode() {
		case gin.DebugMode:
			_ = godotenv.Load(".env.debug")
		case gin.TestMode:
			_ = godotenv.Load(".env.test")
		}
	}

	env := &Env{}
	if err := envconfig.Process("", env); err != nil {
		return nil, fmt.Errorf("load base env: %w", err)
	}
	if err := envconfig.Process("", &env.Server); err != nil {
		return nil, fmt.Errorf("load server env: %w", err)
	}
	if err := envconfig.Process("", &env.Database); err != nil {
		return nil, fmt.Errorf("load database env: %w", err)
	}
	if err := envconfig.Process("", &env.Minio); err != nil {
		return nil, fmt.Errorf("load minio env: %w", err)
	}
	if err := envconfig.Process("", &env.Auth); err != nil {
		return nil, fmt.Errorf("load auth env: %w", err)
	}
	if err := envconfig.Process("", &env.Redis); err != nil {
		return nil, fmt.Errorf("load redis env: %w", err)
	}
	if err := envconfig.Process("", &env.SMTP); err != nil {
		return nil, fmt.Errorf("load smtp env: %w", err)
	}
	if err := envconfig.Process("", &env.App); err != nil {
		return nil, fmt.Errorf("load app env: %w", err)
	}
	return env, nil
}
