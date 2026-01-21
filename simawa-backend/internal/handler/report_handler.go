package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"simawa-backend/internal/service"
	"simawa-backend/pkg/response"
)

type ReportHandler struct {
	svc *service.ReportService
}

func NewReportHandler(svc *service.ReportService) *ReportHandler {
	return &ReportHandler{svc: svc}
}

func (h *ReportHandler) ExportActivities(c *gin.Context) {
	// Parse range (default 30 days)
	end := time.Now()
	start := end.AddDate(0, 0, -30)
	
	if s := c.Query("start"); s != "" {
		if t, err := time.Parse("2006-01-02", s); err == nil {
			start = t
		}
	}
	if e := c.Query("end"); e != "" {
		if t, err := time.Parse("2006-01-02", e); err == nil {
			end = t
		}
	}

	data, filename, err := h.svc.ExportActivities(c.Request.Context(), start, end)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.Err(err.Error()))
		return
	}

	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Data(http.StatusOK, "text/csv", data)
}

func (h *ReportHandler) ExportSurat(c *gin.Context) {
	end := time.Now()
	start := end.AddDate(0, 0, -30)
	
	data, filename, err := h.svc.ExportSurat(c.Request.Context(), start, end)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.Err(err.Error()))
		return
	}

	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Data(http.StatusOK, "text/csv", data)
}

func (h *ReportHandler) ExportLPJ(c *gin.Context) {
	end := time.Now()
	start := end.AddDate(0, 0, -30)
	
	data, filename, err := h.svc.ExportLPJ(c.Request.Context(), start, end)
	if err != nil {
		c.JSON(http.StatusInternalServerError, response.Err(err.Error()))
		return
	}

	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Data(http.StatusOK, "text/csv", data)
}
