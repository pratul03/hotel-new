import { Client } from "minio";
import { env } from "./environment";

let minioClient: Client | null = null;

export const getMinioClient = (): Client => {
  if (minioClient) {
    return minioClient;
  }

  minioClient = new Client({
    endPoint: env.MINIO_ENDPOINT,
    port: env.MINIO_PORT,
    useSSL: env.MINIO_USE_SSL,
    accessKey: env.MINIO_ACCESS_KEY,
    secretKey: env.MINIO_SECRET_KEY,
  });

  return minioClient;
};

export const initializeMinIOBuckets = async () => {
  const client = getMinioClient();
  const buckets = [
    `${env.MINIO_BUCKET_PREFIX}-room-images`,
    `${env.MINIO_BUCKET_PREFIX}-hotel-images`,
    `${env.MINIO_BUCKET_PREFIX}-user-avatars`,
    `${env.MINIO_BUCKET_PREFIX}-invoices`,
  ];

  try {
    for (const bucket of buckets) {
      const exists = await client.bucketExists(bucket);
      if (!exists) {
        await client.makeBucket(bucket, "us-east-1");
        console.log(`✅ MinIO bucket created: ${bucket}`);
      } else {
        console.log(`✅ MinIO bucket exists: ${bucket}`);
      }
    }
  } catch (error) {
    console.error("❌ MinIO initialization error:", error);
    throw error;
  }
};

export default getMinioClient;
