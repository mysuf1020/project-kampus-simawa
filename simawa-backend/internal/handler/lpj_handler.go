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
	"gorm.io/gorm"
	"simawa-backend/internal/model"
	"simawa-backend/internal/service"
	"simawa-backend/pkg/response"
)

type LPJHandler struct {
	svc    *service.LPJService
	minio  *minio.Client
	bucket string
	rbac   *service.RBACService
	db     *gorm.DB
}

func NewLPJHandler(svc *service.LPJService, minio *minio.Client, bucket string) *LPJHandler {
	return &LPJHandler{svc: svc, minio: minio, bucket: bucket}
}

func NewLPJHandlerWithRBAC(svc *service.LPJService, minio *minio.Client, bucket string, rbac *service.RBACService, db *gorm.DB) *LPJHandler {
	return &LPJHandler{svc: svc, minio: minio, bucket: bucket, rbac: rbac, db: db}
}

type submitLPJRequest struct {
	ActivityID string   `json:"activity_id" binding:"omitempty,uuid"`
	OrgID      string   `json:"org_id" binding:"required,uuid"`
	Summary    string   `json:"summary"`
	BudgetPlan float64  `json:"budget_plan"`
	BudgetReal float64  `json:"budget_real"`
	ReportKey  string   `json:"report_key"`
	FileSize   int64    `json:"file_size"`
	Photos     []string `json:"photos"`
}

func (h *LPJHandler) Submit(c *gin.Context) {
	var req submitLPJRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	var activityID *uuid.UUID
	if strings.TrimSpace(req.ActivityID) != "" {
		id, err := uuid.Parse(req.ActivityID)
		if err != nil {
			c.JSON(http.StatusBadRequest, response.Err("invalid activity_id"))
			return
		}
		activityID = &id
	}
	orgID, _ := uuid.Parse(req.OrgID)
	userID, _ := uuid.Parse(c.GetString("sub"))
	lpj, err := h.svc.Submit(c.Request.Context(), &service.SubmitLPJInput{
		ActivityID: activityID,
		OrgID:      orgID,
		Summary:    req.Summary,
		BudgetPlan: req.BudgetPlan,
		BudgetReal: req.BudgetReal,
		ReportKey:  req.ReportKey,
		FileSize:   req.FileSize,
		Photos:     req.Photos,
		UserID:     userID,
	})
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, response.OK(lpj))
}

type approveLPJReq struct {
	Approve bool   `json:"approve"`
	Note    string `json:"note"`
}

func (h *LPJHandler) Approve(c *gin.Context) {
	lpjID, err := uuid.Parse(c.Param("lpj_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err("invalid id"))
		return
	}
	userID, _ := uuid.Parse(c.GetString("sub"))

	// Double-check: only BEM_ADMIN can approve LPJ
	if h.rbac != nil {
		canApprove, rbacErr := h.rbac.CanApproveLPJ(c.Request.Context(), userID)
		if rbacErr != nil || !canApprove {
			c.JSON(http.StatusForbidden, response.Err("forbidden: only BEM Admin can approve LPJ"))
			return
		}
	}

	var req approveLPJReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	lpj, err := h.svc.Approve(c.Request.Context(), userID, lpjID, req.Note, req.Approve)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, response.OK(lpj))
}

// UploadLPJReport uploads LPJ PDF.
func (h *LPJHandler) UploadLPJReport(c *gin.Context) {
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
	// MIME check
	buf := make([]byte, 512)
	n, _ := src.Read(buf)
	_, _ = src.Seek(0, 0)
	mime := http.DetectContentType(buf[:n])
	if mime != "application/pdf" && mime != "application/octet-stream" {
		c.JSON(http.StatusBadRequest, response.Err("invalid mime type"))
		return
	}
	key := fmt.Sprintf("lpj/%s.pdf", uuid.New().String())
	_, err = h.minio.PutObject(c.Request.Context(), h.bucket, key, src, file.Size, minio.PutObjectOptions{ContentType: "application/pdf"})
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, gin.H{"file_key": key, "size": file.Size})
}

func (h *LPJHandler) ListByOrg(c *gin.Context) {
	orgID, err := uuid.Parse(c.Param("org_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err("invalid org id"))
		return
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))
	status := c.Query("status")
	rows, err := h.svc.ListByOrgWithFilter(c.Request.Context(), orgID, status, page, size)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": h.enrichWithUsernames(rows)})
}

func (h *LPJHandler) ListAll(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))
	status := c.Query("status")
	rows, err := h.svc.ListAll(c.Request.Context(), status, page, size)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": h.enrichWithUsernames(rows)})
}

