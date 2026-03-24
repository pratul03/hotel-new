# MinIO Bucket Configuration Guide

## Bucket Names
- `room-images`: Images uploaded for specific rooms
- `hotel-images`: Hotel cover photos and gallery
- `user-avatars`: User profile avatars

## Bucket Policies
All buckets should have the following policy structure:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::bucket-name/*"
    }
  ]
}
```

This allows public read access while maintaining write protection.

## Setup Instructions

1. Access MinIO Console: http://localhost:9001
2. Login with: minioadmin / minioadmin
3. Create the three buckets
4. Set the read-only policy for each bucket

## Docker Setup
Buckets can also be created via the API in the backend initialization code.
See: apps/api/src/services/storage/minioClient.ts
