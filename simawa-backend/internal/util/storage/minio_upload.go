package storage

import (
	"context"
	"fmt"
	"io"

	"github.com/minio/minio-go/v7"
)

// UploadToMinio mengunggah satu objek ke bucket Minio yang diberikan dan
// mengembalikan key objek tersebut. Util ini dimaksudkan agar handler lain
// (activities, surat, dll) bisa berbagi logika upload yang sama.
func UploadToMinio(
	ctx context.Context,
	client *minio.Client,
	bucket string,
	key string,
	r io.Reader,
	size int64,
	contentType string,
) (string, error) {
	if client == nil {
		return "", fmt.Errorf("minio client nil")
	}
	if bucket == "" {
		return "", fmt.Errorf("minio bucket empty")
	}
	if key == "" {
		return "", fmt.Errorf("object key empty")
	}
	opts := minio.PutObjectOptions{ContentType: contentType}
	if _, err := client.PutObject(ctx, bucket, key, r, size, opts); err != nil {
		return "", err
	}
	return key, nil
}

// DeleteFromMinio removes an object from the specified Minio bucket.
func DeleteFromMinio(ctx context.Context, client *minio.Client, bucket, key string) error {
	if client == nil {
		return fmt.Errorf("minio client nil")
	}
	if bucket == "" {
		return fmt.Errorf("minio bucket empty")
	}
	if key == "" {
		// If key is empty, consider it already deleted or non-existent
		return nil
	}
	return client.RemoveObject(ctx, bucket, key, minio.RemoveObjectOptions{})
}

