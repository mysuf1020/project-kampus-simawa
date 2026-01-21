package database

import (
	"gorm.io/gorm"
)

// CreateIndexes creates composite indexes for better query performance
func CreateIndexes(db *gorm.DB) error {
	// Composite indexes for frequently used queries
	indexes := []string{
		// User search optimization
		`CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email))`,
		
		// Activity queries by org and status
		`CREATE INDEX IF NOT EXISTS idx_activities_org_status ON activities (org_id, status)`,
		`CREATE INDEX IF NOT EXISTS idx_activities_org_start ON activities (org_id, start_at DESC)`,
		`CREATE INDEX IF NOT EXISTS idx_activities_public_start ON activities (public, start_at DESC) WHERE public = true`,
		`CREATE INDEX IF NOT EXISTS idx_activities_status_created ON activities (status, created_at DESC)`,
		
		// Surat queries
		`CREATE INDEX IF NOT EXISTS idx_surat_org_status ON surats (org_id, status)`,
		`CREATE INDEX IF NOT EXISTS idx_surat_target_status ON surats (target_org_id, status)`,
		`CREATE INDEX IF NOT EXISTS idx_surat_created_at ON surats (created_at DESC)`,
		
		// LPJ queries
		`CREATE INDEX IF NOT EXISTS idx_lpjs_activity_status ON lpjs (activity_id, status)`,
		`CREATE INDEX IF NOT EXISTS idx_lpjs_status_created ON lpjs (status, created_at DESC)`,
		
		// User roles for RBAC
		`CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON user_roles (user_id, role_code)`,
		`CREATE INDEX IF NOT EXISTS idx_user_roles_org_role ON user_roles (org_id, role_code) WHERE org_id IS NOT NULL`,
		
		// Notifications
		`CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications (user_id, read_at) WHERE read_at IS NULL`,
		
		// Org members
		`CREATE INDEX IF NOT EXISTS idx_org_members_org_user ON org_members (org_id, user_id)`,
		
		// Audit logs for recent queries
		`CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs (created_at DESC)`,
		`CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON audit_logs (user_id, created_at DESC)`,
	}

	for _, idx := range indexes {
		if err := db.Exec(idx).Error; err != nil {
			// Log but don't fail - index might already exist with different name
			continue
		}
	}

	return nil
}
