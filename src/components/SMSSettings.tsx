import React, { useState, useEffect } from 'react';
import { MessageSquare, Save, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { BusinessSettings } from '../types';
import { getBusinessSettings, updateBusinessSettings } from '../services/firebaseService';
import { defaultSMSSettings, formatSMSMessage, validatePhoneNumber } from '../services/twilioService';

const SMSSettings: React.FC = () => {
  const [settings, setSettings] = useState<BusinessSettings['smsReminders']>(defaultSMSSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showTokens, setShowTokens] = useState(false);
  const [previewMessage, setPreviewMessage] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (settings?.messageTemplate) {
      // Sample booking for preview
      const sampleBooking = {
        clientName: 'Sarah Johnson',
        serviceName: 'Classic Lash Extension',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
        time: '14:30',
        duration: 90,
        price: 120
      };
      
      const preview = formatSMSMessage(settings.messageTemplate, sampleBooking);
      setPreviewMessage(preview);
    }
  }, [settings?.messageTemplate]);

  const loadSettings = async () => {
    try {
      const businessSettings = await getBusinessSettings();
      setSettings(businessSettings?.smsReminders || defaultSMSSettings);
    } catch (err) {
      console.error('Error loading SMS settings:', err);
      setError('Failed to load SMS settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    // Validate required fields if SMS is enabled
    if (settings.enabled) {
      if (!settings.twilioAccountSid || !settings.twilioAuthToken || !settings.twilioPhoneNumber) {
        setError('Please fill in all Twilio credentials when SMS reminders are enabled');
        return;
      }

      if (!validatePhoneNumber(settings.twilioPhoneNumber)) {
        setError('Please enter a valid Twilio phone number');
        return;
      }

      if (!settings.messageTemplate.trim()) {
        setError('Please enter a message template');
        return;
      }
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const businessSettings = await getBusinessSettings();
      
      // Handle case where business settings don't exist yet
      const currentSettings = businessSettings || {
        businessName: 'Lashed By Anna',
        email: '',
        phone: '',
        address: '',
        workingHours: {},
        cancellationHours: 48,
        timeSlotDuration: 30,
        bufferTime: 15
      };
      
      await updateBusinessSettings({
        ...currentSettings,
        smsReminders: settings
      });

      setSuccess('SMS settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving SMS settings:', err);
      setError('Failed to save SMS settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof NonNullable<BusinessSettings['smsReminders']>>(
    key: K,
    value: NonNullable<BusinessSettings['smsReminders']>[K]
  ) => {
    setSettings(prev => prev ? { ...prev, [key]: value } : { ...defaultSMSSettings, [key]: value });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <MessageSquare className="w-6 h-6 text-primary-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">SMS Reminder Settings</h3>
            <p className="text-sm text-gray-600">Configure automatic SMS reminders for appointments</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Enable/Disable SMS */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Enable SMS Reminders</h4>
            <p className="text-sm text-gray-600">Send automatic SMS reminders to customers</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings?.enabled || false}
              onChange={(e) => updateSetting('enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        {settings?.enabled && (
          <>
            {/* Reminder Timing */}
            <div>
              <label className="form-label">Reminder Time</label>
              <select
                value={settings.reminderHours}
                onChange={(e) => updateSetting('reminderHours', parseInt(e.target.value))}
                className="form-input"
              >
                <option value={1}>1 hour before</option>
                <option value={2}>2 hours before</option>
                <option value={4}>4 hours before</option>
                <option value={24}>24 hours before</option>
                <option value={48}>48 hours before</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                When to send the reminder before the appointment
              </p>
            </div>

            {/* Twilio Credentials */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Twilio Configuration</h4>
                <button
                  onClick={() => setShowTokens(!showTokens)}
                  className="text-sm text-gray-600 hover:text-gray-800 flex items-center space-x-1"
                >
                  {showTokens ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{showTokens ? 'Hide' : 'Show'} credentials</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Twilio Account SID</label>
                  <input
                    type={showTokens ? 'text' : 'password'}
                    value={settings.twilioAccountSid || ''}
                    onChange={(e) => updateSetting('twilioAccountSid', e.target.value)}
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="form-input font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="form-label">Twilio Auth Token</label>
                  <input
                    type={showTokens ? 'text' : 'password'}
                    value={settings.twilioAuthToken || ''}
                    onChange={(e) => updateSetting('twilioAuthToken', e.target.value)}
                    placeholder="Your auth token"
                    className="form-input font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Twilio Phone Number</label>
                <input
                  type="tel"
                  value={settings.twilioPhoneNumber || ''}
                  onChange={(e) => updateSetting('twilioPhoneNumber', e.target.value)}
                  placeholder="+1234567890"
                  className="form-input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your Twilio phone number (must include country code)
                </p>
              </div>
            </div>

            {/* Message Template */}
            <div>
              <label className="form-label">Message Template</label>
              <textarea
                value={settings.messageTemplate}
                onChange={(e) => updateSetting('messageTemplate', e.target.value)}
                rows={4}
                className="form-input"
                placeholder="Enter your SMS template..."
              />
              <div className="mt-2 text-xs text-gray-500">
                <p className="font-medium mb-1">Available variables:</p>
                <div className="grid grid-cols-2 gap-1">
                  <span>• {'{customerName}'} - Customer's name</span>
                  <span>• {'{serviceName}'} - Service name</span>
                  <span>• {'{date}'} - Appointment date</span>
                  <span>• {'{time}'} - Appointment time</span>
                  <span>• {'{duration}'} - Service duration</span>
                  <span>• {'{price}'} - Service price</span>
                </div>
              </div>
            </div>

            {/* Message Preview */}
            {previewMessage && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Message Preview</h4>
                <div className="bg-white border rounded-lg p-3">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{previewMessage}</p>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  Preview based on sample booking data
                </p>
              </div>
            )}
          </>
        )}

        {/* Setup Instructions */}
        {settings?.enabled && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-medium text-amber-900 mb-2">Setup Instructions</h4>
            <ol className="text-sm text-amber-800 space-y-1 list-decimal list-inside">
              <li>Create a Twilio account at <a href="https://twilio.com" target="_blank" rel="noopener noreferrer" className="underline">twilio.com</a></li>
              <li>Purchase a phone number from Twilio Console</li>
              <li>Copy your Account SID and Auth Token from the Console</li>
              <li>For production use, implement backend API endpoints for security</li>
            </ol>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SMSSettings;