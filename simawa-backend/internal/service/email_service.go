package service

import (
	"bytes"
	"fmt"
	"html/template"
	"net/smtp"

	"simawa-backend/internal/config"
)

type EmailService struct {
	cfg *config.SMTPEnv
}

func NewEmailService(cfg *config.SMTPEnv) *EmailService {
	return &EmailService{cfg: cfg}
}

type EmailData struct {
	To      string
	Subject string
	Body    string
}

func (s *EmailService) Send(data EmailData) error {
	fmt.Printf("[EMAIL] SMTP Config: Host=%s, Port=%d, User=%s, From=%s\n", s.cfg.Host, s.cfg.Port, s.cfg.User, s.cfg.From)
	
	if s.cfg.User == "" || s.cfg.Password == "" {
		// Skip sending if SMTP not configured (dev mode)
		fmt.Printf("[EMAIL] SMTP not configured (User or Password empty) - printing email instead\n")
		fmt.Printf("[EMAIL] Would send to %s: %s\n%s\n", data.To, data.Subject, data.Body)
		return nil
	}

	fmt.Printf("[EMAIL] Sending email to %s via %s:%d\n", data.To, s.cfg.Host, s.cfg.Port)
	
	auth := smtp.PlainAuth("", s.cfg.User, s.cfg.Password, s.cfg.Host)

	from := fmt.Sprintf("%s <%s>", s.cfg.FromName, s.cfg.From)
	msg := []byte(fmt.Sprintf(
		"From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=\"UTF-8\"\r\n\r\n%s",
		from, data.To, data.Subject, data.Body,
	))

	addr := fmt.Sprintf("%s:%d", s.cfg.Host, s.cfg.Port)
	err := smtp.SendMail(addr, auth, s.cfg.From, []string{data.To}, msg)
	if err != nil {
		fmt.Printf("[EMAIL] Failed to send: %v\n", err)
		return err
	}
	fmt.Printf("[EMAIL] Successfully sent to %s\n", data.To)
	return nil
}

// SendOTP sends OTP code for login verification
func (s *EmailService) SendOTP(to, otp, purpose string) error {
	var subject, title, message string

	switch purpose {
	case "login":
		subject = "Kode OTP Login - SIMAWA"
		title = "Verifikasi Login"
		message = "Gunakan kode OTP berikut untuk melanjutkan proses login ke akun SIMAWA Anda."
	case "register":
		subject = "Verifikasi Email - SIMAWA"
		title = "Verifikasi Email"
		message = "Gunakan kode OTP berikut untuk memverifikasi alamat email Anda."
	case "reset":
		subject = "Reset Password - SIMAWA"
		title = "Reset Password"
		message = "Gunakan kode OTP berikut untuk mereset password akun SIMAWA Anda."
	default:
		subject = "Kode OTP - SIMAWA"
		title = "Kode OTP"
		message = "Gunakan kode OTP berikut untuk melanjutkan proses verifikasi."
	}

	body, err := s.renderOTPTemplate(title, message, otp)
	if err != nil {
		return err
	}

	return s.Send(EmailData{
		To:      to,
		Subject: subject,
		Body:    body,
	})
}

func (s *EmailService) renderOTPTemplate(title, message, otp string) (string, error) {
	tmpl := `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{.Title}}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); border-radius: 16px 16px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">SIMAWA</h1>
                            <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Sistem Informasi Manajemen Organisasi Mahasiswa</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 24px; font-weight: 600; text-align: center;">{{.Title}}</h2>
                            <p style="margin: 0 0 32px; color: #64748b; font-size: 16px; line-height: 1.6; text-align: center;">{{.Message}}</p>
                            
                            <!-- OTP Box -->
                            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px dashed #3b82f6; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px;">
                                <p style="margin: 0 0 8px; color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Kode OTP Anda</p>
                                <p style="margin: 0; color: #1e40af; font-size: 40px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">{{.OTP}}</p>
                            </div>
                            
                            <!-- Warning -->
                            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                                <p style="margin: 0; color: #92400e; font-size: 14px;">
                                    <strong>⚠️ Penting:</strong> Kode OTP ini berlaku selama <strong>5 menit</strong>. Jangan bagikan kode ini kepada siapapun.
                                </p>
                            </div>
                            
                            <p style="margin: 0; color: #94a3b8; font-size: 14px; text-align: center;">
                                Jika Anda tidak meminta kode ini, abaikan email ini atau hubungi administrator.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 40px; background-color: #f8fafc; border-radius: 0 0 16px 16px; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">
                                © 2024 SIMAWA - Universitas Raharja<br>
                                Email ini dikirim secara otomatis, mohon tidak membalas email ini.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`

	t, err := template.New("otp").Parse(tmpl)
	if err != nil {
		return "", err
	}

	var buf bytes.Buffer
	err = t.Execute(&buf, map[string]string{
		"Title":   title,
		"Message": message,
		"OTP":     otp,
	})
	if err != nil {
		return "", err
	}

	return buf.String(), nil
}

// SendWelcome sends welcome email after successful registration
func (s *EmailService) SendWelcome(to, name string) error {
	body, err := s.renderWelcomeTemplate(name)
	if err != nil {
		return err
	}

	return s.Send(EmailData{
		To:      to,
		Subject: "Selamat Datang di SIMAWA - Universitas Raharja",
		Body:    body,
	})
}

func (s *EmailService) renderWelcomeTemplate(name string) (string, error) {
	tmpl := `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Selamat Datang</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #059669 0%, #10b981 100%); border-radius: 16px 16px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🎉 Selamat Datang!</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 24px; font-weight: 600;">Halo, {{.Name}}!</h2>
                            <p style="margin: 0 0 24px; color: #64748b; font-size: 16px; line-height: 1.6;">
                                Akun SIMAWA Anda telah berhasil diverifikasi. Sekarang Anda dapat mengakses semua fitur sistem manajemen organisasi mahasiswa Universitas Raharja.
                            </p>
                            
                            <div style="background-color: #f0fdf4; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                                <h3 style="margin: 0 0 16px; color: #166534; font-size: 16px;">Yang dapat Anda lakukan:</h3>
                                <ul style="margin: 0; padding-left: 20px; color: #15803d; font-size: 14px; line-height: 1.8;">
                                    <li>Melihat dan bergabung dengan organisasi mahasiswa</li>
                                    <li>Mengikuti kegiatan dan acara kampus</li>
                                    <li>Mengajukan proposal kegiatan</li>
                                    <li>Mengelola surat menyurat organisasi</li>
                                </ul>
                            </div>
                            
                            <p style="margin: 0; color: #64748b; font-size: 14px; text-align: center;">
                                Butuh bantuan? Hubungi administrator di <a href="mailto:admin@raharja.info" style="color: #3b82f6;">admin@raharja.info</a>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 40px; background-color: #f8fafc; border-radius: 0 0 16px 16px; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">
                                © 2024 SIMAWA - Universitas Raharja
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`

	t, err := template.New("welcome").Parse(tmpl)
	if err != nil {
		return "", err
	}

	var buf bytes.Buffer
	err = t.Execute(&buf, map[string]string{
		"Name": name,
	})
	if err != nil {
		return "", err
	}

	return buf.String(), nil
}
