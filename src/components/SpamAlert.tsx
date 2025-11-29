import React from 'react';
import { Mail, AlertTriangle } from 'lucide-react';

interface SpamAlertProps {
  context: 'booking' | 'login' | 'general';
  show?: boolean;
  onClose?: () => void;
}

const SpamAlert: React.FC<SpamAlertProps> = ({ context, show = true, onClose }) => {
  if (!show) return null;

  const getContextMessage = () => {
    switch (context) {
      case 'booking':
        return {
          title: "Check Your Email & Spam Folder",
          message: "We've sent you a booking confirmation email. If you don't see it in your inbox within a few minutes, please check your spam/junk folder.",
          actionText: "Look for emails from Esthetics By Anna or noreply@estheticsbyanna.com"
        };
      case 'login':
        return {
          title: "Email Verification Sent",
          message: "We've sent you a login verification email. If you don't see it in your inbox, please check your spam/junk folder.",
          actionText: "Add noreply@estheticsbyanna.com to your contacts to ensure future emails reach your inbox"
        };
      case 'general':
        return {
          title: "Email Delivery Notice",
          message: "Important emails from us might end up in your spam folder. Please check there if you don't see our emails.",
          actionText: "Add us to your safe senders list"
        };
    }
  };

  const { title, message, actionText } = getContextMessage();

  return (
    <div className="bg-primary-50 border border-primary-200 rounded-xl p-6 mb-6 shadow-sm">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <Mail className="w-5 h-5 text-primary-600 mt-0.5" />
        </div>
        <div className="flex-grow">
          <h4 className="font-semibold text-neutral-900 mb-2 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2 text-secondary-500" />
            {title}
          </h4>
          <p className="text-neutral-700 text-sm mb-3 leading-relaxed">
            {message}
          </p>
          <div className="bg-white border border-primary-200 rounded-lg p-4 text-sm text-neutral-800">
            <strong className="text-primary-700">💡 Tip:</strong> {actionText}
          </div>
          <div className="mt-4 text-sm text-neutral-700">
            <strong className="text-neutral-900">Steps to prevent this in the future:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1 ml-2 text-neutral-600">
              <li>Add <code className="bg-neutral-100 px-2 py-1 rounded text-primary-600 font-mono text-xs">noreply@estheticsbyanna.com</code> to your contacts</li>
              <li>Mark our emails as "Not Spam" if they go to spam</li>
              <li>Check your email provider's spam settings</li>
            </ol>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SpamAlert;