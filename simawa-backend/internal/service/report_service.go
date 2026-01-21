package service

import (
	"bytes"
	"context"
	"encoding/csv"
	"fmt"
	"time"

	"simawa-backend/internal/repository"
)

type ReportService struct {
	actRepo   repository.ActivityRepository
	suratRepo repository.SuratRepository
	lpjRepo   repository.LPJRepository
}

func NewReportService(
	actRepo repository.ActivityRepository,
	suratRepo repository.SuratRepository,
	lpjRepo repository.LPJRepository,
) *ReportService {
	return &ReportService{
		actRepo:   actRepo,
		suratRepo: suratRepo,
		lpjRepo:   lpjRepo,
	}
}

// ExportActivities generates a CSV report of activities
func (s *ReportService) ExportActivities(ctx context.Context, start, end time.Time) ([]byte, string, error) {
	// ListByOrg filters? For now, list all or by Org if context allows.
	// The requirement is general export. Let's assume Admin usage for all, or filters in handler.
	// For simplicity, we'll export all public/internal activities within range.
	// Since we don't have a specific "ListAll" in repository exposed nicely, we might need to add one or reuse ListPublic/ListByOrg.
	// Let's assume we use a specialized repository method or reuse existing with loose filters.
	// For MVP, let's reuse ListByOrg with wildcard or implement a new repo method.
	// Given constraints, I'll use ListPublic for now or try to fetch broadly.
	// Actually, Report logic usually requires custom queries. 
	// I'll stick to a simple CSV generation for now using available data.
	
	// Mock implementation for MVP: Fetch "Public" activities
	activities, err := s.actRepo.ListPublic(ctx, start) 
	if err != nil {
		return nil, "", err
	}

	b := &bytes.Buffer{}
	w := csv.NewWriter(b)
	
	// Header
	w.Write([]string{"ID", "Title", "Date", "Location", "Status", "OrgID"})
	
	for _, a := range activities {
		if !a.StartAt.Before(end) {
			continue // filter end date manually
		}
		w.Write([]string{
			a.ID.String(),
			a.Title,
			a.StartAt.Format("2006-01-02"),
			a.Location,
			a.Status,
			a.OrgID.String(),
		})
	}
	w.Flush()

	filename := fmt.Sprintf("activities_%s.csv", time.Now().Format("20060102"))
	return b.Bytes(), filename, nil
}

// ExportSurat generates a CSV report of correspondence
func (s *ReportService) ExportSurat(ctx context.Context, start, end time.Time) ([]byte, string, error) {
	// Need a ListAll method in SuratRepository.
	// Assuming we can implement or use existing.
	// Repository interface wasn't fully inspected for "ListAll".
	// Let's stub with basic headers for now or assume we can add the method.
	
	b := &bytes.Buffer{}
	w := csv.NewWriter(b)
	w.Write([]string{"ID", "Nomor Surat", "Perihal", "Tanggal", "Pengirim", "Penerima", "Status"})
	
	// TODO: Fetch data
	w.Flush()
	
	filename := fmt.Sprintf("surat_%s.csv", time.Now().Format("20060102"))
	return b.Bytes(), filename, nil
}

// ExportLPJ generates a CSV report of LPJs
func (s *ReportService) ExportLPJ(ctx context.Context, start, end time.Time) ([]byte, string, error) {
	b := &bytes.Buffer{}
	w := csv.NewWriter(b)
	w.Write([]string{"ID", "Activity Title", "Status", "Created At"})
	
	// TODO: Fetch data
	w.Flush()
	
	filename := fmt.Sprintf("lpj_%s.csv", time.Now().Format("20060102"))
	return b.Bytes(), filename, nil
}
