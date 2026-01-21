package main

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"simawa-backend/internal/model"
	"simawa-backend/internal/repository"
)

func main() {
	if len(os.Args) < 3 {
		fmt.Println("Usage: reset-password <email> <new_password>")
		fmt.Println("Example: reset-password mochammad.yusuf@raharja.info NewPassword@123")
		os.Exit(1)
	}

	email := os.Args[1]
	newPassword := os.Args[2]

	_ = godotenv.Load()

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "host=localhost user=postgres password=postgres dbname=simawa port=5432 sslmode=disable"
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	var user model.User
	if err := db.Where("email = ?", email).First(&user).Error; err != nil {
		log.Fatalf("User not found: %v", err)
	}

	hash, err := repository.BcryptHash(newPassword)
	if err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}

	if err := db.Model(&user).Update("password_hash", hash).Error; err != nil {
		log.Fatalf("Failed to update password: %v", err)
	}

	fmt.Printf("Password for %s has been reset successfully!\n", email)
	fmt.Printf("New password: %s\n", newPassword)
}
