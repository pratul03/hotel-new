"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeMinIOBuckets = exports.getMinioClient = void 0;
const minio_1 = require("minio");
const environment_1 = require("./environment");
let minioClient = null;
const getMinioClient = () => {
    if (minioClient) {
        return minioClient;
    }
    minioClient = new minio_1.Client({
        endPoint: environment_1.env.MINIO_ENDPOINT,
        port: environment_1.env.MINIO_PORT,
        useSSL: environment_1.env.MINIO_USE_SSL,
        accessKey: environment_1.env.MINIO_ACCESS_KEY,
        secretKey: environment_1.env.MINIO_SECRET_KEY,
    });
    return minioClient;
};
exports.getMinioClient = getMinioClient;
const initializeMinIOBuckets = async () => {
    const client = (0, exports.getMinioClient)();
    const buckets = [
        `${environment_1.env.MINIO_BUCKET_PREFIX}-room-images`,
        `${environment_1.env.MINIO_BUCKET_PREFIX}-hotel-images`,
        `${environment_1.env.MINIO_BUCKET_PREFIX}-user-avatars`,
    ];
    try {
        for (const bucket of buckets) {
            const exists = await client.bucketExists(bucket);
            if (!exists) {
                await client.makeBucket(bucket, 'us-east-1');
                console.log(`✅ MinIO bucket created: ${bucket}`);
            }
            else {
                console.log(`✅ MinIO bucket exists: ${bucket}`);
            }
        }
    }
    catch (error) {
        console.error('❌ MinIO initialization error:', error);
        throw error;
    }
};
exports.initializeMinIOBuckets = initializeMinIOBuckets;
exports.default = exports.getMinioClient;
