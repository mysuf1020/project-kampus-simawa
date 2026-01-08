package hash

import "golang.org/x/crypto/bcrypt"

func HashPassword(pw string) (string, error) {
	b, err := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost)
	return string(b), err
}

func CheckPassword(hashed, pw string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashed), []byte(pw))
}
