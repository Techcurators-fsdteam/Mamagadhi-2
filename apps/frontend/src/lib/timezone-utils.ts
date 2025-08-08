/**
 * Timezone utilities for IST (Indian Standard Time) handling
 * All dates should be handled in IST throughout the application
 */

// IST timezone string
export const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Format a date/time string to IST time format
 */
export const formatTimeIST = (dateTime: string | Date): string => {
  const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: IST_TIMEZONE
  });
};

/**
 * Format a date/time string to IST date format
 */
export const formatDateIST = (dateTime: string | Date): string => {
  const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: IST_TIMEZONE
  });
};

/**
 * Format a date/time string to short IST date format
 */
export const formatDateShortIST = (dateTime: string | Date): string => {
  const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    timeZone: IST_TIMEZONE
  });
};

/**
 * Format a date/time string to IST with both date and time
 */
export const formatDateTimeIST = (dateTime: string | Date): { time: string; date: string } => {
  const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  
  const time = date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: IST_TIMEZONE
  });
  
  const dateStr = date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    timeZone: IST_TIMEZONE
  });
  
  return { time, date: dateStr };
};

/**
 * Format a date/time string for card display in IST
 */
export const formatDateForCard = (dateTime: string | Date): string => {
  const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  return date.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: IST_TIMEZONE
  });
};

/**
 * Get current date in IST timezone
 */
export const getCurrentDateIST = (): Date => {
  const now = new Date();
  // Convert to IST by creating a new date with IST offset
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istTime = new Date(utc + (5.5 * 3600000)); // IST is UTC+5:30
  return istTime;
};

/**
 * Convert a date/time to IST and format for input fields
 */
export const formatForTimeInput = (dateTime: string | Date): string => {
  const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  const istDate = new Date(date.toLocaleString('en-CA', { timeZone: IST_TIMEZONE }));
  
  const hours = istDate.getHours().toString().padStart(2, '0');
  const minutes = istDate.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Convert a date to IST and format for date input fields
 */
export const formatForDateInput = (dateTime: string | Date): string => {
  const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  const istDate = new Date(date.toLocaleString('en-CA', { timeZone: IST_TIMEZONE }));
  
  const year = istDate.getFullYear();
  const month = (istDate.getMonth() + 1).toString().padStart(2, '0');
  const day = istDate.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Combine date and time strings in IST and convert to UTC for storage
 */
export const combineDateTimeIST = (date: string, time: string): string => {
  if (!date || !time) return new Date().toISOString();
  
  try {
    // Create a date object assuming the input is in IST
    const dateObj = new Date(`${date}T${time}:00`);
    
    // If the browser is not in IST, we need to adjust
    // First, get what the browser thinks this time is
    const browserOffset = dateObj.getTimezoneOffset();
    
    // IST is UTC+5:30, so IST offset in minutes is -330
    const istOffset = -330;
    
    // Calculate the difference and adjust
    const offsetDiff = browserOffset - istOffset;
    const adjustedTime = new Date(dateObj.getTime() + (offsetDiff * 60000));
    
    return adjustedTime.toISOString();
  } catch (error) {
    console.error('Error combining date and time in IST:', error);
    return new Date().toISOString();
  }
};

/**
 * Calculate duration between two dates in IST
 */
export const calculateDurationIST = (startTime: string | Date, endTime: string | Date): string => {
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;
  
  const diffMs = end.getTime() - start.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours > 0) {
    return `${diffHours}h${diffMinutes > 0 ? ` ${diffMinutes}m` : ''}`;
  }
  return `${diffMinutes}m`;
};

/**
 * Check if two dates are on the same day in IST
 */
export const isSameDayIST = (date1: string | Date, date2: string | Date): boolean => {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  const date1IST = d1.toLocaleDateString('en-CA', { timeZone: IST_TIMEZONE });
  const date2IST = d2.toLocaleDateString('en-CA', { timeZone: IST_TIMEZONE });
  
  return date1IST === date2IST;
};

/**
 * Check if a date is different day than another in IST
 */
export const isDifferentDayIST = (date1: string | Date, date2: string | Date): boolean => {
  return !isSameDayIST(date1, date2);
};

/**
 * Format date for admin panels in IST
 */
export const formatDateForAdmin = (dateTime: string | Date): string => {
  const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: IST_TIMEZONE
  });
};

/**
 * Get the current year in IST
 */
export const getCurrentYearIST = (): number => {
  const now = new Date();
  return parseInt(now.toLocaleDateString('en-CA', { 
    timeZone: IST_TIMEZONE,
    year: 'numeric'
  }));
};

/**
 * Format timestamp for display in IST
 */
export const formatTimestampIST = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: IST_TIMEZONE
  });
};
