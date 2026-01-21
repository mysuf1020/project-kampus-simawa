package dto

type LoginRequest struct {
	Login        string `json:"login" binding:"required"`
	Password     string `json:"password" binding:"required"` // plaintext, validated by service
	CaptchaToken string `json:"captcha_token"` // Optional reCAPTCHA token
}

type LoginOTPRequest struct {
	Login string `json:"login" binding:"required"`
	OTP   string `json:"otp" binding:"required"`
}

type RegisterRequest struct {
	Username     string `json:"username" binding:"required,min=4,max=64"`
	FirstName    string `json:"first_name" binding:"required"`
	Email        string `json:"email" binding:"required,email"`
	Password     string `json:"password" binding:"required,min=8"`
	ConfirmPassword string `json:"confirm_password" binding:"required,eqfield=Password"`
	CaptchaToken string `json:"captcha_token"`
}

type VerifyEmailRequest struct {
	Email string `json:"email" binding:"required,email"`
	OTP   string `json:"otp" binding:"required"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type ResetPasswordRequest struct {
	Email           string `json:"email" binding:"required,email"`
	OTP             string `json:"otp" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=8"`
	ConfirmPassword string `json:"confirm_password" binding:"required,eqfield=NewPassword"`
}

type ChangePasswordRequest struct {
	OldPassword     string `json:"old_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=8"`
	ConfirmPassword string `json:"confirm_password" binding:"required,eqfield=NewPassword"`
}

type ResendOTPRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type LogoutRequest struct {
	AllDevices bool `json:"all_devices"`
}

type AuthResponse struct {
	AccessToken      string `json:"access_token"`
	ExpiresIn        int64  `json:"expires_in"`
	RefreshToken     string `json:"refresh_token"`
	RefreshExpiresIn int64  `json:"refresh_expires_in"`
}
