package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"

	"simawa-backend/internal/model"
	"simawa-backend/internal/repository"
	"simawa-backend/internal/service"
	"simawa-backend/internal/util/suratpdf"
	"simawa-backend/pkg/response"
)

type SuratHandler struct {
	svc    service.SuratService
	minio  *minio.Client
	bucket string
	rbac   *service.RBACService
}

func NewSuratHandler(svc service.SuratService, minio *minio.Client, bucket string, rbac *service.RBACService) *SuratHandler {
	return &SuratHandler{svc: svc, minio: minio, bucket: bucket, rbac: rbac}
}

type createSuratRequest struct {
	OrgID       string           `json:"org_id" binding:"required,uuid"`
	TargetOrgID string           `json:"target_org_id"`
	Status      string           `json:"status"`
	Payload     suratpdf.Payload `json:"payload" binding:"required"`
	Theme       *suratpdf.Theme  `json:"theme"`
}

type approveSuratRequest struct {
	Approve bool   `json:"approve"`
	Note    string `json:"note"`
}

type renderFromTemplateRequest struct {
	TemplateID  uint           `json:"template_id" binding:"required"`
	Overrides   map[string]any `json:"overrides"`
	OrgID       string         `json:"org_id" binding:"required,uuid"`
	TargetOrgID string         `json:"target_org_id"`
	Status      string         `json:"status"`
}

// Create generates surat, uploads PDF to Minio, dan simpan metadata sebagai pending/draft.
func (h *SuratHandler) Create(c *gin.Context) {
	var req createSuratRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	userID, err := h.currentUser(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Err(err.Error()))
		return
	}
	orgID, _ := uuid.Parse(req.OrgID)
	var targetOrg *uuid.UUID
	if strings.TrimSpace(req.TargetOrgID) != "" {
		tid, err := uuid.Parse(req.TargetOrgID)
		if err != nil {
			c.JSON(http.StatusBadRequest, response.Err("invalid target_org_id"))
			return
		}
		targetOrg = &tid
	}

	row, err := h.svc.Create(c.Request.Context(), &service.CreateSuratInput{
		OrgID:       orgID,
		TargetOrgID: targetOrg,
		Payload:     req.Payload,
		Theme:       req.Theme,
		CreatedBy:   userID,
		Status:      req.Status,
	}, h.minio, h.bucket)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	url, _ := h.svc.PresignOrURL(c.Request.Context(), h.minio, h.bucket, row.FileKey, 15*time.Minute)
	if url != "" {
		row.FileURL = url
	}
	c.JSON(http.StatusOK, response.OK(row))
}

// Submit memindahkan surat draft ke pending.
func (h *SuratHandler) Submit(c *gin.Context) {
	idNum, _ := strconv.Atoi(c.Param("id"))
	userID, err := h.currentUser(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Err(err.Error()))
		return
	}
	row, err := h.svc.Submit(c.Request.Context(), userID, uint(idNum))
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, response.OK(row))
}

// Approve/Rejct surat (semua role non-public yang punya akses target boleh memutuskan).
func (h *SuratHandler) Approve(c *gin.Context) {
	idNum, _ := strconv.Atoi(c.Param("id"))
	userID, err := h.currentUser(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Err(err.Error()))
		return
	}
	var req approveSuratRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}

	// authorization per target
	row, err := h.svc.Get(c.Request.Context(), uint(idNum))
	if err != nil {
		c.JSON(http.StatusNotFound, response.Err(err.Error()))
		return
	}
	if ok := h.canAccessSurat(c, userID, row); !ok {
		c.JSON(http.StatusForbidden, response.Err("forbidden"))
		return
	}

	res, err := h.svc.Decide(c.Request.Context(), userID, uint(idNum), req.Approve, req.Note)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, response.OK(res))
}

func (h *SuratHandler) Get(c *gin.Context) {
	idNum, _ := strconv.Atoi(c.Param("id"))
	userID, err := h.currentUser(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Err(err.Error()))
		return
	}
	row, err := h.svc.Get(c.Request.Context(), uint(idNum))
	if err != nil {
		c.JSON(http.StatusNotFound, response.Err(err.Error()))
		return
	}
	if ok := h.canAccessSurat(c, userID, row); !ok {
		c.JSON(http.StatusForbidden, response.Err("forbidden"))
		return
	}
	c.JSON(http.StatusOK, response.OK(row))
}

