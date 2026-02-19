package database

import (
	"log"
	"strings"
	"time"

	"simawa-backend/internal/model"
	"simawa-backend/internal/repository"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

func SeedUsers(db *gorm.DB) {
	password := "Kupukupu01"
	hash, err := repository.BcryptHash(password)
	if err != nil {
		log.Printf("[Seed] Failed to hash password: %v", err)
		return
	}

	now := time.Now()

	users := []struct {
		Email    string
		Username string
		Role     string
		Name     string
	}{
		{
			Email:    "simawasuper@example.com",
			Username: "simawasuper",
			Role:     model.RoleSuperAdmin,
			Name:     "Super Admin",
		},
		{
			Email:    "simawaadmin@example.com",
			Username: "simawaadmin",
			Role:     model.RoleAdmin,
			Name:     "Admin System",
		},
		{
			Email:    "simawabem@example.com",
			Username: "simawabem",
			Role:     model.RoleBEMAdmin,
			Name:     "Admin BEM",
		},
		{
			Email:    "simawadema@example.com",
			Username: "simawadema",
			Role:     model.RoleDEMAAdmin,
			Name:     "Admin DEMA",
		},
		{
			Email:    "simawaorg@example.com",
			Username: "simawaorg",
			Role:     model.RoleOrgAdmin,
			Name:     "Admin Organisasi",
		},
		{
			Email:    "simawauser@example.com",
			Username: "simawauser",
			Role:     model.RoleUser,
			Name:     "Mahasiswa User",
		},
	}

	for _, u := range users {
		var existing model.User
		if err := db.Where("email = ?", u.Email).First(&existing).Error; err == nil {
			// User exists, maybe update role if missing?
			// Check role
			var userRole model.UserRole
			if err := db.Where("user_id = ? AND role_code = ?", existing.ID, u.Role).First(&userRole).Error; err != nil {
				if err == gorm.ErrRecordNotFound {
					// Add role
					log.Printf("[Seed] Adding role %s to %s", u.Role, u.Username)
					db.Create(&model.UserRole{
						UserID:   existing.ID,
						RoleCode: u.Role,
					})
				}
			}
			continue
		}

		// Create user
		log.Printf("[Seed] Creating user %s (%s)", u.Username, u.Role)
		newUser := model.User{
			Username:        u.Username,
			FirstName:       u.Name,
			Email:           u.Email,
			PasswordHash:    hash,
			EmailVerifiedAt: &now,
			Jurusan:         "Sistem Informasi", // Default
			NIM:             strings.ToUpper(strings.ReplaceAll(uuid.New().String(), "-", "")[:10]), // Random NIM
			Organisasi:      false,
		}

		if err := db.Create(&newUser).Error; err != nil {
			log.Printf("[Seed] Failed to create user %s: %v", u.Username, err)
			continue
		}

		// Assign role
		if err := db.Create(&model.UserRole{
			UserID:   newUser.ID,
			RoleCode: u.Role,
		}).Error; err != nil {
			log.Printf("[Seed] Failed to assign role to %s: %v", u.Username, err)
		}
	}
}
