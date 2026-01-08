package repository

import "golang.org/x/crypto/bcrypt"

func BcryptHash(plain string) (string, error) {
	b, err := bcrypt.GenerateFromPassword([]byte(plain), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(b), nil
}

func bcryptHash(plain string) (string, error) {
	return BcryptHash(plain)
}

func bcryptCompare(hash, plain string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(plain))
}
