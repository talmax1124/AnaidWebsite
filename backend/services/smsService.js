// SMS Service stub
class SMSService {
  async sendBookingConfirmation(phone, data) {
    console.log('SMS Service: Booking confirmation would be sent to:', phone, data);
    return Promise.resolve();
  }
}

module.exports = new SMSService();