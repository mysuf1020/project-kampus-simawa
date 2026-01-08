package httpsrv

import (
	"log"

	"github.com/gin-gonic/gin"

	"simawa-backend/internal/config"
	"simawa-backend/internal/server"
)

func Start() {
	env, err := config.GetEnv()
	if err != nil {
		log.Fatalf("load env: %v", err)
	}

	if env.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	srv, err := server.NewServer(env)
	if err != nil {
		log.Fatalf("init server: %v", err)
	}

	if err := srv.Start(); err != nil {
		log.Fatalf("server start: %v", err)
	}
}
