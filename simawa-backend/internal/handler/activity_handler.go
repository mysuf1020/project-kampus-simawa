package handler

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"

	"simawa-backend/internal/model"
	"simawa-backend/internal/service"
	"simawa-backend/internal/util/storage"
	"simawa-backend/pkg/response"
)

type ActivityHandler struct {
	svc    *service.ActivityService
	minio  *minio.Client
	bucket string
}

func NewActivityHandler(svc *service.ActivityService, minio *minio.Client, bucket string) *ActivityHandler {
	return &ActivityHandler{svc: svc, minio: minio, bucket: bucket}
}

type createActivityRequest struct {
	OrgID       string         `json:"org_id" binding:"required,uuid"`
	Title       string         `json:"title" binding:"required"`
	Description string         `json:"description"`
	Location    string         `json:"location"`
	Type        string         `json:"type"`
	Public      bool           `json:"public"`
	StartAt     int64          `json:"start_at" binding:"required"` // epoch seconds
	EndAt       int64          `json:"end_at" binding:"required"`
	CoverKey    string         `json:"cover_key"`
	Metadata    map[string]any `json:"metadata"`
}

func (h *ActivityHandler) Create(c *gin.Context) {
	var req createActivityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	orgID, _ := uuid.Parse(req.OrgID)
	start := time.Unix(req.StartAt, 0)
	end := time.Unix(req.EndAt, 0)
	userID, err := uuid.Parse(c.GetString("sub"))
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Err("invalid user"))
		return
	}
	a, err := h.svc.Create(c.Request.Context(), &service.CreateActivityInput{
		OrgID:       orgID,
		Title:       req.Title,
		Description: req.Description,
		Location:    req.Location,
		Type:        req.Type,
		Public:      req.Public,
		StartAt:     start,
		EndAt:       end,
		CoverKey:    req.CoverKey,
		Metadata:    req.Metadata,
		CreatedBy:   userID,
	})
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, response.OK(a))
}

func (h *ActivityHandler) Submit(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err("invalid id"))
		return
	}
	userID, _ := uuid.Parse(c.GetString("sub"))
	a, err := h.svc.Submit(c.Request.Context(), userID, id)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, response.OK(a))
}

type approveReq struct {
	Note    string `json:"note"`
	Approve bool   `json:"approve"`
}

func (h *ActivityHandler) Approve(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err("invalid id"))
		return
	}
	var req approveReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	userID, _ := uuid.Parse(c.GetString("sub"))
	a, err := h.svc.Approve(c.Request.Context(), userID, id, req.Note, req.Approve)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, response.OK(a))
}

type coverApprovalReq struct {
	Approve bool   `json:"approve"`
	Note    string `json:"note"`
}

func (h *ActivityHandler) ApproveCover(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err("invalid id"))
		return
	}
	var req coverApprovalReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	userID, _ := uuid.Parse(c.GetString("sub"))
	a, err := h.svc.ApproveCover(c.Request.Context(), userID, id, req.Approve, req.Note)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, response.OK(a))
}

type revisionReq struct {
	Note string `json:"note"`
}

func (h *ActivityHandler) Revision(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err("invalid id"))
		return
	}
	var req revisionReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	userID, _ := uuid.Parse(c.GetString("sub"))
	a, err := h.svc.AddRevision(c.Request.Context(), userID, id, req.Note)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, response.OK(a))
}

func (h *ActivityHandler) ListByOrg(c *gin.Context) {
	orgID, err := uuid.Parse(c.Param("org_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err("invalid org id"))
		return
	}
	status := c.Query("status")
	publicOnly := c.Query("public") == "true"
	actType := c.Query("type")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))
	var start, end time.Time
	if v := c.Query("start_from"); v != "" {
		start, _ = time.Parse(time.RFC3339, v)
	}
	if v := c.Query("start_to"); v != "" {
		end, _ = time.Parse(time.RFC3339, v)
	}
	rows, err := h.svc.ListByOrg(c.Request.Context(), orgID, status, actType, publicOnly, page, size, start, end)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": rows})
}

