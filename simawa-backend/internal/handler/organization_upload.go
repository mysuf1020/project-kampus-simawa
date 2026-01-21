package handler

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"simawa-backend/internal/service"
	"simawa-backend/internal/util/storage"
	"simawa-backend/pkg/response"
)

// UploadImage uploads an organization image (hero/logo) to Minio and updates the org profile.
// Query param: kind=hero|logo (default: hero). Multipart field: file.
func (h *OrganizationHandler) UploadImage(c *gin.Context) {
	if h.minio == nil || h.bucket == "" || h.minioPublicBaseURL == "" {
		c.JSON(http.StatusBadRequest, response.Err("storage not configured"))
		return
	}

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

	kind := strings.ToLower(strings.TrimSpace(c.DefaultQuery("kind", "hero")))
	if kind != "hero" && kind != "logo" && kind != "gallery" {
		c.JSON(http.StatusBadRequest, response.Err("invalid kind"))
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err("file required"))
		return
	}

	const maxSize = 5 * 1024 * 1024
	if file.Size <= 0 || file.Size > maxSize {
		c.JSON(http.StatusBadRequest, response.Err("file too large (max 5MB)"))
		return
	}

	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.Err(err.Error()))
		return
	}
	defer src.Close()

	buf := make([]byte, 512)
	n, _ := src.Read(buf)
	_, _ = src.Seek(0, 0)
	mime := http.DetectContentType(buf[:n])
	if !strings.HasPrefix(mime, "image/") {
		c.JSON(http.StatusBadRequest, response.Err("only image allowed"))
		return
	}

	ext := ""
	switch mime {
	case "image/jpeg":
		ext = ".jpg"
	case "image/png":
		ext = ".png"
	case "image/webp":
		ext = ".webp"
	case "image/gif":
		ext = ".gif"
	default:
		c.JSON(http.StatusBadRequest, response.Err("unsupported image type"))
		return
	}

	key := fmt.Sprintf("orgs/%s/%s/%s%s", org.ID.String(), kind, uuid.New().String(), ext)
	if _, err := storage.UploadToMinio(
		c.Request.Context(),
		h.minio,
		h.bucket,
		key,
		src,
		file.Size,
		mime,
	); err != nil {
		c.JSON(http.StatusInternalServerError, response.Err(err.Error()))
		return
	}

	base := strings.TrimRight(h.minioPublicBaseURL, "/")
	url := fmt.Sprintf("%s/%s/%s", base, h.bucket, key)

	switch kind {
	case "hero":
		urlCopy := url
		if _, err := h.svc.Update(
			c.Request.Context(),
			userID,
			org,
			service.UpdateOrgInput{HeroImage: &urlCopy},
		); err != nil {
			c.JSON(http.StatusInternalServerError, response.Err(err.Error()))
			return
		}
	case "logo":
		urlCopy := url
		keyCopy := key
		if _, err := h.svc.Update(
			c.Request.Context(),
			userID,
			org,
			service.UpdateOrgInput{LogoKey: &keyCopy, LogoURL: &urlCopy},
		); err != nil {
			c.JSON(http.StatusInternalServerError, response.Err(err.Error()))
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"file_key": key, "url": url})
}

// DeleteHero removes the hero image from an organization.
func (h *OrganizationHandler) DeleteHero(c *gin.Context) {
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

	empty := ""
	if _, err := h.svc.Update(c.Request.Context(), userID, org, service.UpdateOrgInput{
		HeroImage: &empty,
	}); err != nil {
		status, msg := mapOrgUpdateError(err)
		c.JSON(status, response.Err(msg))
		return
	}

	// Optional: Delete from storage if we track the key? 
	// Org model stores full URL or Key? It stores "HeroImage" which seems to be the key or URL.
	// Looking at UploadImage: "HeroImage: &urlCopy". So it stores the URL.
	// To delete from MinIO we need the key. We might parse it from URL or just leave it (orphan).
	// For now, just clearing the DB reference is sufficient for the feature.

	c.JSON(http.StatusOK, response.OK(gin.H{"message": "Hero image removed"}))
}

