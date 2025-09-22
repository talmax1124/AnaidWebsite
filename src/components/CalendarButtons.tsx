import React from 'react';
import { Calendar, Download, Clock } from 'lucide-react';
import { Booking } from '../types';
import {
  generateGoogleCalendarUrl,
  generateOutlookCalendarUrl,
  downloadICSFile,
  isAppleDevice
} from '../services/calendarService';

interface CalendarButtonsProps {
  booking: Booking;
  compact?: boolean;
}

const CalendarButtons: React.FC<CalendarButtonsProps> = ({ booking, compact = false }) => {
  const handleAddToGoogleCalendar = () => {
    try {
      const url = generateGoogleCalendarUrl(booking);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error opening Google Calendar:', error);
    }
  };

  const handleAddToAppleCalendar = () => {
    try {
      downloadICSFile(booking);
    } catch (error) {
      console.error('Error downloading Apple Calendar file:', error);
    }
  };

  const handleAddToOutlookCalendar = () => {
    try {
      const url = generateOutlookCalendarUrl(booking);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error opening Outlook Calendar:', error);
    }
  };

  const handleDownloadICS = () => {
    try {
      downloadICSFile(booking);
    } catch (error) {
      console.error('Error downloading ICS file:', error);
    }
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleAddToGoogleCalendar}
          className="btn-secondary text-xs px-3 py-1 flex items-center space-x-1"
          title="Add to Google Calendar"
        >
          <Calendar className="w-3 h-3" />
          <span>Google</span>
        </button>
        {isAppleDevice() && (
          <button
            onClick={handleAddToAppleCalendar}
            className="btn-secondary text-xs px-3 py-1 flex items-center space-x-1"
            title="Add to Apple Calendar"
          >
            <Calendar className="w-3 h-3" />
            <span>Apple</span>
          </button>
        )}
        <button
          onClick={handleDownloadICS}
          className="btn-secondary text-xs px-3 py-1 flex items-center space-x-1"
          title="Download calendar file"
        >
          <Download className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-3">
        <Clock className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-blue-900">Add to Calendar</h3>
      </div>
      
      <p className="text-sm text-blue-800 mb-4">
        Don't forget your appointment! Add it to your calendar to get automatic reminders.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          onClick={handleAddToGoogleCalendar}
          className="flex items-center justify-center space-x-2 bg-white border border-blue-300 rounded-lg px-4 py-3 text-blue-700 hover:bg-blue-50 transition-colors"
        >
          <Calendar className="w-5 h-5" />
          <span className="font-medium">Google Calendar</span>
        </button>

        <button
          onClick={handleAddToOutlookCalendar}
          className="flex items-center justify-center space-x-2 bg-white border border-blue-300 rounded-lg px-4 py-3 text-blue-700 hover:bg-blue-50 transition-colors"
        >
          <Calendar className="w-5 h-5" />
          <span className="font-medium">Outlook Calendar</span>
        </button>

        {isAppleDevice() && (
          <button
            onClick={handleAddToAppleCalendar}
            className="flex items-center justify-center space-x-2 bg-white border border-blue-300 rounded-lg px-4 py-3 text-blue-700 hover:bg-blue-50 transition-colors"
          >
            <Calendar className="w-5 h-5" />
            <span className="font-medium">Apple Calendar</span>
          </button>
        )}

        <button
          onClick={handleDownloadICS}
          className="flex items-center justify-center space-x-2 bg-white border border-blue-300 rounded-lg px-4 py-3 text-blue-700 hover:bg-blue-50 transition-colors"
        >
          <Download className="w-5 h-5" />
          <span className="font-medium">Download .ics</span>
        </button>
      </div>

      <p className="text-xs text-blue-600 mt-3">
        Can't see your calendar app? Download the .ics file and import it manually.
      </p>
    </div>
  );
};

export default CalendarButtons;