func (h *ActivityHandler) Public(c *gin.Context) {
	days, _ := strconv.Atoi(c.DefaultQuery("days", "30"))
	if days <= 0 {
		days = 30
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "0"))
	if limit < 0 {
		limit = 0
	}
	from := time.Now().Add(-time.Duration(days) * 24 * time.Hour)
	rows, err := h.svc.ListPublic(c.Request.Context(), from)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.Err(err.Error()))
		return
	}
	if limit > 0 && len(rows) > limit {
		rows = rows[:limit]
	}
	gallery := []model.Activity{}
	for _, a := range rows {
		if a.CoverKey != "" && a.CoverApproved {
			gallery = append(gallery, a)
		}
	}
	c.JSON(http.StatusOK, gin.H{
		"calendar": rows,
		"gallery":  gallery,
	})
}

// PublicRSS returns a simple RSS feed for public activities.
func (h *ActivityHandler) PublicRSS(c *gin.Context) {
	rows, err := h.svc.ListPublic(c.Request.Context(), time.Now().Add(-30*24*time.Hour))
	if err != nil {
		c.String(http.StatusInternalServerError, "")
		return
	}
	c.Header("Content-Type", "application/rss+xml")
	c.Writer.WriteString(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>SIMAWA Activities</title>`)
	for _, a := range rows {
		c.Writer.WriteString(fmt.Sprintf("<item><title>%s</title><description>%s</description><pubDate>%s</pubDate></item>", a.Title, a.Description, a.StartAt.Format(time.RFC1123Z)))
	}
	c.Writer.WriteString("</channel></rss>")
}

// PublicICS returns a simple ICS calendar for public activities.
func (h *ActivityHandler) PublicICS(c *gin.Context) {
	rows, err := h.svc.ListPublic(c.Request.Context(), time.Now().Add(-30*24*time.Hour))
	if err != nil {
		c.String(http.StatusInternalServerError, "")
		return
	}
	c.Header("Content-Type", "text/calendar")
	c.Writer.WriteString("BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//SIMAWA//EN\n")
	for _, a := range rows {
		c.Writer.WriteString("BEGIN:VEVENT\n")
		c.Writer.WriteString(fmt.Sprintf("UID:%s@simawa\n", a.ID))
		c.Writer.WriteString(fmt.Sprintf("DTSTAMP:%s\n", a.CreatedAt.UTC().Format("20060102T150405Z")))
		c.Writer.WriteString(fmt.Sprintf("DTSTART:%s\n", a.StartAt.UTC().Format("20060102T150405Z")))
		c.Writer.WriteString(fmt.Sprintf("DTEND:%s\n", a.EndAt.UTC().Format("20060102T150405Z")))
		c.Writer.WriteString(fmt.Sprintf("SUMMARY:%s\n", a.Title))
		c.Writer.WriteString(fmt.Sprintf("DESCRIPTION:%s\n", strings.ReplaceAll(a.Description, "\n", "\\n")))
		c.Writer.WriteString("END:VEVENT\n")
	}
	c.Writer.WriteString("END:VCALENDAR\n")
}

// ListPendingCover menampilkan daftar kegiatan yang memiliki cover tetapi belum di-approve.
func (h *ActivityHandler) ListPendingCover(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))
	rows, err := h.svc.ListPendingCover(c.Request.Context(), page, size)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": rows})
}

// UploadProposal uploads proposal PDF to Minio and returns key.
func (h *ActivityHandler) UploadProposal(c *gin.Context) {
	if h.minio == nil || h.bucket == "" {
		c.JSON(http.StatusBadRequest, response.Err("storage not configured"))
		return
	}
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err("file required"))
		return
	}
	if !strings.HasSuffix(strings.ToLower(file.Filename), ".pdf") {
		c.JSON(http.StatusBadRequest, response.Err("only pdf allowed"))
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
	if mime != "application/pdf" && mime != "application/octet-stream" {
		c.JSON(http.StatusBadRequest, response.Err("invalid mime type"))
		return
	}
	key := fmt.Sprintf("proposals/%s.pdf", uuid.New().String())
	if _, err := storage.UploadToMinio(c.Request.Context(), h.minio, h.bucket, key, src, file.Size, "application/pdf"); err != nil {
		c.JSON(http.StatusInternalServerError, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, gin.H{"file_key": key})
}
