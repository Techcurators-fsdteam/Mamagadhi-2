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
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  const { user_id, document_type, uuid, filetype } = req.body;
  
  if (!user_id || !document_type || !uuid || !filetype) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields: user_id, document_type, uuid, filetype' 
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