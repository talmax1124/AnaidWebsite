import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Mail, RefreshCw } from 'lucide-react';
import SpamAlert from '../components/SpamAlert';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [showSpamAlert, setShowSpamAlert] = useState(false);

  const token = searchParams.get('token');
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const verifyEmail = useCallback(async (verificationToken: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ token: verificationToken }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setVerificationStatus('success');
        setMessage(result.message || 'Your email has been verified successfully!');
        
        // Redirect to home page after a delay
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        if (result.message?.includes('expired')) {
          setVerificationStatus('expired');
        } else {
          setVerificationStatus('error');
        }
        setMessage(result.message || 'Failed to verify email.');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      setVerificationStatus('error');
      setMessage('An error occurred while verifying your email. Please try again.');
    }
  }, [API_BASE, navigate]);

  useEffect(() => {
    if (!token) {
      setVerificationStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    verifyEmail(token);
  }, [token, verifyEmail]);

  const handleResendVerification = async () => {
    // For resending, we'll need the user's email
    // This is a simplified version - in a real app, you might want to ask for the email
    const email = prompt('Please enter your email address to resend the verification:');
    
    if (!email) {
      return;
    }

    setResendLoading(true);
    setResendMessage('');

    try {
      const response = await fetch(`${API_BASE}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setResendMessage('Verification email sent successfully! Please check your inbox.');
        setShowSpamAlert(true);
      } else {
        setResendMessage(result.message || 'Failed to send verification email.');
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      setResendMessage('An error occurred while sending the verification email.');
    } finally {
      setResendLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'loading':
        return <Loader2 className="w-16 h-16 text-primary-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-600" />;
      case 'error':
      case 'expired':
        return <XCircle className="w-16 h-16 text-red-600" />;
      default:
        return <Mail className="w-16 h-16 text-gray-400" />;
    }
  };

  const getStatusTitle = () => {
    switch (verificationStatus) {
      case 'loading':
        return 'Verifying Your Email...';
      case 'success':
        return 'Email Verified Successfully!';
      case 'expired':
        return 'Verification Link Expired';
      case 'error':
        return 'Verification Failed';
      default:
        return 'Email Verification';
    }
  };

  const getStatusColor = () => {
    switch (verificationStatus) {
      case 'success':
        return 'text-green-600';
      case 'error':
      case 'expired':
        return 'text-red-600';
      default:
        return 'text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {showSpamAlert && <SpamAlert context="login" onClose={() => setShowSpamAlert(false)} />}
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          {/* Status Icon */}
          <div className="flex justify-center mb-6">
            {getStatusIcon()}
          </div>

          {/* Title */}
          <h1 className={`text-2xl font-bold mb-4 ${getStatusColor()}`}>
            {getStatusTitle()}
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            {message}
          </p>

          {/* Action Buttons */}
          <div className="space-y-4">
            {verificationStatus === 'success' && (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  You will be redirected to the homepage in a few seconds...
                </p>
                <Link
                  to="/"
                  className="btn-primary w-full"
                >
                  Continue to Homepage
                </Link>
              </div>
            )}

            {verificationStatus === 'expired' && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Your verification link has expired. You can request a new one below.
                </p>
                <button
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="btn-primary w-full flex items-center justify-center"
                >
                  {resendLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Resend Verification Email
                    </>
                  )}
                </button>
                {resendMessage && (
                  <p className={`text-sm ${resendMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                    {resendMessage}
                  </p>
                )}
              </div>
            )}

            {verificationStatus === 'error' && (
              <div className="space-y-3">
                <button
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="btn-secondary w-full flex items-center justify-center"
                >
                  {resendLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Resend Verification Email
                    </>
                  )}
                </button>
                {resendMessage && (
                  <p className={`text-sm ${resendMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                    {resendMessage}
                  </p>
                )}
                <Link
                  to="/login"
                  className="text-primary-600 hover:text-primary-700 text-sm block"
                >
                  Go to Login Page
                </Link>
              </div>
            )}

            {verificationStatus !== 'success' && (
              <Link
                to="/"
                className="text-gray-500 hover:text-gray-700 text-sm block mt-4"
              >
                ← Back to Homepage
              </Link>
            )}
          </div>
        </div>

        {/* Additional Help */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact us at{' '}
            <a
              href="mailto:support@esthetics-anna.com"
              className="text-primary-600 hover:text-primary-700"
            >
              support@esthetics-anna.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
