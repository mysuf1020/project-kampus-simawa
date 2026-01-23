package suratpdf

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"os"
	"strings"

	"github.com/jung-kurt/gofpdf"
)

// Render menghasilkan PDF surat dengan layout mendekati template contoh (F4).
// Header: logo kiri/kanan + judul tengah + garis horizontal + tanggal kanan.
// Nomor/Lampiran/Perihal/Hal di kiri.
// Penerima dibold.
// Tanda tangan grid 3 kolom per baris dengan cap dan opsional TTD.
// Tembusan ditampilkan di bawah.
func Render(p Payload, th *Theme) ([]byte, error) {
	// Default theme jika tidak diisi
	t := Theme{
		FontFamily:   "Times",
		FontSize:     12,
		MarginTop:    15,
		MarginRight:  20,
		MarginBottom: 20,
		MarginLeft:   20,
	}
	if th != nil {
		if th.FontFamily != "" {
			t.FontFamily = th.FontFamily
		}
		if th.FontSize > 0 {
			t.FontSize = th.FontSize
		}
		if th.MarginTop > 0 {
			t.MarginTop = th.MarginTop
		}
		if th.MarginRight > 0 {
			t.MarginRight = th.MarginRight
		}
		if th.MarginBottom > 0 {
			t.MarginBottom = th.MarginBottom
		}
		if th.MarginLeft > 0 {
			t.MarginLeft = th.MarginLeft
		}
	}

	// F4/Legal size: 210 x 330 mm
	pdf := gofpdf.NewCustom(&gofpdf.InitType{
		UnitStr: "mm",
		Size:    gofpdf.SizeType{Wd: 210, Ht: 330},
	})
	pdf.SetMargins(t.MarginLeft, t.MarginTop, t.MarginRight)
	pdf.SetAutoPageBreak(true, t.MarginBottom)
	pdf.AddPage()
	pdf.SetFont(t.FontFamily, "", t.FontSize)

	lm, _, _, _ := pdf.GetMargins()
	baseX := lm

	renderHeader(pdf, p)
	renderNumberTable(pdf, p, baseX)
	contentX := baseX
	renderRecipient(pdf, p, contentX)

	// Body
	bodyX := contentX
	bodyParas := collectBodyParas(p)
	for _, para := range bodyParas {
		pdf.SetX(bodyX)
		multiCell(pdf, para)
		pdf.Ln(1.5)
	}

	// Footer
	if strings.TrimSpace(p.Footer) != "" {
		pdf.Ln(3)
		pdf.CellFormat(0, 6, p.Footer, "", 1, "", false, 0, "")
	}

	// Tanda tangan
	if len(p.Signs) > 0 {
		renderSignsGrid(pdf, p.Signs)
	}

	// Tembusan
	if len(p.Tembusan) > 0 {
		pdf.Ln(4)
		pdf.SetX(baseX)
		pdf.CellFormat(0, 6, "Tembusan :", "", 1, "", false, 0, "")
		for i, tbs := range p.Tembusan {
			pdf.SetX(baseX)
			pdf.CellFormat(0, 6, fmt.Sprintf("%d. %s", i+1, tbs), "", 1, "", false, 0, "")
		}
	}

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func multiCell(pdf *gofpdf.Fpdf, text string) {
	text = strings.TrimSpace(text)
	if text == "" {
		return
	}

	// Normalisasi spasi agar rapi
	text = strings.Join(strings.Fields(text), " ")

	origX := pdf.GetX()
	indent := 12.0 // ≈ 7 spasi
	pageW, _ := pdf.GetPageSize()
	_, _, rm, _ := pdf.GetMargins()

	// Lebar baris pertama sesudah indent
	widthFirst := pageW - rm - (origX + indent)
	if widthFirst < 0 {
		widthFirst = 0
	}

	// Lebar baris selanjutnya (tanpa indent)
	widthNext := pageW - rm - origX

	// Pisahkan baris hasil wrapping manual
	lines := pdf.SplitLines([]byte(text), widthFirst)

	// Kalau hanya 1 baris → cukup indent 1x
	if len(lines) == 1 {
		pdf.SetX(origX + indent)
		pdf.MultiCell(widthFirst, 6, string(lines[0]), "", "J", false)
		pdf.SetX(origX)
		return
	}

	// =========================
	// Baris pertama (dengan indent)
	// =========================
	firstLine := string(lines[0])
	pdf.SetX(origX + indent)
	pdf.MultiCell(widthFirst, 6, firstLine, "", "J", false)

	// =========================
	// Baris berikutnya NORMAL (tanpa indent)
	// =========================
	rest := strings.TrimSpace(strings.TrimPrefix(text, firstLine))
	pdf.SetX(origX)
	pdf.MultiCell(widthNext, 6, rest, "", "J", false)

	// Kembalikan X
	pdf.SetX(origX)
}

// collectBodyParas menyusun paragraf dari opening, content list, dan closing.
// Jika ketiganya kosong, akan fallback ke Body lama.
func collectBodyParas(p Payload) []string {
	var out []string
	hasNew := strings.TrimSpace(p.BodyOpening) != "" || len(p.BodyContent) > 0 || strings.TrimSpace(p.BodyClosing) != ""
	if hasNew {
		if strings.TrimSpace(p.BodyOpening) != "" {
			out = append(out, p.BodyOpening)
		}
		for _, c := range p.BodyContent {
			if strings.TrimSpace(c) != "" {
				out = append(out, c)
			}
		}
		if strings.TrimSpace(p.BodyClosing) != "" {
			out = append(out, p.BodyClosing)
		}
	}
	if len(out) == 0 && len(p.Body) > 0 {
		out = append(out, p.Body...)
	}
	return out
}

func renderHeader(pdf *gofpdf.Fpdf, p Payload) {
	lm, _, rm, _ := pdf.GetMargins()
	pageW, _ := pdf.GetPageSize()

	// Logo + title
	if p.Header != nil {
		// Susun baris title dari field terstruktur bila Title kosong.
		lines := p.Header.Title
		if len(lines) == 0 {
			if strings.TrimSpace(p.Header.OrgName) != "" {
				lines = append(lines, p.Header.OrgName)
			}
			if strings.TrimSpace(p.Header.OrgUnit) != "" {
				lines = append(lines, p.Header.OrgUnit)
			}
			if strings.TrimSpace(p.Header.OrgAddress) != "" {
				lines = append(lines, p.Header.OrgAddress)
			}
			if strings.TrimSpace(p.Header.OrgPhone) != "" {
				lines = append(lines, p.Header.OrgPhone)
			}
		}

		y := pdf.GetY()
		leftX := lm
		rightX := pageW - rm - 30

		// left logo (skip jika kosong)
		if strings.TrimSpace(p.Header.LeftLogo) != "" {
			_ = drawBase64OrFile(pdf, p.Header.LeftLogo, leftX, y, 25, 25)
		}
		// right logo
		if strings.TrimSpace(p.Header.RightLogo) != "" {
			_ = drawBase64OrFile(pdf, p.Header.RightLogo, rightX, y, 25, 25)
		}

		// center title
		if len(lines) > 0 {
			pdf.SetXY(leftX, y)
			for _, line := range lines {
				pdf.CellFormat(pageW-lm-rm, 6, line, "", 1, "C", false, 0, "")
			}
			pdf.Ln(4)
		}
	}
	// garis horizontal
	y := pdf.GetY()
	pdf.Line(lm, y, pageW-rm, y)
	pdf.Ln(3)
	// Tanggal di kanan
	if strings.TrimSpace(p.Meta.PlaceAndDate) != "" {
		origRight := rm
		shift := 0.10 // geser tanggal 10 mm ke kiri
		if origRight > shift {
			pdf.SetRightMargin(origRight - shift)
		}
		pdf.CellFormat(0, 6, p.Meta.PlaceAndDate, "", 1, "R", false, 0, "")
		pdf.SetRightMargin(origRight)
	}
	pdf.Ln(2)
}

func renderNumberTable(pdf *gofpdf.Fpdf, p Payload, baseX float64) {
	labelW := 18.0 // kolom label lebih rapat
	colonW := 3.0  // titik dua lebih dekat

	rows := []struct {
		Label string
		Value string
	}{
		{"Nomor", p.Meta.Number},
		{"Lampiran", p.Meta.Lampiran},
		{"Perihal", p.Meta.Subject},
	}

	for _, r := range rows {
		if strings.TrimSpace(r.Value) == "" {
			continue
		}

		pdf.SetX(baseX)
		pdf.CellFormat(labelW, 6, r.Label, "", 0, "", false, 0, "")
		pdf.CellFormat(colonW, 6, ":", "", 0, "", false, 0, "")

		if r.Label == "Perihal" {
			pdf.SetFontStyle("B")
			pdf.CellFormat(0, 6, r.Value, "", 1, "", false, 0, "")
			pdf.SetFontStyle("")
		} else {
			pdf.CellFormat(0, 6, r.Value, "", 1, "", false, 0, "")
		}
	}

	pdf.Ln(1)
}

func renderRecipient(pdf *gofpdf.Fpdf, p Payload, contentX float64) {
	to := strings.TrimSpace(strings.Join([]string{p.Meta.ToRole, p.Meta.ToName}, " "))
	if to != "" {
		pdf.SetX(contentX)
		pdf.CellFormat(0, 6, "Kepada Yth.", "", 1, "", false, 0, "")
		pdf.SetX(contentX)
		pdf.SetFontStyle("B")
		pdf.CellFormat(0, 6, to, "", 1, "", false, 0, "")
		pdf.SetFontStyle("")
	}
	loc := strings.TrimSpace(strings.Join([]string{p.Meta.ToPlace, p.Meta.ToCity}, ", "))
	if loc != "" {
		pdf.SetX(contentX)
		pdf.CellFormat(0, 6, "di", "", 1, "", false, 0, "")
		// Sedikit geser ke kanan agar alamat lebih menjorok dari label "Di"
		pdf.SetX(contentX + 4)
		pdf.CellFormat(0, 6, loc, "", 1, "", false, 0, "")
	}
	pdf.Ln(1)
}

// renderSignsGrid: 3 kolom per baris.
func renderSignsGrid(pdf *gofpdf.Fpdf, signs []Signer) {
	if len(signs) == 0 {
		return
	}
	pdf.Ln(2)
	n := len(signs)
	// Layout: if 3 -> 2 top, 1 bottom centered. if 4 -> 2 top, 2 bottom. else max 3 per row.
	var rows [][]Signer
	if n == 3 {
		rows = [][]Signer{signs[:2], signs[2:]}
	} else if n == 4 {
		rows = [][]Signer{signs[:2], signs[2:4]}
	} else {
		for i := 0; i < n; i += 3 {
			rows = append(rows, signs[i:min(i+3, n)])
		}
	}

	pageW, _ := pdf.GetPageSize()
	_, lm, rm, _ := pdf.GetMargins()
	colWidth := (pageW - lm - rm) / 3
	rowHeight := 45.0
	for _, row := range rows {
		yStart := pdf.GetY()
		count := len(row)
		if count == 1 {
			// center the single signer
			x := lm + (pageW-lm-rm-colWidth)/2
			renderSignerBlock(pdf, x, yStart, colWidth, rowHeight, row[0])
		} else if count == 2 {
			// two columns spread
			x1 := lm + colWidth/2
			x2 := lm + colWidth/2 + colWidth
			renderSignerBlock(pdf, x1, yStart, colWidth, rowHeight, row[0])
			renderSignerBlock(pdf, x2, yStart, colWidth, rowHeight, row[1])
		} else {
			for ci, s := range row {
				x := lm + float64(ci)*colWidth
				renderSignerBlock(pdf, x, yStart, colWidth, rowHeight, s)
			}
		}
		pdf.SetY(yStart + rowHeight)
		pdf.Ln(4)
	}
}

func renderSignerBlock(pdf *gofpdf.Fpdf, x, y, w, h float64, s Signer) {
	pdf.SetXY(x, y)
	pdf.SetFontStyle("B")
	pdf.MultiCell(w, 5, s.Role, "", "C", false)
	pdf.SetFontStyle("")

	// Cap
	stampSize := 20.0
	centerX := x + w/2
	centerY := pdf.GetY() + stampSize/2 + 2
	drawStamp(pdf, centerX, centerY, stampSize/2, s.Stamp, s.StampText)

	// TTD (optional)
	pdf.SetY(centerY + stampSize/2 + 2)
	if strings.TrimSpace(s.TTD) != "" {
		drawBase64OrFile(pdf, s.TTD, x+w/2-15, pdf.GetY(), 30, 12)
		pdf.Ln(8)
	} else {
		pdf.Ln(6)
	}

	pdf.SetX(x)
	pdf.SetFontStyle("BU")
	pdf.MultiCell(w, 5, s.Name, "", "C", false)
	pdf.SetFontStyle("")
	if strings.TrimSpace(s.NIP) != "" {
		pdf.SetX(x)
		pdf.SetFontStyle("B")
		pdf.MultiCell(w, 5, "NIP: "+s.NIP, "", "C", false)
		pdf.SetFontStyle("")
	}
}

func drawStamp(pdf *gofpdf.Fpdf, centerX, centerY, radius float64, imageSrc string, text string) {
	if drawBase64OrFile(pdf, imageSrc, centerX-radius, centerY-radius, radius*2, radius*2) {
		return
	}
	if strings.TrimSpace(imageSrc) == "" && strings.TrimSpace(text) == "" {
		return
	}
	pdf.SetLineWidth(0.2)
	pdf.Ellipse(centerX, centerY, radius, radius, 0, "")
	if strings.TrimSpace(text) != "" {
		pdf.SetXY(centerX-radius, centerY-radius/2)
		pdf.MultiCell(radius*2, 4, text, "", "C", false)
	}
}

// drawBase64OrFile tries base64 (data URI or plain) then file path/URL.
// Returns false if image could not be drawn (missing file, invalid base64, etc.)
func drawBase64OrFile(pdf *gofpdf.Fpdf, src string, x, y, w, h float64) bool {
	if strings.TrimSpace(src) == "" {
		return false
	}
	data := src
	if strings.HasPrefix(data, "data:") {
		if idx := strings.Index(data, ","); idx >= 0 {
			data = data[idx+1:]
		}
	}
	// Try base64 decode first
	if b, err := base64.StdEncoding.DecodeString(data); err == nil {
		tmp := "/tmp/stamp_tmp.png"
		if err := os.WriteFile(tmp, b, 0o644); err == nil {
			pdf.ImageOptions(tmp, x, y, w, h, false, gofpdf.ImageOptions{}, 0, "")
			_ = os.Remove(tmp)
			return true
		}
	}
	// Try as file path - but check if file exists first to avoid error
	if _, err := os.Stat(src); err == nil {
		pdf.ImageOptions(src, x, y, w, h, false, gofpdf.ImageOptions{}, 0, "")
		return true
	}
	// File doesn't exist or is a Minio key - skip silently
	return false
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
