package suratpdf

import "time"

type Variant string

const (
	VariantUndangan   Variant = "undangan"
	VariantPeminjaman Variant = "peminjaman"
	VariantPengajuan  Variant = "pengajuan"
	VariantPermohonan Variant = "permohonan"
	// Keep existing for backward compatibility if needed, or map them
	VariantNonAcademic Variant = "non_academic"
	VariantAcademic    Variant = "academic"
)

type Theme struct {
	FontFamily   string  `json:"font_family"` // e.g. "Times"
	FontSize     float64 `json:"font_size"`   // e.g. 12
	MarginTop    float64 `json:"margin_top"`  // mm
	MarginRight  float64 `json:"margin_right"`
	MarginBottom float64 `json:"margin_bottom"`
	MarginLeft   float64 `json:"margin_left"`
}

type Header struct {
	LeftLogo  string   `json:"left_logo"`  // optional base64 or file path/URL
	RightLogo string   `json:"right_logo"` // optional
	// Title menampung baris header siap pakai (fallback untuk kompatibilitas).
	// Jika field terstruktur di bawah diisi dan Title kosong, Title akan dirangkai
	// dari OrgName, OrgUnit, OrgAddress, dan OrgPhone (lihat renderHeader).
	Title []string `json:"title"` // lines for institution name/address

	// Field terstruktur (optional) untuk memecah header:
	// - OrgName   : nama instansi, mis. "Universitas Raharja"
	// - OrgUnit   : nama unit/organisasi, mis. "Badan Eksekutif Mahasiswa"
	// - OrgAddress: alamat instansi
	// - OrgPhone  : nomor telepon / kontak.
	OrgName    string `json:"org_name,omitempty"`
	OrgUnit    string `json:"org_unit,omitempty"`
	OrgAddress string `json:"org_address,omitempty"`
	OrgPhone   string `json:"org_phone,omitempty"`
}

type Meta struct {
	Number       string `json:"number"`
	Subject      string `json:"subject"`
	ToRole       string `json:"to_role"`
	ToName       string `json:"to_name"`
	ToPlace      string `json:"to_place"`
	ToCity       string `json:"to_city"`
	PlaceAndDate string `json:"place_and_date"`
	Lampiran     string `json:"lampiran"`
}

type Signer struct {
	Name      string `json:"name"`
	Role      string `json:"role"`
	NIP       string `json:"nip,omitempty"`
	Stamp     string `json:"stamp_base64,omitempty"` // optional base64 image
	TTD       string `json:"ttd_base64,omitempty"`   // optional base64 image
	StampText string `json:"stamp_text,omitempty"`   // fallback text when stamp image is absent
}

type Payload struct {
	Variant   Variant   `json:"variant"`
	CreatedAt time.Time `json:"created_at"`
	Header    *Header   `json:"header,omitempty"`
	Meta      Meta      `json:"meta"`
	// Body (deprecated) – use BodyOpening/BodyContent/BodyClosing instead.
	Body        []string `json:"body,omitempty"`         // paragraphs
	BodyOpening string   `json:"body_opening,omitempty"` // salam pembuka
	BodyContent []string `json:"body_content,omitempty"` // isi surat
	BodyClosing string   `json:"body_closing,omitempty"` // salam penutup
	Footer      string   `json:"footer"`                 // optional note/footer
	Signs       []Signer `json:"signs"`                  // one or more signers
	Tembusan    []string `json:"tembusan,omitempty"`
}
