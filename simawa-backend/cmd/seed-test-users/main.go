package main

import (
	"fmt"
	"log"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"simawa-backend/internal/config"
	database "simawa-backend/internal/infrastructure/db"
	"simawa-backend/internal/model"
	"simawa-backend/pkg/hash"
)

func main() {
	// 1. Load config & DB
	env, err := config.GetEnv()
	if err != nil {
		log.Fatalf("failed to load env: %v", err)
	}
	// Disable Minio for seeding script as well to avoid connection errors if needed
	env.Minio.Disabled = true

	db := database.Init(env)

	// 2. Define users to seed
	password := "Kupukupu01"
	hashedPassword, err := hash.HashPassword(password)
	if err != nil {
		log.Fatalf("failed to hash password: %v", err)
	}

	// Helper to ensure organization exists
	ensureOrg := func(name, slug, typeOrg string) *model.Organization {
		var org model.Organization
		if err := db.Where("slug = ?", slug).First(&org).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				org = model.Organization{
					Name:        name,
					Slug:        slug,
					Type:        model.OrganizationType(typeOrg),
					Description: fmt.Sprintf("Organisasi %s for testing", name),
				}
				if err := db.Create(&org).Error; err != nil {
					log.Fatalf("failed to create org %s: %v", name, err)
				}
				log.Printf("Created org: %s", name)
			} else {
				log.Fatalf("failed to query org %s: %v", name, err)
			}
		}
		return &org
	}

	// Create necessary orgs
	bemOrg := ensureOrg("BEM Universitas", "bem-universitas", "BEM")
	demaOrg := ensureOrg("DEMA Universitas", "dema-universitas", "DEMA")
	testOrg := ensureOrg("Organisasi Test", "org-test", "UKM")

	users := []struct {
		Username  string
		Email     string
		FirstName string
		Roles     []string // UserRole codes
		OrgRole   string   // Role in Organization (MEMBER/ADMIN)
		TargetOrg *model.Organization
	}{
		{
			Username:  "simawasuper",
			Email:     "simawasuper@example.com",
			FirstName: "Super Admin",
			Roles:     []string{model.RoleSuperAdmin, model.RoleUser},
		},
		{
			Username:  "simawaadmin",
			Email:     "simawaadmin@example.com",
			FirstName: "Admin Sistem",
			Roles:     []string{model.RoleAdmin, model.RoleUser},
		},
		{
			Username:  "simawabem",
			Email:     "simawabem@example.com",
			FirstName: "Admin BEM",
			Roles:     []string{model.RoleBEMAdmin, model.RoleUser},
			TargetOrg: bemOrg,
			OrgRole:   "ADMIN",
		},
		{
			Username:  "simawadema",
			Email:     "simawadema@example.com",
			FirstName: "Admin DEMA",
			Roles:     []string{model.RoleDEMAAdmin, model.RoleUser},
			TargetOrg: demaOrg,
			OrgRole:   "ADMIN",
		},
		{
			Username:  "simawaorg",
			Email:     "simawaorg@example.com",
			FirstName: "Admin Organisasi",
			Roles:     []string{model.RoleOrgAdmin, model.RoleUser},
			TargetOrg: testOrg,
			OrgRole:   "ADMIN",
		},
		{
			Username:  "simawauser",
			Email:     "simawauser@example.com",
			FirstName: "User Biasa",
			Roles:     []string{model.RoleUser},
			TargetOrg: testOrg,
			OrgRole:   "MEMBER",
		},
	}

	// 3. Seed Users
	for _, u := range users {
		var user model.User
		// Check if user exists
		if err := db.Where("email = ?", u.Email).First(&user).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				// Create User
				user = model.User{
					Username:     u.Username,
					Email:        u.Email,
					FirstName:    u.FirstName,
					PasswordHash: hashedPassword,
					NIM:          fmt.Sprintf("NIM-%s", u.Username), // Dummy NIM
					Jurusan:      "Teknik Informatika",
					Phone:        "081234567890",
				}
				if err := db.Create(&user).Error; err != nil {
					log.Printf("Failed to create user %s: %v", u.Username, err)
					continue
				}
				log.Printf("Created user: %s", u.Username)
			} else {
				log.Printf("Failed to query user %s: %v", u.Username, err)
				continue
			}
		} else {
			// Update password if exists
			user.PasswordHash = hashedPassword
			db.Save(&user)
			log.Printf("Updated password for user: %s", u.Username)
		}

		// 4. Assign Roles
		for _, roleCode := range u.Roles {
			var role model.Role
			// Find role ID by code
			if err := db.Where("code = ?", roleCode).First(&role).Error; err != nil {
				role = model.Role{Code: roleCode, Name: roleCode}
				if err := db.FirstOrCreate(&role, model.Role{Code: roleCode}).Error; err != nil {
					log.Printf("Failed to ensure role %s: %v", roleCode, err)
					continue
				}
			}

			// Assign role to user
			var userRole model.UserRole
			if err := db.Where("user_id = ? AND role_code = ?", user.ID, roleCode).First(&userRole).Error; err == gorm.ErrRecordNotFound {
				// Special handling for Org Admins?
				// Just generic role assignment first
				var orgID *uuid.UUID

				if err := db.Create(&model.UserRole{
					UserID:   user.ID,
					RoleCode: roleCode,
					OrgID:    orgID,
				}).Error; err != nil {
					log.Printf("Failed to assign role %s to %s: %v", roleCode, u.Username, err)
				} else {
					log.Printf("Assigned role %s to %s", roleCode, u.Username)
				}
			}
		}

		// 5. Add to Organization if needed
		if u.TargetOrg != nil {
			var member model.OrgMember
			if err := db.Where("org_id = ? AND user_id = ?", u.TargetOrg.ID, user.ID).First(&member).Error; err == gorm.ErrRecordNotFound {
				member = model.OrgMember{
					OrgID:  u.TargetOrg.ID,
					UserID: user.ID,
					Role:   u.OrgRole,
				}
				if err := db.Create(&member).Error; err != nil {
					log.Printf("Failed to add %s to org %s: %v", u.Username, u.TargetOrg.Name, err)
				} else {
					log.Printf("Added %s to org %s as %s", u.Username, u.TargetOrg.Name, u.OrgRole)
				}
			}
		}
	}

	log.Println("Seeding completed successfully.")
}
