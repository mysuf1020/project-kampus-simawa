package handler

import (
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/minio/minio-go/v7"
	"gorm.io/gorm"
	"simawa-backend/internal/service"
	"simawa-backend/internal/util/sanitize"
	"simawa-backend/pkg/response"
)

type OrganizationHandler struct {
	svc                *service.OrganizationService
	memberSvc          *service.OrgMemberService
	minio              *minio.Client
	bucket             string
	minioPublicBaseURL string
}

func NewOrganizationHandler(
	svc *service.OrganizationService,
	memberSvc *service.OrgMemberService,
	minio *minio.Client,
	bucket string,
	minioPublicBaseURL string,
) *OrganizationHandler {
	return &OrganizationHandler{
		svc:                svc,
		memberSvc:          memberSvc,
		minio:              minio,
		bucket:             bucket,
		minioPublicBaseURL: minioPublicBaseURL,
	}
}

type updateOrgRequest struct {
	Name         *string        `json:"name"`
	Slug         *string        `json:"slug"`
	Type         *string        `json:"type"`
	Description  *string        `json:"description"`
	LogoKey      *string        `json:"logo_key"`
	LogoURL      *string        `json:"logo_url"`
	HeroImage    *string        `json:"hero_image"`
	Contact      *string        `json:"contact"`
	ContactEmail *string        `json:"contact_email"`
	ContactPhone *string        `json:"contact_phone"`
	WebsiteURL   *string        `json:"website_url"`
	InstagramURL *string        `json:"instagram_url"`
	TwitterURL   *string        `json:"twitter_url"`
	LinkedinURL  *string        `json:"linkedin_url"`
	GalleryURLs  []string       `json:"gallery_urls"`
	Links        map[string]any `json:"links"`
}

func mapOrgUpdateError(err error) (int, string) {
	if err == nil {
		return http.StatusOK, "success"
	}

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return http.StatusNotFound, "organisasi tidak ditemukan"
	}

	if err.Error() == "forbidden" {
		return http.StatusForbidden, "Anda tidak punya akses untuk mengubah organisasi ini."
	}

	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		switch pgErr.Code {
		case "23505": // unique_violation
			constraint := strings.ToLower(pgErr.ConstraintName)
			switch {
			case strings.Contains(constraint, "slug"):
				return http.StatusConflict, "Alamat halaman sudah digunakan. Silakan pilih alamat lain."
			case strings.Contains(constraint, "name"):
				return http.StatusConflict, "Nama organisasi sudah digunakan. Silakan gunakan nama lain."
			default:
				return http.StatusConflict, "Data sudah digunakan. Silakan gunakan nilai lain."
			}
		case "22001": // string_data_right_truncation
			return http.StatusBadRequest, "Teks terlalu panjang. Silakan ringkas."
		}
	}

	return http.StatusInternalServerError, err.Error()
}

// List organizations (optional filter by type).
func (h *OrganizationHandler) List(c *gin.Context) {
	orgType := c.Query("type")
	orgs, err := h.svc.List(c.Request.Context(), orgType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": orgs})
}

// List organizations for authenticated dashboard, including can_manage per user.
func (h *OrganizationHandler) ListAuth(c *gin.Context) {
	orgType := c.Query("type")
	orgs, err := h.svc.List(c.Request.Context(), orgType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.Err(err.Error()))
		return
	}

	requester, err := uuid.Parse(c.GetString("sub"))
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Err("invalid user context"))
		return
	}

	items := make([]gin.H, 0, len(orgs))
	for _, org := range orgs {
		orgCopy := org
		ok, _ := h.svc.CanManageOrg(c.Request.Context(), requester, &orgCopy)
		// Keep returning the org object fields, plus can_manage.
		items = append(items, gin.H{
			"id":            org.ID,
			"name":          org.Name,
			"slug":          org.Slug,
			"type":          org.Type,
			"description":   org.Description,
			"logo_key":      org.LogoKey,
			"logo_url":      org.LogoURL,
			"hero_image":    org.HeroImage,
			"website_url":   org.WebsiteURL,
			"instagram_url": org.InstagramURL,
			"twitter_url":   org.TwitterURL,
			"linkedin_url":  org.LinkedinURL,
			"contact":       org.Contact,
			"contact_email": org.ContactEmail,
			"contact_phone": org.ContactPhone,
			"gallery_urls":  org.GalleryURLs,
			"links":         org.Links,
			"created_at":    org.CreatedAt,
			"updated_at":    org.UpdatedAt,
			"can_manage":    ok,
		})
	}

	c.JSON(http.StatusOK, gin.H{"items": items})
}

// Get organization by ID.
func (h *OrganizationHandler) Get(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err("invalid id"))
		return
	}
	org, err := h.svc.Get(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, response.OK(org))
}

