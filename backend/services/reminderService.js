// Reminder Service stub
class ReminderService {
  async scheduleReminders(appointmentId) {
    console.log('Reminder Service: Reminders would be scheduled for appointment:', appointmentId);
    return Promise.resolve();
  }
}

module.exports = new ReminderService();