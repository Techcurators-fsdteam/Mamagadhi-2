import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Test database connection
    const { data: rides, error } = await supabase
      .from('rides')
      .select('ride_id')
      .limit(1);

    if (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Database connection failed',
        error: error.message
      });
    }

    return res.status(200).json({
      status: 'healthy',
      message: 'Backend is running correctly',
      database: 'connected',
      rides_count: rides?.length || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Backend health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
