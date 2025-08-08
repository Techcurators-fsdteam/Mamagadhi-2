import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to combine date and time into ISO string with IST handling
const combineDateAndTime = (date: string, time: string): string => {
  if (!date || !time) return new Date().toISOString();
  
  try {
    const dateParts = date.split('-');
    const timeParts = time.split(':');
    
    const year = parseInt(dateParts[0] || '2025', 10);
    const month = parseInt(dateParts[1] || '1', 10);
    const day = parseInt(dateParts[2] || '1', 10);
    const hours = parseInt(timeParts[0] || '0', 10);
    const minutes = parseInt(timeParts[1] || '0', 10);
    
    // Create date in IST timezone using a more explicit approach
    // IST is UTC+05:30, so we need to create the UTC equivalent
    
    // Create a date string that explicitly represents IST time
    const istDateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00+05:30`;
    
    // Parse this IST date and convert to UTC
    const utcDateTime = new Date(istDateString);
    
    console.log('Date conversion:', {
      input: { date, time },
      istString: istDateString,
      utcResult: utcDateTime.toISOString()
    });
    
    return utcDateTime.toISOString();
  } catch (error) {
    console.error('Error combining date and time:', error);
    return new Date().toISOString();
  }
};

// Function to calculate arrival datetime based on departure datetime and estimated duration from frontend
const calculateArrivalDateTime = (departureDateTime: string, departureTime: string, arrivalTime: string, duration?: string): string => {
  console.log('🕐 CALCULATING ARRIVAL DATETIME (IST):');
  console.log('  departureDateTime:', departureDateTime);
  console.log('  departureTime:', departureTime);
  console.log('  arrivalTime:', arrivalTime);
  console.log('  duration:', duration);
  
  try {
    if (!departureDateTime || !departureTime || !arrivalTime) {
      throw new Error('Missing required parameters');
    }

    // Parse departure time
    const depTimeParts = departureTime.split(':');
    const depHours = parseInt(depTimeParts[0] || '0', 10);
    const depMinutes = parseInt(depTimeParts[1] || '0', 10);
    
    // Validate parsed values
    if (isNaN(depHours) || isNaN(depMinutes)) {
      throw new Error('Invalid departure time format');
    }
    
    // Convert the stored UTC datetime back to IST for calculations
    const departureDateUTC = new Date(departureDateTime);
    const istOffsetMinutes = 5 * 60 + 30; // 330 minutes for IST (UTC+5:30)
    const departureDateIST = new Date(departureDateUTC.getTime() + (istOffsetMinutes * 60 * 1000));
    
    console.log('  departureDateIST:', departureDateIST.toISOString());
    
    // If we have duration information, use it to calculate properly (PREFERRED METHOD)
    if (duration) {
      try {
        // Parse duration (format: "2h 30m" or "45m" or "38h 21m" or "43h")
        const durationMatch = duration.match(/(?:(\d+)h\s*)?(?:(\d+)m)?/);
        if (durationMatch) {
          const hours = parseInt(durationMatch[1] || '0');
          const minutes = parseInt(durationMatch[2] || '0');
          const totalMinutes = hours * 60 + minutes;
          
          // Only use duration-based calculation if duration is meaningful (> 0)
          if (totalMinutes > 0) {
            // Add duration to departure datetime in IST to get actual arrival datetime
            const arrivalDateIST = new Date(departureDateIST.getTime() + totalMinutes * 60000);
            
            // Convert back to UTC for storage
            const arrivalDateUTC = new Date(arrivalDateIST.getTime() - (istOffsetMinutes * 60 * 1000));
            
            console.log('  Using duration-based calculation:', {
              hours,
              minutes,
              totalMinutes,
              arrivalDateIST: arrivalDateIST.toISOString(),
              arrivalDateUTC: arrivalDateUTC.toISOString()
            });
            return arrivalDateUTC.toISOString();
          }
        }
      } catch (durationError) {
        console.error('Error parsing duration, falling back to time comparison:', durationError);
      }
    }
    
    // Fallback: Use arrival time from frontend and determine the correct date
    // Parse arrival time from frontend
    const arrTimeParts = arrivalTime.split(':');
    const arrHours = parseInt(arrTimeParts[0] || '0', 10);
    const arrMinutes = parseInt(arrTimeParts[1] || '0', 10);
    
    if (isNaN(arrHours) || isNaN(arrMinutes)) {
      throw new Error('Invalid arrival time format');
    }
    
    // Create arrival datetime starting with the same date as departure in IST
    const arrivalDateIST = new Date(departureDateIST);
    arrivalDateIST.setHours(arrHours, arrMinutes, 0, 0);
    
    // If arrival time is earlier than departure time, it must be on a future day
    // Calculate how many days to add based on the time difference
    if (arrivalDateIST.getTime() <= departureDateIST.getTime()) {
      // Calculate the time difference in milliseconds
      const timeDiff = departureDateIST.getTime() - arrivalDateIST.getTime();
      // Calculate days to add (24 hours = 24 * 60 * 60 * 1000 milliseconds)
      const daysToAdd = Math.ceil(timeDiff / (24 * 60 * 60 * 1000));
      arrivalDateIST.setDate(arrivalDateIST.getDate() + daysToAdd);
    }
    
    // Convert back to UTC for storage
    const arrivalDateUTC = new Date(arrivalDateIST.getTime() - (istOffsetMinutes * 60 * 1000));
    
    console.log('  Using time-based calculation:', {
      arrivalDateIST: arrivalDateIST.toISOString(),
      arrivalDateUTC: arrivalDateUTC.toISOString()
    });
    
    return arrivalDateUTC.toISOString();
  } catch (error) {
    console.error('Error calculating arrival datetime:', error);
    // If there's an error, return the departure time (this shouldn't happen in normal flow)
    return departureDateTime;
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      formData,
      bookingDetails,
      stopovers,
      originCoords,
      destinationCoords,
      originState,
      destinationState,
      vehicleType,
      duration,
      driverId
    } = req.body;

    console.log('=== RIDE SUBMISSION RECEIVED ===');
    console.log('📍 Received ride data:', {
      formData,
      originCoords,
      destinationCoords,
      originState,
      destinationState,
      stopovers: stopovers?.length || 0,
      driverId,
      vehicleType,
      bookingDetails
    });

    // Validate required fields
    if (!formData?.origin || !formData?.destination || !bookingDetails?.date || !bookingDetails?.departureTime || !driverId) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Origin, destination, departure date, departure time, and driver ID are required'
      });
    }

    // Validate price
    const pricePerSeat = parseFloat(bookingDetails.pricePerSeat);
    if (isNaN(pricePerSeat) || pricePerSeat <= 0) {
      return res.status(400).json({
        error: 'Invalid price per seat'
      });
    }

    // Calculate seats based on vehicle type
    const getSeatsFromVehicleType = (type: string): number => {
      const seatMap: { [key: string]: number } = {
        'bike': 1,
        'sedan': 4,
        'suv': 6,
        'van': 6,
        'minibus': 10,
        'bus': 16
      };
      return seatMap[type] || 4;
    };

    const totalSeats = getSeatsFromVehicleType(vehicleType);

    // Prepare origin and destination - ONLY landmarks, not full location names
    const originText = formData.originLandmark || formData.origin || '';
    const destinationText = formData.destinationLandmark || formData.destination || '';

    // Prepare ride data
    const departureDateTime = combineDateAndTime(bookingDetails.date, bookingDetails.departureTime);
    const arrivalDateTime = calculateArrivalDateTime(departureDateTime, bookingDetails.departureTime, bookingDetails.arrivalTime, duration);
    
    console.log('🗃️ FINAL RIDE DATA FOR DATABASE:');
    console.log('  Input - date:', bookingDetails.date, 'departureTime:', bookingDetails.departureTime, 'arrivalTime:', bookingDetails.arrivalTime, 'duration:', duration);
    console.log('  Output - departure_time:', departureDateTime, 'arrival_time:', arrivalDateTime);
    
    const rideInsertData: any = {
      vehicle_type: vehicleType,
      origin: originText,
      destination: destinationText,
      origin_state: originState || null,
      destination_state: destinationState || null,
      departure_time: departureDateTime,
      arrival_time: arrivalDateTime,
      seats_total: totalSeats,
      seats_available: totalSeats,
      price_per_seat: pricePerSeat,
      driver_id: driverId, // This is the user_id from user_profiles table
      status: 'open'
    };

    // Convert coordinates to PostGIS geography format and add to the insert data
    if (originCoords && Array.isArray(originCoords) && originCoords.length === 2) {
      // Use ST_MakePoint for geography - PostGIS function
      rideInsertData.origin_geog = `POINT(${originCoords[1]} ${originCoords[0]})`;
      console.log('🗺️ Origin coordinates converted:', originCoords, '→', rideInsertData.origin_geog);
    }
    
    if (destinationCoords && Array.isArray(destinationCoords) && destinationCoords.length === 2) {
      rideInsertData.destination_geog = `POINT(${destinationCoords[1]} ${destinationCoords[0]})`;
      console.log('🗺️ Destination coordinates converted:', destinationCoords, '→', rideInsertData.destination_geog);
    }

    console.log('💾 Prepared ride insert data:', rideInsertData);

    // Insert the ride with all data including geography
    const { data: rideData, error: rideError } = await supabase
      .from('rides')
      .insert(rideInsertData)
      .select('ride_id')
      .single();

    if (rideError) {
      console.error('❌ Error creating ride:', rideError);
      return res.status(500).json({
        error: 'Failed to create ride',
        details: rideError.message
      });
    }

    console.log('✅ Ride successfully created with ID:', rideData.ride_id);
    const rideId = rideData.ride_id;

    // Insert stopovers if any
    if (stopovers && Array.isArray(stopovers) && stopovers.length > 0) {
      const stopoverData = stopovers.map((stopover: any, index: number) => {
        const stopData: any = {
          ride_id: rideId,
          sequence: index + 1,
          landmark: stopover.name || null
        };

        // Add geography data if coordinates are available
        if (stopover.coordinates && Array.isArray(stopover.coordinates) && stopover.coordinates.length === 2) {
          stopData.stop_geog = `POINT(${stopover.coordinates[1]} ${stopover.coordinates[0]})`;
        }

        return stopData;
      });

      const { error: stopError } = await supabase
        .from('ride_stops')
        .insert(stopoverData);

      if (stopError) {
        console.error('Error creating stopovers:', stopError);
        // Continue without stopovers - not critical for ride creation
      }
    }

    // Insert stopovers if any
    if (stopovers && Array.isArray(stopovers) && stopovers.length > 0) {
      const stopoverData = stopovers.map((stopover: any, index: number) => {
        const stopData: any = {
          ride_id: rideId,
          sequence: index + 1,
          landmark: stopover.name || null
        };

        // Add geography data if coordinates are available
        if (stopover.coordinates && Array.isArray(stopover.coordinates) && stopover.coordinates.length === 2) {
          stopData.stop_geog = `POINT(${stopover.coordinates[1]} ${stopover.coordinates[0]})`;
        }

        return stopData;
      });

      const { error: stopError } = await supabase
        .from('ride_stops')
        .insert(stopoverData);

      if (stopError) {
        console.error('❌ Error creating stopovers:', stopError);
        // Continue without stopovers - not critical for ride creation
        console.warn('⚠️ Stopovers were not saved, but ride was created successfully');
      } else {
        console.log('✅ Stopovers successfully created:', stopovers.length, 'stops');
      }
    }

    console.log('🎉 RIDE PUBLISHED SUCCESSFULLY!');
    console.log('📊 Final response data:', {
      ride_id: rideId,
      origin: originText,
      destination: destinationText,
      departure_time: rideInsertData.departure_time,
      arrival_time: rideInsertData.arrival_time,
      seats_total: totalSeats,
      price_per_seat: pricePerSeat,
      stopovers_count: stopovers?.length || 0
    });

    return res.status(200).json({
      success: true,
      message: 'Ride published successfully!',
      rideId: rideId,
      data: {
        ride_id: rideId,
        origin: originText,
        destination: destinationText,
        departure_time: rideInsertData.departure_time,
        arrival_time: rideInsertData.arrival_time,
        seats_total: totalSeats,
        price_per_seat: pricePerSeat,
        stopovers_count: stopovers?.length || 0
      }
    });

  } catch (error) {
    console.error('Unexpected error in rides API:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
