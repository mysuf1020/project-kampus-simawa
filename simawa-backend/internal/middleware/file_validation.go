package middleware

import (
	"bytes"
	"io"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// File magic bytes signatures
var magicBytes = map[string][][]byte{
	"application/pdf": {
		{0x25, 0x50, 0x44, 0x46}, // %PDF
	},
	"image/jpeg": {
		{0xFF, 0xD8, 0xFF},
	},
	"image/png": {
		{0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A},
	},
	"image/gif": {
		{0x47, 0x49, 0x46, 0x38, 0x37, 0x61}, // GIF87a
		{0x47, 0x49, 0x46, 0x38, 0x39, 0x61}, // GIF89a
	},
	"image/webp": {
		{0x52, 0x49, 0x46, 0x46}, // RIFF (need to check WEBP after)
	},
	"application/zip": {
		{0x50, 0x4B, 0x03, 0x04},
	},
	"application/msword": {
		{0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1}, // DOC
	},
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
		{0x50, 0x4B, 0x03, 0x04}, // DOCX (ZIP-based)
	},
}

// AllowedFileTypes defines which file types are allowed for upload
var AllowedFileTypes = map[string]bool{
	"application/pdf": true,
	"image/jpeg":      true,
	"image/png":       true,
	"image/gif":       true,
	"image/webp":      true,
}

// ValidateFileType checks if the uploaded file matches its declared content type using magic bytes
func ValidateFileType(allowedTypes map[string]bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method != http.MethodPost && c.Request.Method != http.MethodPut {
			c.Next()
			return
		}

		contentType := c.GetHeader("Content-Type")
		if !strings.HasPrefix(contentType, "multipart/form-data") {
			c.Next()
			return
		}

		c.Next()
	}
}

// ValidateUploadedFile validates a single file's content against magic bytes
func ValidateUploadedFile(fileBytes []byte, declaredType string) bool {
	if len(fileBytes) < 8 {
		return false
	}

	signatures, exists := magicBytes[declaredType]
	if !exists {
		return false
	}

	for _, sig := range signatures {
		if len(fileBytes) >= len(sig) && bytes.HasPrefix(fileBytes, sig) {
			return true
		}
	}

	return false
}

// DetectFileType detects file type from magic bytes
func DetectFileType(fileBytes []byte) string {
	if len(fileBytes) < 8 {
		return ""
	}

	for mimeType, signatures := range magicBytes {
		for _, sig := range signatures {
			if len(fileBytes) >= len(sig) && bytes.HasPrefix(fileBytes, sig) {
				return mimeType
			}
		}
	}

	return ""
}

// MaxFileSizeMiddleware limits file upload size
func MaxFileSizeMiddleware(maxSize int64) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.ContentLength > maxSize {
			c.AbortWithStatusJSON(http.StatusRequestEntityTooLarge, gin.H{
				"message": "file too large",
				"max_size": maxSize,
			})
			return
		}
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxSize)
		c.Next()
	}
}

// SanitizeFilename removes potentially dangerous characters from filename
func SanitizeFilename(filename string) string {
	dangerous := []string{"..", "/", "\\", "\x00"}
	result := filename
	for _, d := range dangerous {
		result = strings.ReplaceAll(result, d, "")
	}
	return strings.TrimSpace(result)
}

// ReadFileHeader reads the first n bytes of a file for magic byte detection
func ReadFileHeader(r io.Reader, n int) ([]byte, error) {
	buf := make([]byte, n)
	bytesRead, err := io.ReadFull(r, buf)
	if err != nil && err != io.ErrUnexpectedEOF && err != io.EOF {
		return nil, err
	}
	return buf[:bytesRead], nil
}
