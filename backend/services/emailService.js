const { default: Plunk } = require('@plunk/node');
const crypto = require('crypto');

// Initialize Plunk with API key
const plunkClient = new Plunk(process.env.PLUNK_API_KEY);

const emailService = {
  sendVerificationEmail: async (email, firstName, verificationToken) => {
    try {
      const verificationUrl = `${process.env.FRONTEND_VERIFY_URL}?token=${verificationToken}`;
      
      const emailData = {
        to: email,
        subject: 'Verify Your Email - Esthetics By Anna',
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2c3e50; margin: 0;">Esthetics By Anna</h1>
                <p style="color: #7f8c8d; margin: 5px 0 0 0;">Beauty & Wellness</p>
              </div>
              
              <h2 style="color: #2c3e50; margin-bottom: 20px;">Welcome, ${firstName || 'New Customer'}!</h2>
              
              <p style="color: #34495e; line-height: 1.6; margin-bottom: 20px;">
                Thank you for creating an account with us. To complete your registration and start booking appointments, please verify your email address by clicking the button below.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="display: inline-block; background-color: #e74c3c; color: white; text-decoration: none; padding: 15px 30px; border-radius: 5px; font-weight: bold; font-size: 16px;">
                  Verify Email Address
                </a>
              </div>
              
              <p style="color: #7f8c8d; font-size: 14px; margin-bottom: 20px;">
                If the button doesn't work, you can copy and paste this link into your browser:
                <br>
                <a href="${verificationUrl}" style="color: #3498db; word-break: break-all;">${verificationUrl}</a>
              </p>
              
              <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 30px 0;">
              
              <p style="color: #7f8c8d; font-size: 12px; text-align: center; margin: 0;">
                This verification link will expire in 24 hours. If you didn't create an account, please ignore this email.
              </p>
            </div>
          </div>
        `,
      };

      const result = await plunkClient.emails.send(emailData);
      console.log('Verification email sent successfully:', result);
      return { success: true, result };
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw error;
    }
  },

  sendWelcomeEmail: async (email, firstName) => {
    try {
      const emailData = {
        to: email,
        subject: 'Welcome to Esthetics By Anna!',
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2c3e50; margin: 0;">Esthetics By Anna</h1>
                <p style="color: #7f8c8d; margin: 5px 0 0 0;">Beauty & Wellness</p>
              </div>
              
              <h2 style="color: #2c3e50; margin-bottom: 20px;">Welcome to our community, ${firstName || 'Valued Customer'}!</h2>
              
              <p style="color: #34495e; line-height: 1.6; margin-bottom: 20px;">
                Your email has been successfully verified! We're thrilled to have you join our community of beauty enthusiasts.
              </p>
              
              <p style="color: #34495e; line-height: 1.6; margin-bottom: 20px;">
                Here's what you can do now:
              </p>
              
              <ul style="color: #34495e; line-height: 1.6; margin-bottom: 20px; padding-left: 20px;">
                <li>Browse our premium skincare and beauty products</li>
                <li>Book professional esthetic appointments</li>
                <li>Enjoy exclusive member discounts</li>
                <li>Track your orders and appointment history</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}" 
                   style="display: inline-block; background-color: #27ae60; color: white; text-decoration: none; padding: 15px 30px; border-radius: 5px; font-weight: bold; font-size: 16px;">
                  Start Shopping
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 30px 0;">
              
              <p style="color: #7f8c8d; font-size: 12px; text-align: center; margin: 0;">
                Thank you for choosing Esthetics By Anna for your beauty and wellness needs!
              </p>
            </div>
          </div>
        `,
      };

      const result = await plunkClient.emails.send(emailData);
      console.log('Welcome email sent successfully:', result);
      return { success: true, result };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  },

  sendPasswordResetEmail: async (email, firstName, resetToken) => {
    try {
      const resetUrl = `${process.env.FRONTEND_RESET_PASSWORD_URL}?token=${resetToken}`;
      
      const emailData = {
        to: email,
        subject: 'Password Reset Request - Esthetics By Anna',
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2c3e50; margin: 0;">Esthetics By Anna</h1>
                <p style="color: #7f8c8d; margin: 5px 0 0 0;">Beauty & Wellness</p>
              </div>
              
              <h2 style="color: #2c3e50; margin-bottom: 20px;">Password Reset Request</h2>
              
              <p style="color: #34495e; line-height: 1.6; margin-bottom: 20px;">
                Hello ${firstName || 'Valued Customer'},
              </p>
              
              <p style="color: #34495e; line-height: 1.6; margin-bottom: 20px;">
                We received a request to reset your password. If you made this request, click the button below to reset your password:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="display: inline-block; background-color: #f39c12; color: white; text-decoration: none; padding: 15px 30px; border-radius: 5px; font-weight: bold; font-size: 16px;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #7f8c8d; font-size: 14px; margin-bottom: 20px;">
                If the button doesn't work, you can copy and paste this link into your browser:
                <br>
                <a href="${resetUrl}" style="color: #3498db; word-break: break-all;">${resetUrl}</a>
              </p>
              
              <p style="color: #e74c3c; font-size: 14px; margin-bottom: 20px;">
                <strong>Security Notice:</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
              </p>
              
              <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 30px 0;">
              
              <p style="color: #7f8c8d; font-size: 12px; text-align: center; margin: 0;">
                This reset link will expire in 1 hour for security purposes.
              </p>
            </div>
          </div>
        `,
      };

      const result = await plunkClient.emails.send(emailData);
      console.log('Password reset email sent successfully:', result);
      return { success: true, result };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  },

  generateVerificationToken: () => {
    return crypto.randomBytes(32).toString('hex');
  },

  generateResetToken: () => {
    return crypto.randomBytes(32).toString('hex');
  }
};

module.exports = emailService;