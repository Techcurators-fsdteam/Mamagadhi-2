import type { NextApiRequest, NextApiResponse } from 'next';
import { ApiResponse } from 'shared-types';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<{ status: string; timestamp: string }>>
) {
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