// enrichWithUsernames resolves submitted_by UUIDs to usernames.
func (h *LPJHandler) enrichWithUsernames(rows []model.LPJ) []gin.H {
	if h.db == nil || len(rows) == 0 {
		items := make([]gin.H, len(rows))
		for i, r := range rows {
			items[i] = gin.H{
				"id": r.ID, "activity_id": r.ActivityID, "org_id": r.OrgID,
				"summary": r.Summary, "budget_plan": r.BudgetPlan, "budget_real": r.BudgetReal,
				"report_key": r.ReportKey, "file_size": r.FileSize, "photos": r.Photos,
				"status": r.Status, "note": r.Note, "submitted_by": r.SubmittedBy,
				"revision_no": r.RevisionNo, "reviewed_by": r.ReviewedBy,
				"reviewed_at": r.ReviewedAt, "created_at": r.CreatedAt, "updated_at": r.UpdatedAt,
			}
		}
		return items
	}
	// Collect unique user IDs
	userIDs := make(map[uuid.UUID]struct{})
	for _, r := range rows {
		userIDs[r.SubmittedBy] = struct{}{}
	}
	ids := make([]uuid.UUID, 0, len(userIDs))
	for id := range userIDs {
		ids = append(ids, id)
	}
	// Batch lookup usernames
	var users []model.User
	h.db.Where("id IN ?", ids).Select("id", "username").Find(&users)
	userMap := make(map[uuid.UUID]string, len(users))
	for _, u := range users {
		userMap[u.ID] = u.Username
	}
	items := make([]gin.H, len(rows))
	for i, r := range rows {
		name := userMap[r.SubmittedBy]
		if name == "" {
			name = r.SubmittedBy.String()
		}
		items[i] = gin.H{
			"id": r.ID, "activity_id": r.ActivityID, "org_id": r.OrgID,
			"summary": r.Summary, "budget_plan": r.BudgetPlan, "budget_real": r.BudgetReal,
			"report_key": r.ReportKey, "file_size": r.FileSize, "photos": r.Photos,
			"status": r.Status, "note": r.Note, "submitted_by": r.SubmittedBy,
			"submitted_by_name": name,
			"revision_no": r.RevisionNo, "reviewed_by": r.ReviewedBy,
			"reviewed_at": r.ReviewedAt, "created_at": r.CreatedAt, "updated_at": r.UpdatedAt,
		}
	}
	return items
}

// Revision adds a note to LPJ history.
func (h *LPJHandler) Revision(c *gin.Context) {
	lpjID, err := uuid.Parse(c.Param("lpj_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err("invalid id"))
		return
	}
	userID, _ := uuid.Parse(c.GetString("sub"))

	// Double-check: only BEM_ADMIN can add revision to LPJ
	if h.rbac != nil {
		canApprove, rbacErr := h.rbac.CanApproveLPJ(c.Request.Context(), userID)
		if rbacErr != nil || !canApprove {
			c.JSON(http.StatusForbidden, response.Err("forbidden: only BEM Admin can add revision to LPJ"))
			return
		}
	}

	var req approveLPJReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	lpj, err := h.svc.AddRevision(c.Request.Context(), userID, lpjID, req.Note)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, response.OK(lpj))
}

// Detail returns LPJ detail + history + download URL.
func (h *LPJHandler) Detail(c *gin.Context) {
	lpjID, err := uuid.Parse(c.Param("lpj_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err("invalid id"))
		return
	}
	row, err := h.svc.Get(c.Request.Context(), lpjID)
	if err != nil {
		c.JSON(http.StatusNotFound, response.Err(err.Error()))
		return
	}
	history, _ := h.svc.ListHistory(c.Request.Context(), row.ActivityID)
	url, _ := h.svc.PresignReport(c.Request.Context(), h.minio, h.bucket, row.ReportKey, 15*time.Minute)
	resp := gin.H{
		"lpj":     row,
		"history": history,
	}
	if url != "" {
		resp["report_url"] = url
	}
	c.JSON(http.StatusOK, resp)
}

// Download returns signed URL for LPJ PDF.
func (h *LPJHandler) Download(c *gin.Context) {
	lpjID, err := uuid.Parse(c.Param("lpj_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err("invalid id"))
		return
	}
	row, err := h.svc.Get(c.Request.Context(), lpjID)
	if err != nil {
		c.JSON(http.StatusNotFound, response.Err(err.Error()))
		return
	}
	if row.ReportKey == "" {
		c.JSON(http.StatusBadRequest, response.Err("report file missing"))
		return
	}
	url, err := h.svc.PresignReport(c.Request.Context(), h.minio, h.bucket, row.ReportKey, 15*time.Minute)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, gin.H{"url": url, "file_key": row.ReportKey})
}
