package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"strings"
	"time"
)

type apiClient struct {
	baseURL string
	client  *http.Client
	token   string
}

type apiEnvelope[T any] struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    T      `json:"data"`
}

type loginResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
}

type organization struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Slug        string `json:"slug"`
	Type        string `json:"type"`
	Description string `json:"description"`
}

type listOrgsResponse struct {
	Items []organization `json:"items"`
}

type user struct {
	ID        string `json:"id"`
	Username  string `json:"username"`
	FirstName string `json:"first_name"`
	Email     string `json:"email"`
}

type activity struct {
	ID     string `json:"id"`
	OrgID  string `json:"org_id"`
	Title  string `json:"title"`
	Status string `json:"status"`
}

type surat struct {
	ID     int64  `json:"id"`
	OrgID  string `json:"org_id"`
	Status string `json:"status"`
}

func newClient(base string) *apiClient {
	return &apiClient{
		baseURL: strings.TrimRight(base, "/"),
		client: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

func (c *apiClient) do(method, path string, body any, out any) error {
	var buf *bytes.Buffer
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return fmt.Errorf("marshal body: %w", err)
		}
		buf = bytes.NewBuffer(b)
	} else {
		buf = &bytes.Buffer{}
	}

	req, err := http.NewRequest(method, c.baseURL+path, buf)
	if err != nil {
		return fmt.Errorf("new request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	if c.token != "" {
		req.Header.Set("Authorization", "Bearer "+c.token)
	}

	resp, err := c.client.Do(req)
	if err != nil {
		return fmt.Errorf("do request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		var raw map[string]any
		_ = json.NewDecoder(resp.Body).Decode(&raw)
		return fmt.Errorf("%s %s: status %d, body=%v", method, path, resp.StatusCode, raw)
	}

	if out != nil {
		if err := json.NewDecoder(resp.Body).Decode(out); err != nil {
			return fmt.Errorf("decode response: %w", err)
		}
	}
	return nil
}

func (c *apiClient) loginWithCredential(login, password string) error {
	body := map[string]any{
		"login":    login,
		"password": password,
	}
	var env apiEnvelope[loginResponse]
	if err := c.do(http.MethodPost, "/auth/login", body, &env); err != nil {
		return err
	}
	if !env.Success {
		return fmt.Errorf("login failed: %s", env.Message)
	}
	c.token = env.Data.AccessToken
	return nil
}

func (c *apiClient) loginAdmin() error {
	return c.loginWithCredential("admin@simawa.local", "REDACTED")
}

func (c *apiClient) listOrganizations() ([]organization, error) {
	var resp listOrgsResponse
	if err := c.do(http.MethodGet, "/orgs", nil, &resp); err != nil {
		return nil, err
	}
	return resp.Items, nil
}

func (c *apiClient) createUserForOrg(org organization, idx int, asOrgAccount bool) (*user, error) {
	slug := org.Slug
	if slug == "" {
		slug = strings.ToLower(strings.ReplaceAll(org.Name, " ", "-"))
	}

	base := "user"
	if asOrgAccount {
		base = "org"
	}

	username := fmt.Sprintf("%s_%s_%d_%d", slug, base, idx+1, rand.Intn(9999))
	email := fmt.Sprintf("%s_%d_%d@raharja.info", slug, idx+1, rand.Intn(9999))
	nim := fmt.Sprintf("%s%04d", time.Now().Format("060102"), idx+1)

	organisasi := asOrgAccount
	ukm := ""
	hmj := ""
	if asOrgAccount {
		switch strings.ToUpper(org.Type) {
		case "UKM":
			ukm = org.Name
		case "HMJ":
			hmj = org.Name
		case "BEM", "DEMA":
			// untuk BEM/DEMA, simpan di kolom ukm agar tidak kosong
			ukm = org.Type
		}
	}

	req := map[string]any{
		"username":      username,
		"firstname":     fmt.Sprintf("%s %s %d", org.Name, strings.ToUpper(base), idx+1),
		"secondname":    "",
		"organisasi":    organisasi,
		"ukm":           ukm,
		"hmj":           hmj,
		"jurusan":       "Teknik",
		"nim":           nim,
		"email":         email,
		"phone":         "08123456789",
		"alamat":        fmt.Sprintf("Alamat %s %d", org.Name, idx+1),
		"tanggal_lahir": "20000101",
		"password":      "User@12345",
	}

	var env apiEnvelope[user]
	if err := c.do(http.MethodPost, "/v1/users", req, &env); err != nil {
		return nil, err
	}
	if !env.Success {
		return nil, fmt.Errorf("create user failed: %s", env.Message)
	}
	return &env.Data, nil
}

func (c *apiClient) assignUserRoles(userID string, roles []string) error {
	body := map[string]any{
		"roles": roles,
	}
	return c.do(http.MethodPost, "/v1/users/"+userID+"/roles", body, nil)
}

func (c *apiClient) addOrgMember(orgID, userID, role string) error {
	body := map[string]any{
		"user_id": userID,
		"role":    role,
	}
	return c.do(http.MethodPost, fmt.Sprintf("/v1/orgs/%s/members", orgID), body, nil)
}

func (c *apiClient) mentionUser(userID, title, bodyText string) error {
	body := map[string]any{
		"user_id": userID,
		"title":   title,
		"body":    bodyText,
		"data": map[string]any{
			"seed": true,
		},
	}
	return c.do(http.MethodPost, "/v1/notifications/mention", body, nil)
}

func seedUsersPerOrg(c *apiClient, perOrg int) error {
	orgs, err := c.listOrganizations()
	if err != nil {
		return fmt.Errorf("list organizations: %w", err)
	}
	log.Printf("Found %d organizations", len(orgs))

	for _, org := range orgs {
		log.Printf("Seeding users for org %s (%s)", org.Name, org.ID)
		for i := 0; i < perOrg; i++ {
			u, err := c.createUserForOrg(org, i, false)
			if err != nil {
				return fmt.Errorf("create user for org %s: %w", org.ID, err)
			}
			log.Printf("  - created user %s (%s)", u.Username, u.ID)

			// assign basic USER role
			if err := c.assignUserRoles(u.ID, []string{"USER"}); err != nil {
				log.Printf("    ! failed assign USER role: %v", err)
			} else {
				log.Printf("    + assigned USER role")
			}

			// add as org member with MEMBER role
			if err := c.addOrgMember(org.ID, u.ID, "MEMBER"); err != nil {
				log.Printf("    ! failed add org member: %v", err)
			} else {
				log.Printf("    + added as org member (MEMBER)")
			}

			// send a simple notification to the new user
			if err := c.mentionUser(u.ID, "Selamat datang di SIMAWA", fmt.Sprintf("Akun anda untuk %s telah dibuat (seed data).", org.Name)); err != nil {
				log.Printf("    ! failed send notification: %v", err)
			} else {
				log.Printf("    + sent welcome notification")
			}
		}

		// tambahan: satu akun organisasi per org (organisasi=true, ukm/hmj terisi)
		orgUser, err := c.createUserForOrg(org, 0, true)
		if err != nil {
			log.Printf("  ! failed create org account for %s: %v", org.ID, err)
			continue
		}
		log.Printf("  - created org account %s (%s)", orgUser.Username, orgUser.ID)

		// tentukan role admin spesifik berdasarkan tipe organisasi
		roles := []string{"USER"}
		switch strings.ToUpper(org.Type) {
		case "BEM":
			roles = append(roles, "BEM_ADMIN")
		case "DEMA":
			roles = append(roles, "DEMA_ADMIN")
		}

		// berikan role USER (+ BEM/DEMA admin jika perlu)
		if err := c.assignUserRoles(orgUser.ID, roles); err != nil {
			log.Printf("    ! failed assign roles to org account: %v", err)
		} else {
			log.Printf("    + assigned roles %v to org account", roles)
		}

		// tambahkan juga sebagai anggota organisasi dengan role ADMIN
		if err := c.addOrgMember(org.ID, orgUser.ID, "ADMIN"); err != nil {
			log.Printf("    ! failed add org admin member: %v", err)
		} else {
			log.Printf("    + added as org ADMIN member (scoped ORG_ADMIN)")
		}
	}
	return nil
}

func (c *apiClient) createActivityForOrg(org organization, idx int) (*activity, error) {
	start := time.Now().Add(time.Duration(idx+1) * 24 * time.Hour)
	end := start.Add(2 * time.Hour)

	req := map[string]any{
		"org_id":      org.ID,
		"title":       fmt.Sprintf("Kegiatan %s #%d (seed)", org.Name, idx+1),
		"description": "Kegiatan hasil seeding otomatis untuk testing API.",
		"location":    "Kampus",
		"type":        "RAPAT",
		"public":      true,
		"start_at":    start.Unix(),
		"end_at":      end.Unix(),
		"metadata": map[string]any{
			"seed": true,
		},
	}

	var env apiEnvelope[activity]
	if err := c.do(http.MethodPost, "/v1/activities", req, &env); err != nil {
		return nil, err
	}
	if !env.Success {
		return nil, fmt.Errorf("create activity failed: %s", env.Message)
	}
	return &env.Data, nil
}

func (c *apiClient) submitActivity(activityID string) error {
	var env apiEnvelope[activity]
	if err := c.do(http.MethodPost, "/v1/activities/"+activityID+"/submit", nil, &env); err != nil {
		return err
	}
	if !env.Success {
		return fmt.Errorf("submit activity failed: %s", env.Message)
	}
	return nil
}

func (c *apiClient) createSuratForOrg(org organization, idx int) (*surat, error) {
	now := time.Now()
	subject := fmt.Sprintf("Surat undangan %s #%d (seed)", org.Name, idx+1)

	payload := map[string]any{
		"variant":    "non_academic",
		"created_at": now.Format(time.RFC3339),
		"meta": map[string]any{
			"number":        "",
			"subject":       subject,
			"to_role":       "Ketua",
			"to_name":       org.Name,
			"to_place":      "Kampus",
			"to_city":       "Tangerang",
			"place_and_date": fmt.Sprintf("Tangerang, %s", now.Format("02 January 2006")),
			"lampiran":      "",
		},
		"body_content": []string{
			"Ini adalah surat hasil seeding otomatis untuk keperluan testing.",
		},
		"footer": "",
		"signs": []map[string]any{
			{
				"name": "Admin SIMAWA",
				"role": "Admin",
			},
		},
		"tembusan": []string{},
	}

	req := map[string]any{
		"org_id": org.ID,
		"status": "DRAFT",
		"payload": payload,
	}

	var env apiEnvelope[surat]
	if err := c.do(http.MethodPost, "/v1/surat", req, &env); err != nil {
		return nil, err
	}
	if !env.Success {
		return nil, fmt.Errorf("create surat failed: %s", env.Message)
	}
	return &env.Data, nil
}

func (c *apiClient) submitSurat(id int64) error {
	path := fmt.Sprintf("/v1/surat/%d/submit", id)
	var env apiEnvelope[surat]
	if err := c.do(http.MethodPost, path, nil, &env); err != nil {
		return err
	}
	if !env.Success {
		return fmt.Errorf("submit surat failed: %s", env.Message)
	}
	return nil
}

func (c *apiClient) submitLPJForOrg(org organization, actID string, idx int) error {
	req := map[string]any{
		"activity_id": actID,
		"org_id":      org.ID,
		"summary":     fmt.Sprintf("LPJ kegiatan %s #%d (seed)", org.Name, idx+1),
		"budget_plan": 1_000_000,
		"budget_real": 900_000,
		"report_key":  fmt.Sprintf("lpj/seed-%s-%d.pdf", actID, idx),
		"photos":      []string{},
	}
	var env apiEnvelope[map[string]any]
	if err := c.do(http.MethodPost, "/v1/lpj/submit", req, &env); err != nil {
		return err
	}
	if !env.Success {
		return fmt.Errorf("submit LPJ failed: %s", env.Message)
	}
	return nil
}

func seedActivitiesAndDocuments(c *apiClient) error {
	orgs, err := c.listOrganizations()
	if err != nil {
		return fmt.Errorf("list organizations: %w", err)
	}

	for _, org := range orgs {
		log.Printf("Seeding activities/surat/LPJ for org %s (%s)", org.Name, org.ID)

		// 1. Activity + submit
		act, err := c.createActivityForOrg(org, 0)
		if err != nil {
			log.Printf("  ! failed create activity: %v", err)
		} else {
			log.Printf("  + activity created: %s (%s)", act.Title, act.ID)
			if err := c.submitActivity(act.ID); err != nil {
				log.Printf("    ! failed submit activity: %v", err)
			} else {
				log.Printf("    + activity submitted")
			}
		}

		// 2. Surat + submit
		s, err := c.createSuratForOrg(org, 0)
		if err != nil {
			log.Printf("  ! failed create surat: %v", err)
		} else {
			log.Printf("  + surat created: #%d", s.ID)
			if err := c.submitSurat(s.ID); err != nil {
				log.Printf("    ! failed submit surat: %v", err)
			} else {
				log.Printf("    + surat submitted")
			}
		}

		// 3. LPJ (jika activity berhasil dibuat)
		if act != nil && act.ID != "" {
			if err := c.submitLPJForOrg(org, act.ID, 0); err != nil {
				log.Printf("  ! failed submit LPJ: %v", err)
			} else {
				log.Printf("  + LPJ submitted for activity %s", act.ID)
			}
		}
	}
	return nil
}

func main() {
	rand.Seed(time.Now().UnixNano())

	base := os.Getenv("SIMAWA_API_BASE")
	if base == "" {
		base = "http://localhost:8080"
	}

	log.Printf("Using API base URL: %s", base)
	client := newClient(base)

	if err := client.loginAdmin(); err != nil {
		log.Fatalf("login admin failed: %v", err)
	}
	log.Println("Logged in as admin@simawa.local")

	if err := seedUsersPerOrg(client, 2); err != nil {
		log.Fatalf("seeding users failed: %v", err)
	}

	if err := seedActivitiesAndDocuments(client); err != nil {
		log.Fatalf("seeding activities/documents failed: %v", err)
	}

	log.Println("Done seeding users, activities, surat, dan LPJ per organisasi.")
}