// Update organization profile (admin/org admin only; check in router/middleware).
func (h *OrganizationHandler) Update(c *gin.Context) {
	sub, _ := c.Get("sub")
	userID, err := uuid.Parse(fmt.Sprint(sub))
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Err("invalid user context"))
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err("invalid id"))
		return
	}
	org, err := h.svc.Get(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, response.Err(err.Error()))
		return
	}

	var req updateOrgRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}

	if req.Slug != nil && len(strings.TrimSpace(*req.Slug)) > 64 {
		c.JSON(http.StatusBadRequest, response.Err("Alamat halaman maksimal 64 karakter."))
		return
	}
	if req.Name != nil && len(strings.TrimSpace(*req.Name)) > 128 {
		c.JSON(http.StatusBadRequest, response.Err("Nama organisasi maksimal 128 karakter."))
		return
	}

	// Sanitize input
	if req.Name != nil {
		s := sanitize.String(*req.Name)
		req.Name = &s
	}
	if req.Description != nil {
		s := sanitize.String(*req.Description)
		req.Description = &s
	}
	if req.Contact != nil {
		s := sanitize.String(*req.Contact)
		req.Contact = &s
	}
	// URLs and Emails are usually validated by structure, but cleaning them doesn't hurt
	if req.WebsiteURL != nil {
		s := sanitize.String(*req.WebsiteURL)
		req.WebsiteURL = &s
	}

	updated, err := h.svc.Update(c.Request.Context(), userID, org, service.UpdateOrgInput{
		Name:         req.Name,
		Slug:         req.Slug,
		Type:         req.Type,
		Description:  req.Description,
		LogoKey:      req.LogoKey,
		LogoURL:      req.LogoURL,
		HeroImage:    req.HeroImage,
		Contact:      req.Contact,
		ContactEmail: req.ContactEmail,
		ContactPhone: req.ContactPhone,
		WebsiteURL:   req.WebsiteURL,
		InstagramURL: req.InstagramURL,
		TwitterURL:   req.TwitterURL,
		LinkedinURL:  req.LinkedinURL,
		GalleryURLs:  req.GalleryURLs,
		Links:        req.Links,
	})
	if err != nil {
		status, message := mapOrgUpdateError(err)
		c.JSON(status, response.Err(message))
		return
	}
	c.JSON(http.StatusOK, response.OK(updated))
}

// Get public profile by slug.
func (h *OrganizationHandler) PublicProfile(c *gin.Context) {
	slug := c.Param("slug")
	org, err := h.svc.GetBySlug(c.Request.Context(), slug)
	if err != nil {
		c.JSON(http.StatusNotFound, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, response.OK(org))
}

// PublicMembers returns organization members (name & role only) by slug.
func (h *OrganizationHandler) PublicMembers(c *gin.Context) {
	slug := c.Param("slug")
	org, err := h.svc.GetBySlug(c.Request.Context(), slug)
	if err != nil {
		c.JSON(http.StatusNotFound, response.Err("Organisasi tidak ditemukan."))
		return
	}
	members, err := h.memberSvc.List(c.Request.Context(), org.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.Err("Gagal memuat anggota."))
		return
	}
	// Return only name and role (no sensitive data)
	type publicMember struct {
		Name string `json:"name"`
		Role string `json:"role"`
	}
	var result []publicMember
	for _, m := range members {
		name := ""
		if m.User != nil {
			name = m.User.FirstName
			if m.User.SecondName != "" {
				name += " " + m.User.SecondName
			}
		}
		result = append(result, publicMember{Name: name, Role: m.Role})
	}
	c.JSON(http.StatusOK, response.OK(result))
}

type createOrgRequest struct {
	Name        string `json:"name" binding:"required"`
	Slug        string `json:"slug" binding:"required"`
	Type        string `json:"type" binding:"required"`
	Description string `json:"description"`
}

// Create a new organization (admin only).
func (h *OrganizationHandler) Create(c *gin.Context) {
	sub, _ := c.Get("sub")
	userID, err := uuid.Parse(fmt.Sprint(sub))
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Err("invalid user context"))
		return
	}

	var req createOrgRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}

	if len(strings.TrimSpace(req.Name)) < 2 {
		c.JSON(http.StatusBadRequest, response.Err("Nama organisasi minimal 2 karakter"))
		return
	}
	if len(strings.TrimSpace(req.Slug)) < 2 {
		c.JSON(http.StatusBadRequest, response.Err("Slug minimal 2 karakter"))
		return
	}

	org, err := h.svc.Create(c.Request.Context(), userID, service.CreateOrgInput{
		Name:        req.Name,
		Slug:        req.Slug,
		Type:        req.Type,
		Description: req.Description,
	})
	if err != nil {
		status, message := mapOrgUpdateError(err)
		c.JSON(status, response.Err(message))
		return
	}
	c.JSON(http.StatusCreated, response.OK(org))
}

// Delete an organization (admin only).
func (h *OrganizationHandler) Delete(c *gin.Context) {
	sub, _ := c.Get("sub")
	userID, err := uuid.Parse(fmt.Sprint(sub))
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Err("invalid user context"))
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err("invalid id"))
		return
	}

	if err := h.svc.Delete(c.Request.Context(), userID, id); err != nil {
		c.JSON(http.StatusInternalServerError, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, response.OK(nil))
}
