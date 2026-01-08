package minio

import (
	"context"
	"log"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"simawa-backend/internal/config"
)

func Init(cfg *config.Env) *minio.Client {
	cl, err := minio.New(cfg.Minio.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.Minio.AccessKey, cfg.Minio.SecretKey, ""),
		Secure: cfg.Minio.UseSSL,
	})
	if err != nil {
		log.Fatalf("minio new: %v", err)
	}

	ctx := context.Background()
	exists, err := cl.BucketExists(ctx, cfg.Minio.Bucket)
	if err != nil {
		log.Fatalf("minio bucket exists: %v", err)
	}
	if !exists {
		if err := cl.MakeBucket(ctx, cfg.Minio.Bucket, minio.MakeBucketOptions{}); err != nil {
			log.Fatalf("minio make bucket: %v", err)
		}
	}
	return cl
}