func (h *SuratHandler) Download(c *gin.Context) {
	idNum, _ := strconv.Atoi(c.Param("id"))
	userID, err := h.currentUser(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Err(err.Error()))
		return
	}
	row, err := h.svc.Get(c.Request.Context(), uint(idNum))
	if err != nil {
		c.JSON(http.StatusNotFound, response.Err(err.Error()))
		return
	}
	if ok := h.canAccessSurat(c, userID, row); !ok {
		c.JSON(http.StatusForbidden, response.Err("forbidden"))
		return
	}
	url, err := h.svc.PresignOrURL(c.Request.Context(), h.minio, h.bucket, row.FileKey, 15*time.Minute)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, gin.H{"url": url, "file_key": row.FileKey})
}

func (h *SuratHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))
	status := c.Query("status")
	q := repository.ListSuratQuery{
		Q:       c.Query("q"),
		Variant: c.Query("variant"),
		Status:  status,
		Page:    page,
		Size:    size,
	}
	rows, total, err := h.svc.List(c.Request.Context(), q)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"items": rows,
			"total": total,
		},
	})
}

func (h *SuratHandler) ListOutbox(c *gin.Context) {
	orgID, err := uuid.Parse(c.Param("org_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err("invalid org id"))
		return
	}
	userID, err := h.currentUser(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Err(err.Error()))
		return
	}
	if h.rbac != nil {
		ok, _ := h.rbac.CanManageOrg(c.Request.Context(), userID, &model.Organization{ID: orgID})
		if !ok {
			c.JSON(http.StatusForbidden, response.Err("forbidden"))
			return
		}
	}

	status := c.Query("status")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))
	rows, total, err := h.svc.ListByOrg(c.Request.Context(), orgID, status, page, size)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.Err(err.Error()))
		return
	}
	type item struct {
		model.Surat
		URL string `json:"url"`
	}
	items := make([]item, 0, len(rows))
	for _, s := range rows {
		url, _ := h.svc.PresignOrURL(c.Request.Context(), h.minio, h.bucket, s.FileKey, 15*time.Minute)
		items = append(items, item{Surat: s, URL: url})
	}
	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"items": items,
			"total": total,
		},
	})
}

func (h *SuratHandler) ListInbox(c *gin.Context) {
	userID, assignments, err := h.userAssignments(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Err(err.Error()))
		return
	}
	status := c.Query("status")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))

	orgIDs := make([]uuid.UUID, 0)
	roleCodes := make([]string, 0, len(assignments))
	for _, a := range assignments {
		roleCodes = append(roleCodes, a.RoleCode)
		if a.OrgID != nil {
			orgIDs = append(orgIDs, *a.OrgID)
		}
	}

	rows, total, err := h.svc.ListInbox(c.Request.Context(), service.InboxFilter{
		OrgIDs: orgIDs,
		Roles:  roleCodes,
		Status: status,
		Page:   page,
		Size:   size,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.Err(err.Error()))
		return
	}
	type item struct {
		model.Surat
		URL string `json:"url"`
	}
	items := make([]item, 0, len(rows))
	for _, s := range rows {
		url, _ := h.svc.PresignOrURL(c.Request.Context(), h.minio, h.bucket, s.FileKey, 15*time.Minute)
		items = append(items, item{Surat: s, URL: url})
	}

	_ = userID // silence unused if future use
	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"items": items,
			"total": total,
		},
	})
}

// Generate hanya untuk preview PDF tanpa menyimpan metadata.
func (h *SuratHandler) Generate(c *gin.Context) {
	var req createSuratRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	pdfBytes, err := h.svc.Generate(c.Request.Context(), req.Payload, req.Theme)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.Err(err.Error()))
		return
	}
	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Disposition", "attachment; filename=surat-preview.pdf")
	c.Data(http.StatusOK, "application/pdf", pdfBytes)
}

func (h *SuratHandler) CreateTemplate(c *gin.Context) {
	var req model.SuratTemplate
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	if err := h.svc.CreateTemplate(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusInternalServerError, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, response.OK(&req))
}

