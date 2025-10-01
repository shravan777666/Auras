// Date utility functions to handle timezone issues consistently

/**
 * Parse appointment date string without timezone conversion
 * Handles both "YYYY-MM-DD" and "YYYY-MM-DDTHH:mm" formats
 * @param {string} dateString - Date string from backend
 * @returns {Date} - Date object in local timezone
 */
export const parseAppointmentDate = (dateString) => {
  if (!dateString) return null;
  
  if (typeof dateString === 'string' && dateString.includes('T')) {
    // If it's in YYYY-MM-DDTHH:mm format, parse it carefully to avoid timezone shifts
    const [datePart, timePart] = dateString.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    
    if (timePart) {
      const [hours, minutes] = timePart.split(':').map(Number);
      if (!isNaN(hours)) {
        date.setHours(hours, minutes || 0, 0, 0);
      }
    }
    
    return date;
  } else {
    // For simple date strings like "YYYY-MM-DD"
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
};

/**
 * Extract date part from appointment date string without timezone conversion
 * @param {string} dateString - Date string from backend
 * @returns {string} - Date in YYYY-MM-DD format
 */
export const extractDatePart = (dateString) => {
  if (!dateString) return '';
  
  if (typeof dateString === 'string' && dateString.includes('T')) {
    return dateString.split('T')[0];
  }
  
  // If it's already in YYYY-MM-DD format
  return dateString;
};

/**
 * Format Date object to YYYY-MM-DD string without timezone conversion
 * @param {Date} date - Date object
 * @returns {string} - Date in YYYY-MM-DD format
 */
export const formatDateToString = (date) => {
  if (!date || !(date instanceof Date)) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Compare two dates for equality (date part only, ignoring time)
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {boolean} - True if dates are the same day
 */
export const isSameDay = (date1, date2) => {
  const dateStr1 = typeof date1 === 'string' ? extractDatePart(date1) : formatDateToString(date1);
  const dateStr2 = typeof date2 === 'string' ? extractDatePart(date2) : formatDateToString(date2);
  
  return dateStr1 === dateStr2;
};

/**
 * Extract time part from appointment date string
 * @param {string} dateString - Date string from backend (could be "YYYY-MM-DDTHH:mm" or just time)
 * @returns {string} - Time in HH:mm format
 */
export const extractTimePart = (dateString) => {
  if (!dateString) return '';
  
  if (typeof dateString === 'string' && dateString.includes('T')) {
    const timePart = dateString.split('T')[1];
    if (timePart) {
      return timePart.substring(0, 5); // Get HH:mm part
    }
  }
  
  // If it's already in HH:mm format or doesn't contain 'T'
  return dateString;
};

/**
 * Format time string for display (convert 24h to 12h format)
 * @param {string} timeString - Time in HH:mm format
 * @returns {string} - Time in 12h format (e.g., "2:30 PM")
 */
export const formatTimeForDisplay = (timeString) => {
  if (!timeString) return '';
  
  // Extract time part if it's a full datetime string
  const timeOnly = extractTimePart(timeString);
  
  const [hours, minutes] = timeOnly.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  
  return `${displayHour}:${minutes} ${ampm}`;
};

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string} - Today's date
 */
export const getTodayDateString = () => {
  return formatDateToString(new Date());
};

/**
 * Check if a date string is today or in the future
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {boolean} - True if date is today or future
 */
export const isValidFutureDate = (dateString) => {
  const today = getTodayDateString();
  return dateString >= today;
};
