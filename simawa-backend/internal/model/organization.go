package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

type OrganizationType string

const (
	OrgTypeBEM   OrganizationType = "BEM"
	OrgTypeDEMA  OrganizationType = "DEMA"
	OrgTypeUKM   OrganizationType = "UKM"
	OrgTypeHMJ   OrganizationType = "HMJ"
	OrgTypeOther OrganizationType = "OTHER"
)

type Organization struct {
	ID           uuid.UUID         `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Name         string            `gorm:"size:128;uniqueIndex" json:"name"`
	Slug         string            `gorm:"size:64;uniqueIndex" json:"slug"`
	Type         OrganizationType  `gorm:"size:16;index" json:"type"`
	Description  string            `gorm:"size:512" json:"description"`
	LogoKey      string            `gorm:"size:255" json:"logo_key"`
	LogoURL      string            `gorm:"size:255" json:"logo_url"`
	HeroImage    string            `gorm:"size:255" json:"hero_image"`
	Contact      string            `gorm:"size:255" json:"contact"`
	ContactEmail string            `gorm:"size:255" json:"contact_email"`
	ContactPhone string            `gorm:"size:64" json:"contact_phone"`
	WebsiteURL   string            `gorm:"size:255" json:"website_url"`
	InstagramURL string            `gorm:"size:255" json:"instagram_url"`
	TwitterURL   string            `gorm:"size:255" json:"twitter_url"`
	LinkedinURL  string            `gorm:"size:255" json:"linkedin_url"`
	Links        datatypes.JSONMap `json:"links"` // e.g. {"website":"...", "instagram":"..."}
	GalleryURLs  datatypes.JSON    `gorm:"type:jsonb" json:"gallery_urls"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
