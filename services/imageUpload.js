'use strict';

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

/**
 * Image Upload Module — Cloudflare R2 integration via S3-compatible API.
 *
 * Environment variables required:
 *   R2_ACCOUNT_ID  — Cloudflare account ID
 *   R2_ACCESS_KEY  — R2 access key ID
 *   R2_SECRET_KEY  — R2 secret access key
 *   R2_BUCKET_NAME — Target bucket name
 *   R2_PUBLIC_URL  — Public base URL for accessing stored objects (e.g., "https://r2.choosepure.in")
 */

const getS3Client = () => {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY;
  const secretAccessKey = process.env.R2_SECRET_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing R2 configuration. Ensure R2_ACCOUNT_ID, R2_ACCESS_KEY, and R2_SECRET_KEY are set.');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
};

/**
 * Generates a unique object key for an uploaded image.
 * Format: scans/{uuid}/{originalFilename}
 *
 * @param {string} originalName - The original filename from the upload
 * @returns {string} Unique object key
 */
function generateObjectKey(originalName) {
  const id = uuidv4();
  // Sanitise filename: remove path separators and problematic characters
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `scans/${id}/${safeName}`;
}

/**
 * Uploads an array of multer file objects concurrently to Cloudflare R2.
 *
 * @param {Array<{buffer: Buffer, originalname: string, mimetype: string, size: number}>} files
 *   Array of multer file objects
 * @returns {Promise<Array<{url: string, key: string, size: number, contentType: string}>>}
 *   Array of upload result objects
 * @throws {Error} If any upload fails
 */
async function uploadImages(files) {
  if (!files || files.length === 0) {
    throw new Error('No files provided for upload.');
  }

  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!bucketName || !publicUrl) {
    throw new Error('Missing R2 configuration. Ensure R2_BUCKET_NAME and R2_PUBLIC_URL are set.');
  }

  const client = getS3Client();

  const uploadPromises = files.map(async (file) => {
    const key = generateObjectKey(file.originalname);

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ContentLength: file.size,
    });

    await client.send(command);

    // Construct public URL: trim trailing slash from publicUrl, prepend to key
    const baseUrl = publicUrl.replace(/\/+$/, '');
    const url = `${baseUrl}/${key}`;

    return {
      url,
      key,
      size: file.size,
      contentType: file.mimetype,
    };
  });

  // Upload all files concurrently
  const results = await Promise.all(uploadPromises);
  return results;
}

module.exports = {
  uploadImages,
  generateObjectKey,
  getS3Client,
};
