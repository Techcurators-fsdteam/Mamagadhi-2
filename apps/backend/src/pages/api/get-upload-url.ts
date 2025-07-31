import type { NextApiRequest, NextApiResponse } from 'next';
import { S3Client, PutObjectCommand, PutObjectCommandInput } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ApiResponse, UploadResponse } from 'shared-types';

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<ApiResponse<UploadResponse & { uploadUrl: string; key: string }>>
) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  const { user_id, document_type, uuid, filetype, fileSize } = req.body;
  
  if (!user_id || !document_type || !uuid || !filetype) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields: user_id, document_type, uuid, filetype' 
    });
  }

  // Validate file size (2MB limit)
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes
  if (fileSize && fileSize > MAX_FILE_SIZE) {
    return res.status(400).json({ 
      success: false, 
      error: 'File size exceeds 2MB limit. Please compress your file and try again.' 
    });
  }

  // Validate file type
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
    'application/pdf', 'image/bmp'
  ];
  if (!allowedTypes.includes(filetype)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid file type. Only images (PNG, JPG, JPEG, WEBP, BMP) and PDF files are allowed.' 
    });
  }

  try {
    const ext = filetype.split('/').pop();
    const key = `${document_type}/${user_id}_${uuid}.${ext}`;

    const putCommand = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
      Key: key,
      ContentType: filetype,
    } as PutObjectCommandInput);

    const uploadUrl = await getSignedUrl(s3, putCommand, { expiresIn: 60 * 5 }); // 5 min expiry
    // Ensure the public URL includes the bucket name
    const publicUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_ENDPOINT}/${process.env.CLOUDFLARE_R2_BUCKET}/${key}`;

    return res.status(200).json({ 
      success: true,
      data: { 
        success: true,
        url: publicUrl,
        uploadUrl, 
        key 
      }
    });
  } catch (error) {
    console.error('S3 upload URL generation error:', error);
    return res.status(500).json({ 
      success: false, 
      error: (error as Error).message 
    });
  }
} 