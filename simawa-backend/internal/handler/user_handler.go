// internal/handler/user_handler.go
package handler

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"simawa-backend/internal/dto"
	"simawa-backend/internal/service"
	"simawa-backend/pkg/response"
)

type UserHandler struct {
	svc     *service.UserService
	authSvc *service.AuthService
	rbacSvc *service.RBACService
}

func NewUserHandler(s *service.UserService, auth *service.AuthService, rbac *service.RBACService) *UserHandler {
	return &UserHandler{svc: s, authSvc: auth, rbacSvc: rbac}
}

type assignRolesRequest struct {
	Roles []string `json:"roles" binding:"required,min=1"`
}

type userRoleAssignmentResponse struct {
	ID       uuid.UUID  `json:"id"`
	RoleCode string     `json:"role_code"`
	OrgID    *uuid.UUID `json:"org_id,omitempty"`
}

// ---------- Create (used by router: uh.Create) ----------
func (h *UserHandler) Create(c *gin.Context) {
	var req dto.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	in := &service.CreateUserInput{
		Username:   req.Username,
		FirstName:  req.FirstName,
		SecondName: req.SecondName,
		Organisasi: req.Organisasi,
		UKM:        req.UKM,
		HMJ:        req.HMJ,
		Jurusan:    req.Jurusan,
		NIM:        req.NIM,
		Email:      req.Email,
		Phone:      req.Phone,
		Alamat:     req.Alamat,
		BirthRaw:   req.TanggalLahir,
		Password:   req.Password,
	}
	u, err := h.svc.Create(c.Request.Context(), in)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, response.OK(u))
}

// ---------- AssignRole (used by router: uh.AssignRole) ----------
type AssignRoleRequest struct {
	UserID   string `json:"user_id" binding:"required,uuid"`
	RoleCode string `json:"role_code" binding:"required,oneof=USER ADMIN ORG_MEMBER"`
	OrgType  string `json:"org_type"` // optional: "UKM"/"HMJ"
	OrgName  string `json:"org_name"` // optional
}

func (h *UserHandler) AssignRoles(c *gin.Context) {
	idStr := c.Param("id")
	userID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid user id"})
		return
	}
	var req assignRolesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	if err := h.rbacSvc.AssignRolesByCodes(c.Request.Context(), userID, req.Roles); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"assigned": true})
}

// ---------- List role assignments (admin, debug RBAC) ----------
func (h *UserHandler) ListAssignments(c *gin.Context) {
	if h.rbacSvc == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "rbac service not available"})
		return
	}
	idStr := c.Param("id")
	userID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid user id"})
		return
	}
	rows, err := h.rbacSvc.ListAssignments(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}
	resp := make([]userRoleAssignmentResponse, 0, len(rows))
	for _, r := range rows {
		resp = append(resp, userRoleAssignmentResponse{
			ID:       r.ID,
			RoleCode: r.RoleCode,
			OrgID:    r.OrgID,
		})
	}
	c.JSON(http.StatusOK, gin.H{"items": resp})
}

// ---------- Me ----------
func (h *UserHandler) Me(c *gin.Context) {
	sub, _ := c.Get("sub")
	uidStr, _ := sub.(string)
	uid, err := uuid.Parse(uidStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid user id"})
		return
	}
	u, err := h.svc.Get(c.Request.Context(), uid)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": u})
}

// ---------- Update Me ----------
type UpdateMeRequest struct {
	FirstName    string `json:"firstname"`
	SecondName   string `json:"secondname"`
	Organisasi   *bool  `json:"organisasi"`
	UKM          string `json:"ukm"`
	HMJ          string `json:"hmj"`
	Jurusan      string `json:"jurusan"`
	Phone        string `json:"phone"`
	Alamat       string `json:"alamat"`
	TanggalLahir string `json:"tanggal_lahir"`
	Password     string `json:"password"`
	AvatarKey    string `json:"avatar_key"`
}

func (h *UserHandler) UpdateMe(c *gin.Context) {
	sub, _ := c.Get("sub")
	uidStr, _ := sub.(string)
	uid, err := uuid.Parse(uidStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid user id"})
		return
	}
	var req UpdateMeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	update := &service.UpdateUserInput{
		ID:         uid,
		FirstName:  ptrString(req.FirstName),
		SecondName: ptrString(req.SecondName),
		Organisasi: req.Organisasi,
		UKM:        ptrString(req.UKM),
		HMJ:        ptrString(req.HMJ),
		Jurusan:    ptrString(req.Jurusan),
		Phone:      ptrString(req.Phone),
		Alamat:     ptrString(req.Alamat),
		BirthRaw:   ptrString(req.TanggalLahir),
		Password:   ptrString(req.Password),
	}
	u, err := h.svc.Update(c.Request.Context(), update)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": u})
}

// ---------- Change Password ----------
func (h *UserHandler) ChangePassword(c *gin.Context) {
	sub, _ := c.Get("sub")
	uidStr, _ := sub.(string)
	uid, err := uuid.Parse(uidStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid user id"})
		return
	}

	var req dto.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	if h.authSvc == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "auth service not available"})
		return
	}

	if err := h.authSvc.ChangePassword(c.Request.Context(), uid, &req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "password updated successfully"})
}

// ---------- Get by ID (admin) ----------
func (h *UserHandler) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid id"})
		return
	}
	u, err := h.svc.Get(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": u})
}

// ---------- List (admin) ----------
func (h *UserHandler) List(c *gin.Context) {
	q := c.Query("q")
	page := parseIntDefault(c.Query("page"), 1)
	size := parseIntDefault(c.Query("size"), 10)

	var orgID *uuid.UUID
	if raw := strings.TrimSpace(c.Query("org_id")); raw != "" {
		id, err := uuid.Parse(raw)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "invalid org_id"})
			return
		}
		orgID = &id
	}
	roleCode := strings.TrimSpace(c.Query("role_code"))
	rolePrefix := strings.TrimSpace(c.Query("role_prefix"))
	if orgID != nil && roleCode == "" && rolePrefix == "" {
		rolePrefix = "ORG_"
	}

	users, total, err := h.svc.List(c.Request.Context(), service.UserFilter{
		Q:          q,
		Page:       page,
		Size:       size,
		OrgID:      orgID,
		RoleCode:   roleCode,
		RolePrefix: rolePrefix,
	})
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"items": users,
			"total": total,
		},
	})
}

type userSearchItem struct {
	ID        uuid.UUID `json:"id"`
	Username  string    `json:"username"`
	FirstName string    `json:"first_name"`
	Email     string    `json:"email"`
	NIM       string    `json:"nim,omitempty"`
}

// Search is a lightweight directory search for user selection (adding org members, etc).
func (h *UserHandler) Search(c *gin.Context) {
	requester, err := uuid.Parse(c.GetString("sub"))
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Err("invalid user context"))
		return
	}
	if h.rbacSvc == nil {
		c.JSON(http.StatusInternalServerError, response.Err("rbac service not available"))
		return
	}
	ok, err := h.rbacSvc.CanSearchUsers(c.Request.Context(), requester)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.Err(err.Error()))
		return
	}
	if !ok {
		c.JSON(http.StatusForbidden, response.Err("forbidden"))
		return
	}

	q := strings.TrimSpace(c.Query("q"))
	size := parseIntDefault(c.Query("size"), 10)
	if size <= 0 || size > 50 {
		size = 10
	}

	users, _, err := h.svc.List(c.Request.Context(), service.UserFilter{
		Q:    q,
		Page: 1,
		Size: size,
	})
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}

	items := make([]userSearchItem, 0, len(users))
	for _, u := range users {
		items = append(items, userSearchItem{
			ID:        u.ID,
			Username:  u.Username,
			FirstName: u.FirstName,
			Email:     u.Email,
			NIM:       u.NIM,
		})
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

// small helper
func parseIntDefault(s string, def int) int {
	if s == "" {
		return def
	}
	n := 0
	for i := 0; i < len(s); i++ {
		if s[i] < '0' || s[i] > '9' {
			return def
		}
		n = n*10 + int(s[i]-'0')
	}
	if n == 0 {
		return def
	}
	return n
}

func ptrString(v string) *string {
	if v == "" {
		return nil
	}
	return &v
}
