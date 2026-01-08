package handler

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"simawa-backend/internal/service"
	"simawa-backend/pkg/response"
)

type OrgJoinRequestHandler struct {
	svc *service.OrgJoinRequestService
}

func NewOrgJoinRequestHandler(svc *service.OrgJoinRequestService) *OrgJoinRequestHandler {
	return &OrgJoinRequestHandler{svc: svc}
}

type submitJoinRequestBody struct {
	Message string `json:"message"`
}

func (h *OrgJoinRequestHandler) Submit(c *gin.Context) {
	orgID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err("invalid org id"))
		return
	}
	userID, err := uuid.Parse(c.GetString("sub"))
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Err("invalid user context"))
		return
	}
	var body submitJoinRequestBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}

	req, err := h.svc.Submit(c.Request.Context(), userID, orgID, body.Message)
	if err != nil {
		if errors.Is(err, service.ErrAlreadyMember) {
			c.JSON(http.StatusConflict, response.Err("Anda sudah terdaftar sebagai anggota organisasi ini."))
			return
		}
		if errors.Is(err, service.ErrJoinAlreadyPending) {
			c.JSON(http.StatusConflict, response.Err("Permintaan bergabung kamu sudah terkirim dan sedang menunggu ditinjau."))
			return
		}
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, response.Err("organisasi tidak ditemukan"))
			return
		}
		if strings.Contains(err.Error(), "message too long") {
			c.JSON(http.StatusBadRequest, response.Err("Pesan terlalu panjang. Maksimal 512 karakter."))
			return
		}
		c.JSON(http.StatusInternalServerError, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, response.OK(req))
}

type submitJoinRequestPublicBody struct {
	Name    string `json:"name" binding:"required"`
	Email   string `json:"email" binding:"required"`
	NIM     string `json:"nim" binding:"required"`
	Phone   string `json:"phone"`
	Jurusan string `json:"jurusan"`
	Message string `json:"message"`
}

func (h *OrgJoinRequestHandler) SubmitPublic(c *gin.Context) {
	orgID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err("invalid org id"))
		return
	}
	var body submitJoinRequestPublicBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}

	req, err := h.svc.SubmitPublic(c.Request.Context(), orgID, service.PublicJoinRequestInput{
		Name:    body.Name,
		Email:   body.Email,
		NIM:     body.NIM,
		Phone:   body.Phone,
		Jurusan: body.Jurusan,
		Message: body.Message,
	})
	if err != nil {
		if errors.Is(err, service.ErrJoinAlreadyPending) {
			c.JSON(http.StatusConflict, response.Err("Permintaan bergabung kamu sudah terkirim dan sedang menunggu ditinjau."))
			return
		}
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, response.Err("organisasi tidak ditemukan"))
			return
		}
		if strings.Contains(err.Error(), "message too long") {
			c.JSON(http.StatusBadRequest, response.Err("Pesan terlalu panjang. Maksimal 512 karakter."))
			return
		}
		if strings.Contains(err.Error(), "required") {
			c.JSON(http.StatusBadRequest, response.Err("Nama, email, dan NIM wajib diisi."))
			return
		}
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, response.OK(req))
}

func (h *OrgJoinRequestHandler) List(c *gin.Context) {
	orgID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err("invalid org id"))
		return
	}
	requester, err := uuid.Parse(c.GetString("sub"))
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Err("invalid user context"))
		return
	}
	status := strings.TrimSpace(strings.ToUpper(c.Query("status")))
	rows, err := h.svc.ListByOrg(c.Request.Context(), requester, orgID, status)
	if err != nil {
		if err.Error() == "forbidden" {
			c.JSON(http.StatusForbidden, response.Err("forbidden"))
			return
		}
		c.JSON(http.StatusInternalServerError, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": rows})
}

type decideJoinRequestBody struct {
	Approve      bool   `json:"approve"`
	Role         string `json:"role"`
	DecisionNote string `json:"decision_note"`
}

func (h *OrgJoinRequestHandler) Decide(c *gin.Context) {
	orgID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err("invalid org id"))
		return
	}
	requestID, err := uuid.Parse(c.Param("request_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err("invalid request id"))
		return
	}
	requester, err := uuid.Parse(c.GetString("sub"))
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Err("invalid user context"))
		return
	}
	var body decideJoinRequestBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}

	role := strings.TrimSpace(body.Role)
	if role == "" {
		role = "MEMBER"
	}

	updated, err := h.svc.Decide(c.Request.Context(), requester, orgID, requestID, service.DecideJoinRequestInput{
		Approve:      body.Approve,
		Role:         role,
		DecisionNote: body.DecisionNote,
	})
	if err != nil {
		if err.Error() == "forbidden" {
			c.JSON(http.StatusForbidden, response.Err("forbidden"))
			return
		}
		if errors.Is(err, service.ErrJoinAlreadyDecided) {
			c.JSON(http.StatusConflict, response.Err("Permintaan ini sudah diproses."))
			return
		}
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, response.Err("permintaan tidak ditemukan"))
			return
		}
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, response.OK(updated))
}
