import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { rideId } = req.query;
    const { driverId } = req.body;

    if (!rideId || !driverId) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Ride ID and driver ID are required'
      });
    }

    console.log(`🗑️ Attempting to delete ride ${rideId} for driver ${driverId}`);

    // First, verify that the ride belongs to the requesting driver
    const { data: existingRide, error: fetchError } = await supabase
      .from('rides')
      .select('ride_id, driver_id, origin, destination, status')
      .eq('ride_id', rideId)
      .eq('driver_id', driverId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching ride for verification:', fetchError);
      return res.status(404).json({
        error: 'Ride not found',
        details: 'The ride does not exist or you do not have permission to delete it'
      });
    }

    if (!existingRide) {
      return res.status(403).json({
        error: 'Permission denied',
        details: 'You can only delete your own rides'
      });
    }

    console.log(`✅ Verified ride ownership: ${existingRide.origin} → ${existingRide.destination}`);

    // Check if ride can be deleted (only allow deletion of 'open' rides)
    if (existingRide.status !== 'open') {
      return res.status(400).json({
        error: 'Cannot delete ride',
        details: `Rides with status '${existingRide.status}' cannot be deleted`
      });
    }

    // Delete associated ride stops first (due to foreign key constraints)
    const { error: stopsDeleteError } = await supabase
      .from('ride_stops')
      .delete()
      .eq('ride_id', rideId);

    if (stopsDeleteError) {
      console.error('❌ Error deleting ride stops:', stopsDeleteError);
      // Continue with ride deletion even if stops deletion fails
    } else {
      console.log('🗑️ Associated ride stops deleted successfully');
    }

    // Delete the ride
    const { error: deleteError } = await supabase
      .from('rides')
      .delete()
      .eq('ride_id', rideId)
      .eq('driver_id', driverId);

    if (deleteError) {
      console.error('❌ Error deleting ride:', deleteError);
      return res.status(500).json({
        error: 'Failed to delete ride',
        details: deleteError.message
      });
    }

    console.log(`✅ Ride ${rideId} successfully deleted`);

    return res.status(200).json({
      success: true,
      message: 'Ride deleted successfully',
      deletedRideId: rideId
    });

  } catch (error) {
    console.error('❌ Unexpected error in delete ride API:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
