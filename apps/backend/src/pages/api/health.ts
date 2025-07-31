import type { NextApiRequest, NextApiResponse } from 'next';
import { ApiResponse } from 'shared-types';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<{ status: string; timestamp: string }>>
) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  res.status(200).json({
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString()
    }
  });
}
