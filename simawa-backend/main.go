package main

import (
	"flag"
	"log"

	"simawa-backend/cmd/httpsrv"
	"simawa-backend/internal/config"
	database "simawa-backend/internal/infrastructure/db"
	"simawa-backend/internal/model"
)

func main() {
	var migrateOnly bool
	flag.BoolVar(&migrateOnly, "migrate", false, "run database migrations only and exit")
	flag.Parse()

	env, err := config.GetEnv()
	if err != nil {
		log.Fatalf("load env: %v", err)
	}

	// Auto migrate selalu dijalankan saat startup
	db := database.Init(env)
	log.Println("Running auto-migration...")
	if err := db.AutoMigrate(
		&model.User{},
		&model.Role{},
		&model.UserRole{},
		&model.RefreshToken{},
		&model.Surat{},
		&model.SuratTemplate{},
		&model.Organization{},
		&model.Activity{},
		&model.LPJ{},
		&model.OrgMember{},
		&model.Notification{},
		&model.ActivityHistory{},
		&model.LPJHistory{},
		&model.AuditLog{},
		&model.OrgJoinRequest{},
	); err != nil {
		log.Fatalf("auto-migrate: %v", err)
	}
	log.Println("Auto-migration completed successfully")

	// Jika flag -migrate diberikan, exit setelah migration
	if migrateOnly {
		return
	}

	httpsrv.Start()
}
