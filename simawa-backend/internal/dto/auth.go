package dto

type LoginRequest struct {
	Login    string `json:"login" binding:"required,email"` // email only
	Password string `json:"password" binding:"required"` // plaintext, validated by service
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
