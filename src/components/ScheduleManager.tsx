import React, { useState, useEffect } from 'react';
import { Calendar, Clock, X, Plus } from 'lucide-react';
import { 
  getBusinessSettings, 
  updateBusinessSettings, 
  createBooking,
  subscribeToBookings,
  deleteBooking
} from '../services/firebaseService';
import { BusinessSettings } from '../types';

interface BlackoutDate {
  date: string;
  reason: string;
  type: 'unavailable' | 'vacation' | 'holiday';
}

const ScheduleManager: React.FC = () => {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [blackoutDates, setBlackoutDates] = useState<BlackoutDate[]>([]);
  const [newBlackout, setNewBlackout] = useState<BlackoutDate>({
    date: '',
    reason: '',
    type: 'unavailable'
  });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadSettings();
    loadBlackoutDates();
  }, []);

  const loadSettings = async () => {
    try {
      let businessSettings = await getBusinessSettings();
      if (!businessSettings) {
        // Initialize default settings if none exist
        const defaultSettings = {
          businessName: 'Lashed By Anna',
          email: 'anaidmdiazplaza@gmail.com',
          phone: '321 316 9898',
          address: '',
          workingHours: {
            monday: { isOpen: true, startTime: '09:00', endTime: '21:00' },
            tuesday: { isOpen: true, startTime: '14:00', endTime: '18:00' },
            wednesday: { isOpen: true, startTime: '09:00', endTime: '21:00' },
            thursday: { isOpen: false, startTime: '09:00', endTime: '17:00' },
            friday: { isOpen: true, startTime: '14:00', endTime: '22:00' },
            saturday: { isOpen: true, startTime: '14:00', endTime: '22:00' },
            sunday: { isOpen: true, startTime: '14:00', endTime: '22:00' }
          },
          cancellationHours: 24,
          timeSlotDuration: 30,
          bufferTime: 15
        };
        
        await updateBusinessSettings(defaultSettings);
        businessSettings = defaultSettings;
      }
      setSettings(businessSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadBlackoutDates = () => {
    const unsubscribe = subscribeToBookings((bookings) => {
      const blockings = bookings
        .filter(booking => booking.clientName === 'BLOCKED')
        .map(booking => ({
          date: booking.date,
          reason: booking.serviceName,
          type: (booking.notes?.includes('vacation') ? 'vacation' : 
                 booking.notes?.includes('holiday') ? 'holiday' : 
                 'unavailable') as 'unavailable' | 'vacation' | 'holiday'
        }));
      setBlackoutDates(blockings);
    });

    return unsubscribe;
  };

  const updateWorkingHours = async (day: string, field: string, value: any) => {
    if (!settings) return;

    const updatedSettings = {
      ...settings,
      workingHours: {
        ...settings.workingHours,
        [day]: {
          ...settings.workingHours[day],
          [field]: value
        }
      }
    };

    try {
      await updateBusinessSettings({ workingHours: updatedSettings.workingHours });
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating working hours:', error);
    }
  };

  const addBlackoutDate = async () => {
    if (!newBlackout.date || !newBlackout.reason) return;

    // Create a "blocked" booking for this date to prevent customer bookings
    try {
      await createBooking({
        clientName: 'BLOCKED',
        clientEmail: 'admin@system.block',
        clientPhone: 'BLOCKED',
        serviceId: 'block',
        serviceName: newBlackout.reason,
        date: newBlackout.date,
        time: '09:00',
        duration: 720, // All day block (12 hours)
        price: 0,
        status: 'confirmed',
        paymentStatus: 'unpaid',
        notes: `Admin blocked: ${newBlackout.type} - ${newBlackout.reason}`
      });

      setBlackoutDates([...blackoutDates, newBlackout]);
      setNewBlackout({ date: '', reason: '', type: 'unavailable' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding blackout date:', error);
    }
  };

  const removeBlackoutDate = async (index: number) => {
    const dateToRemove = blackoutDates[index];
    if (!dateToRemove) return;

    try {
      const allBookings = await new Promise(resolve => {
        const unsubscribe = subscribeToBookings((bookings) => {
          unsubscribe();
          resolve(bookings);
        });
      });
      
      const blockingToDelete = (allBookings as any[]).find(booking => 
        booking.clientName === 'BLOCKED' && 
        booking.date === dateToRemove.date &&
        booking.serviceName === dateToRemove.reason
      );

      if (blockingToDelete) {
        await deleteBooking(blockingToDelete.id);
        // The real-time listener will update the state automatically
      }
    } catch (error) {
      console.error('Error removing blackout date:', error);
    }
  };

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  if (!settings) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Working Hours */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Regular Working Hours
        </h3>
        
        <div className="space-y-4">
          {days.map(({ key, label }) => {
            const daySettings = settings.workingHours[key];
            return (
              <div key={key} className="flex items-center space-x-4">
                <div className="w-24">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={daySettings?.isOpen || false}
                      onChange={(e) => updateWorkingHours(key, 'isOpen', e.target.checked)}
                      className="w-4 h-4 text-primary-600 rounded"
                    />
                    <span className="font-medium text-sm">{label}</span>
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="time"
                    value={daySettings?.startTime || '09:00'}
                    onChange={(e) => updateWorkingHours(key, 'startTime', e.target.value)}
                    disabled={!daySettings?.isOpen}
                    className="form-input w-32 text-sm"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="time"
                    value={daySettings?.endTime || '17:00'}
                    onChange={(e) => updateWorkingHours(key, 'endTime', e.target.value)}
                    disabled={!daySettings?.isOpen}
                    className="form-input w-32 text-sm"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Blackout Dates */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Unavailable Dates
          </h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Block Date</span>
          </button>
        </div>

        {showAddForm && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="form-label">Date</label>
                <input
                  type="date"
                  value={newBlackout.date}
                  onChange={(e) => setNewBlackout({...newBlackout, date: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Type</label>
                <select
                  value={newBlackout.type}
                  onChange={(e) => setNewBlackout({...newBlackout, type: e.target.value as any})}
                  className="form-input"
                >
                  <option value="unavailable">Unavailable</option>
                  <option value="vacation">Vacation</option>
                  <option value="holiday">Holiday</option>
                </select>
              </div>
              <div>
                <label className="form-label">Reason</label>
                <input
                  type="text"
                  value={newBlackout.reason}
                  onChange={(e) => setNewBlackout({...newBlackout, reason: e.target.value})}
                  placeholder="e.g., Personal day, Holiday"
                  className="form-input"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button onClick={addBlackoutDate} className="btn-primary">
                Block Date
              </button>
              <button 
                onClick={() => setShowAddForm(false)} 
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {blackoutDates.length > 0 ? (
          <div className="space-y-2">
            {blackoutDates.map((blackout, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                <div>
                  <div className="font-medium text-red-800">
                    {new Date(blackout.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="text-sm text-red-600">
                    {blackout.type.charAt(0).toUpperCase() + blackout.type.slice(1)}: {blackout.reason}
                  </div>
                </div>
                <button
                  onClick={() => removeBlackoutDate(index)}
                  className="p-1 text-red-600 hover:text-red-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No blocked dates. Click "Block Date" to add unavailable times.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleManager;