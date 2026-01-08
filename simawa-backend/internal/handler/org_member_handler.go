package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"simawa-backend/internal/service"
	"simawa-backend/pkg/response"
)

type OrgMemberHandler struct {
	svc    *service.OrgMemberService
	orgSvc *service.OrganizationService
	rbac   *service.RBACService
}

func NewOrgMemberHandler(svc *service.OrgMemberService, orgSvc *service.OrganizationService, rbac *service.RBACService) *OrgMemberHandler {
	return &OrgMemberHandler{svc: svc, orgSvc: orgSvc, rbac: rbac}
}

type addMemberRequest struct {
	UserID string `json:"user_id" binding:"required,uuid"`
	Role   string `json:"role" binding:"required"`
}

func (h *OrgMemberHandler) Add(c *gin.Context) {
	orgID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err("invalid org id"))
		return
	}
	var req addMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	userID, _ := uuid.Parse(req.UserID)
	requester, _ := uuid.Parse(c.GetString("sub"))
	if err := h.svc.Add(c.Request.Context(), requester, orgID, userID, req.Role); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, gin.H{"added": true})
}

type updateMemberRequest struct {
	Role string `json:"role" binding:"required"`
}

func (h *OrgMemberHandler) Update(c *gin.Context) {
	orgID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err("invalid org id"))
		return
	}
	userID, err := uuid.Parse(c.Param("user_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err("invalid user id"))
		return
	}
	var req updateMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	requester, _ := uuid.Parse(c.GetString("sub"))
	if err := h.svc.UpdateRole(c.Request.Context(), requester, orgID, userID, req.Role); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, gin.H{"updated": true})
}

func (h *OrgMemberHandler) Delete(c *gin.Context) {
	orgID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err("invalid org id"))
		return
	}
	userID, err := uuid.Parse(c.Param("user_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err("invalid user id"))
		return
	}
	requester, _ := uuid.Parse(c.GetString("sub"))
	if err := h.svc.Delete(c.Request.Context(), requester, orgID, userID); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, gin.H{"deleted": true})
}

func (h *OrgMemberHandler) List(c *gin.Context) {
	orgID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err("invalid org id"))
		return
	}
	if h.orgSvc != nil && h.rbac != nil {
		requester, err := uuid.Parse(c.GetString("sub"))
		if err != nil {
			c.JSON(http.StatusUnauthorized, response.Err("invalid user context"))
			return
		}
		org, err := h.orgSvc.Get(c.Request.Context(), orgID)
		if err != nil || org == nil {
			c.JSON(http.StatusNotFound, response.Err("organisasi tidak ditemukan"))
			return
		}
		ok, err := h.rbac.CanManageOrg(c.Request.Context(), requester, org)
		if err != nil || !ok {
			c.JSON(http.StatusForbidden, response.Err("Anda tidak punya akses untuk melihat anggota organisasi ini."))
			return
		}
	}
	rows, err := h.svc.List(c.Request.Context(), orgID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": rows})
}
