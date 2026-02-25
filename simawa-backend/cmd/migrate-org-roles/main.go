package main

import (
	"fmt"
	"log"

	"simawa-backend/internal/config"
	database "simawa-backend/internal/infrastructure/db"
)

// This migration converts all dynamic ORG_* role codes (like ORG_KOMASI, ORG_ABSTER)
// to the standard ORG_ADMIN role code.
func main() {
	env, err := config.GetEnv()
	if err != nil {
		log.Fatalf("failed to load env: %v", err)
	}
	env.Minio.Disabled = true

	db := database.Init(env)

	// 1. Update user_roles: change all ORG_* (except ORG_ADMIN) to ORG_ADMIN
	result := db.Exec(`
		UPDATE user_roles 
		SET role_code = 'ORG_ADMIN' 
		WHERE role_code LIKE 'ORG_%' 
		  AND role_code != 'ORG_ADMIN'
	`)
	if result.Error != nil {
		log.Fatalf("failed to migrate user_roles: %v", result.Error)
	}
	fmt.Printf("Updated %d user_roles from dynamic ORG_* to ORG_ADMIN\n", result.RowsAffected)

	// 2. Remove duplicate user_roles (same user_id + role_code + org_id)
	result = db.Exec(`
		DELETE FROM user_roles a
		USING user_roles b
		WHERE a.id > b.id
		  AND a.user_id = b.user_id
		  AND a.role_code = b.role_code
		  AND (a.org_id = b.org_id OR (a.org_id IS NULL AND b.org_id IS NULL))
	`)
	if result.Error != nil {
		log.Printf("Warning: dedup failed (may not have duplicates): %v", result.Error)
	} else {
		fmt.Printf("Removed %d duplicate user_roles\n", result.RowsAffected)
	}

	// 3. Clean up orphaned roles table entries
	result = db.Exec(`
		DELETE FROM roles 
		WHERE code LIKE 'ORG_%' 
		  AND code != 'ORG_ADMIN'
	`)
	if result.Error != nil {
		log.Printf("Warning: role cleanup failed: %v", result.Error)
	} else {
		fmt.Printf("Removed %d orphaned dynamic role definitions\n", result.RowsAffected)
	}

	log.Println("Migration completed successfully.")
}
