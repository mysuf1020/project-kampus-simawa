package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"simawa-backend/internal/service"
	"simawa-backend/pkg/response"
)

type AssetHandler struct {
	svc  *service.AssetService
	rbac *service.RBACService
}

func NewAssetHandler(svc *service.AssetService, rbac *service.RBACService) *AssetHandler {
	return &AssetHandler{svc: svc, rbac: rbac}
}

func (h *AssetHandler) currentUser(c *gin.Context) (uuid.UUID, error) {
	raw, _ := c.Get("userID")
	s, _ := raw.(string)
	return uuid.Parse(s)
}

// --- Asset CRUD ---

type createAssetRequest struct {
	OrgID       string `json:"org_id" binding:"required"`
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Quantity    int    `json:"quantity"`
}

func (h *AssetHandler) Create(c *gin.Context) {
	userID, err := h.currentUser(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Err("unauthorized"))
		return
	}
	var req createAssetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	orgID, err := uuid.Parse(req.OrgID)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err("invalid org_id"))
		return
	}
	a, err := h.svc.CreateAsset(c.Request.Context(), userID, orgID, req.Name, req.Description, req.Quantity)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusCreated, response.OK(a))
}

type updateAssetRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Quantity    int    `json:"quantity"`
}

func (h *AssetHandler) Update(c *gin.Context) {
	userID, err := h.currentUser(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Err("unauthorized"))
		return
	}
	id, _ := strconv.Atoi(c.Param("id"))
	var req updateAssetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	a, err := h.svc.UpdateAsset(c.Request.Context(), userID, uint(id), req.Name, req.Description, req.Quantity)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, response.OK(a))
}

func (h *AssetHandler) Delete(c *gin.Context) {
	userID, err := h.currentUser(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Err("unauthorized"))
		return
	}
	id, _ := strconv.Atoi(c.Param("id"))
	if err := h.svc.DeleteAsset(c.Request.Context(), userID, uint(id)); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, response.OK("deleted"))
}

func (h *AssetHandler) Get(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	a, err := h.svc.GetAsset(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, response.Err("not found"))
		return
	}
	c.JSON(http.StatusOK, response.OK(a))
}

func (h *AssetHandler) List(c *gin.Context) {
	orgID, err := uuid.Parse(c.Query("org_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err("org_id required"))
		return
	}
	list, err := h.svc.ListAssets(c.Request.Context(), orgID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, response.OK(list))
}

// --- Borrowing ---

type borrowAssetRequest struct {
	AssetID    uint   `json:"asset_id" binding:"required"`
	OrgID      string `json:"org_id" binding:"required"`
	SuratID    *uint  `json:"surat_id"`
	Quantity   int    `json:"quantity"`
	BorrowDate string `json:"borrow_date" binding:"required"`
	ReturnDate string `json:"return_date" binding:"required"`
	Note       string `json:"note"`
}

func (h *AssetHandler) Borrow(c *gin.Context) {
	userID, err := h.currentUser(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Err("unauthorized"))
		return
	}
	var req borrowAssetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	orgID, err := uuid.Parse(req.OrgID)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err("invalid org_id"))
		return
	}
	borrowDate, err := time.Parse("2006-01-02", req.BorrowDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err("invalid borrow_date format, use YYYY-MM-DD"))
		return
	}
	returnDate, err := time.Parse("2006-01-02", req.ReturnDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err("invalid return_date format, use YYYY-MM-DD"))
		return
	}
	b, err := h.svc.BorrowAsset(c.Request.Context(), service.BorrowInput{
		AssetID:    req.AssetID,
		OrgID:      orgID,
		BorrowerID: userID,
		SuratID:    req.SuratID,
		Quantity:   req.Quantity,
		BorrowDate: borrowDate,
		ReturnDate: returnDate,
		Note:       req.Note,
	})
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusCreated, response.OK(b))
}

func (h *AssetHandler) Return(c *gin.Context) {
	userID, err := h.currentUser(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, response.Err("unauthorized"))
		return
	}
	id, _ := strconv.Atoi(c.Param("id"))
	b, err := h.svc.ReturnAsset(c.Request.Context(), userID, uint(id))
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, response.OK(b))
}

func (h *AssetHandler) ListBorrowings(c *gin.Context) {
	orgID, err := uuid.Parse(c.Query("org_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, response.Err("org_id required"))
		return
	}
	list, err := h.svc.ListBorrowings(c.Request.Context(), orgID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.Err(err.Error()))
		return
	}
	c.JSON(http.StatusOK, response.OK(list))
}