func (h *SuratHandler) UpdateTemplate(c *gin.Context) {
	idNum, _ := strconv.Atoi(c.Param("id"))
	var req model.SuratTemplate
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	req.ID = uint(idNum)
	if err := h.svc.UpdateTemplate(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusInternalServerError, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, response.OK(&req))
}

func (h *SuratHandler) DeleteTemplate(c *gin.Context) {
	idNum, _ := strconv.Atoi(c.Param("id"))
	if err := h.svc.DeleteTemplate(c.Request.Context(), uint(idNum)); err != nil {
		c.JSON(http.StatusInternalServerError, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, gin.H{"deleted": true})
}

func (h *SuratHandler) GetTemplate(c *gin.Context) {
	idNum, _ := strconv.Atoi(c.Param("id"))
	row, err := h.svc.GetTemplate(c.Request.Context(), uint(idNum))
	if err != nil {
		c.JSON(http.StatusNotFound, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, response.OK(row))
}

func (h *SuratHandler) ListTemplates(c *gin.Context) {
	rows, err := h.svc.ListTemplates(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": rows})
}

func (h *SuratHandler) RenderFromTemplate(c *gin.Context) {
	var req renderFromTemplateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	userID, err := h.currentUser(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Err(err.Error()))
		return
	}
	orgID, _ := uuid.Parse(req.OrgID)
	var targetOrg *uuid.UUID
	if strings.TrimSpace(req.TargetOrgID) != "" {
		tid, err := uuid.Parse(req.TargetOrgID)
		if err != nil {
			c.JSON(http.StatusBadRequest, response.Err("invalid target_org_id"))
			return
		}
		targetOrg = &tid
	}

	tpl, err := h.svc.GetTemplate(c.Request.Context(), req.TemplateID)
	if err != nil {
		c.JSON(http.StatusNotFound, response.Err(err.Error()))
		return
	}
	row, err := h.svc.RenderFromTemplate(c.Request.Context(), tpl, req.Overrides, h.minio, h.bucket, userID, orgID, targetOrg, req.Status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.Err(err.Error()))
		return
	}

	// hydrate URL if possible
	url, _ := h.svc.PresignOrURL(c.Request.Context(), h.minio, h.bucket, row.FileKey, 15*time.Minute)
	if url != "" {
		row.FileURL = url
	}
	meta := map[string]any{}
	_ = json.Unmarshal(row.MetaJSON, &meta)

	c.JSON(http.StatusOK, gin.H{
		"data": row,
		"meta": meta,
	})
}

func (h *SuratHandler) currentUser(c *gin.Context) (uuid.UUID, error) {
	raw := c.GetString("sub")
	if raw == "" {
		return uuid.Nil, fmt.Errorf("missing user")
	}
	return uuid.Parse(raw)
}

func (h *SuratHandler) userAssignments(c *gin.Context) (uuid.UUID, []model.UserRole, error) {
	userID, err := h.currentUser(c)
	if err != nil {
		return uuid.Nil, nil, err
	}
	if h.rbac == nil {
		return userID, nil, nil
	}
	rows, err := h.rbac.ListAssignments(c.Request.Context(), userID)
	return userID, rows, err
}

func (h *SuratHandler) canAccessSurat(c *gin.Context, userID uuid.UUID, s *model.Surat) bool {
	if s == nil {
		return false
	}
	if h.rbac == nil {
		return true
	}
	assignments, _ := h.rbac.ListAssignments(c.Request.Context(), userID)
	orgSet := map[uuid.UUID]struct{}{}
	roleSet := map[string]struct{}{}
	for _, a := range assignments {
		if a.OrgID != nil {
			orgSet[*a.OrgID] = struct{}{}
		}
		roleSet[strings.ToUpper(a.RoleCode)] = struct{}{}
		if a.RoleCode == model.RoleAdmin || a.RoleCode == model.RoleBEMAdmin || a.RoleCode == model.RoleDEMAAdmin {
			return true
		}
	}
	if _, ok := orgSet[s.OrgID]; ok {
		return true
	}
	if s.TargetOrgID != nil {
		if _, ok := orgSet[*s.TargetOrgID]; ok {
			return true
		}
	}
	if _, ok := roleSet[strings.ToUpper(s.ToRole)]; ok && s.ToRole != "" {
		return true
	}
	return false
}
