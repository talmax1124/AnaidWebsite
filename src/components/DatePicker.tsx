import React, { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, isAfter, isBefore, startOfDay } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import 'react-day-picker/dist/style.css';

interface DatePickerProps {
  value?: Date | string;
  onChange: (date: Date | undefined) => void;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  disabledDates?: Date[];
  disabledDaysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc.
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  disabled = false,
  placeholder = 'Select a date',
  label,
  required = false,
  className = '',
  disabledDates = [],
  disabledDaysOfWeek = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    value ? (typeof value === 'string' ? new Date(value) : value) : undefined
  );
  const pickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle clicks outside the picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update selectedDate when value prop changes
  useEffect(() => {
    if (value) {
      setSelectedDate(typeof value === 'string' ? new Date(value) : value);
    } else {
      setSelectedDate(undefined);
    }
  }, [value]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    onChange(date);
    setIsOpen(false);
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '';
    return format(date, 'MMM dd, yyyy');
  };

  // Disabled days matcher
  const disabledDaysMatcher = (day: Date) => {
    // Check if date is before minDate
    if (minDate && isBefore(startOfDay(day), startOfDay(minDate))) {
      return true;
    }
    
    // Check if date is after maxDate
    if (maxDate && isAfter(startOfDay(day), startOfDay(maxDate))) {
      return true;
    }

    // Check if date is in disabled dates
    if (disabledDates.some(d => startOfDay(d).getTime() === startOfDay(day).getTime())) {
      return true;
    }

    // Check if day of week is disabled
    if (disabledDaysOfWeek.includes(day.getDay())) {
      return true;
    }

    return false;
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div ref={pickerRef} className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={formatDate(selectedDate)}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            readOnly
            disabled={disabled}
            placeholder={placeholder}
            className={`
              w-full px-4 py-2.5 pr-10 
              bg-white border border-gray-300 rounded-lg
              focus:ring-2 focus:ring-primary-500 focus:border-primary-500
              disabled:bg-gray-100 disabled:cursor-not-allowed
              cursor-pointer transition-colors
              ${selectedDate ? 'text-gray-900' : 'text-gray-400'}
            `}
            required={required}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
        </div>

        {isOpen && !disabled && (
          <div className="absolute z-50 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-3">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={disabledDaysMatcher}
              showOutsideDays={false}
              className="rdp-custom"
              classNames={{
                months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
                month: 'space-y-4',
                caption: 'flex justify-center pt-1 relative items-center',
                caption_label: 'text-sm font-medium text-gray-900',
                nav: 'space-x-1 flex items-center',
                nav_button: 'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity',
                nav_button_previous: 'absolute left-1',
                nav_button_next: 'absolute right-1',
                table: 'w-full border-collapse space-y-1',
                head_row: 'flex',
                head_cell: 'text-gray-500 rounded-md w-9 font-normal text-[0.8rem]',
                row: 'flex w-full mt-2',
                cell: 'text-center text-sm p-0 relative [&:has([aria-selected])]:bg-primary-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
                day: 'h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100 rounded-md transition-colors',
                day_selected: 'bg-primary-600 text-white hover:bg-primary-700 hover:text-white focus:bg-primary-600 focus:text-white rounded-md',
                day_today: 'bg-gray-100 text-gray-900 font-semibold',
                day_outside: 'text-gray-400 opacity-50',
                day_disabled: 'text-gray-400 opacity-50 cursor-not-allowed',
                day_range_middle: 'aria-selected:bg-gray-100 aria-selected:text-gray-900',
                day_hidden: 'invisible',
              }}
              components={{
                IconLeft: () => <ChevronLeft className="h-4 w-4" />,
                IconRight: () => <ChevronRight className="h-4 w-4" />,
              }}
            />
            
            <div className="border-t border-gray-200 pt-3 mt-3 flex justify-between items-center">
              <button
                onClick={() => {
                  setSelectedDate(new Date());
                  onChange(new Date());
                  setIsOpen(false);
                }}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Today
              </button>
              <button
                onClick={() => {
                  setSelectedDate(undefined);
                  onChange(undefined);
                  setIsOpen(false);
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatePicker;