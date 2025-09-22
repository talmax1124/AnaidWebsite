import React from 'react';
import { CreditCard, DollarSign, Smartphone, Building, QrCode, AlertTriangle } from 'lucide-react';

const PaymentOptionsPage: React.FC = () => {
  const paymentMethods = [
    {
      name: 'Cash',
      icon: <DollarSign className="w-8 h-8" />,
      description: 'Pay with cash at your appointment',
      details: 'Exact amount preferred. We provide receipts for all cash payments.',
      color: 'bg-green-50 border-green-200 text-green-800'
    },
    {
      name: 'Venmo',
      icon: <Smartphone className="w-8 h-8" />,
      description: 'Send payment via Venmo',
      details: '@AnaidLashes - Please include your name and appointment date in the memo.',
      color: 'bg-blue-50 border-blue-200 text-blue-800'
    },
    {
      name: 'Zelle',
      icon: <Building className="w-8 h-8" />,
      description: 'Quick bank transfer with Zelle',
      details: 'anaidmdiazplaza@gmail.com - Available through most banking apps.',
      color: 'bg-purple-50 border-purple-200 text-purple-800'
    },
    {
      name: 'Credit/Debit Card',
      icon: <CreditCard className="w-8 h-8" />,
      description: 'Pay with card at appointment',
      details: 'We accept Visa, Mastercard, American Express, and Discover.',
      color: 'bg-indigo-50 border-indigo-200 text-indigo-800'
    },
    {
      name: 'Apple Pay / Google Pay',
      icon: <QrCode className="w-8 h-8" />,
      description: 'Contactless payment with your phone',
      details: 'Quick and secure payment using your mobile wallet.',
      color: 'bg-gray-50 border-gray-200 text-gray-800'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Payment Options</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We offer multiple convenient payment methods for your lash appointments
            </p>
          </div>

          {/* Payment Methods Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {paymentMethods.map((method, index) => (
              <div key={index} className={`card border-2 ${method.color}`}>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {method.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{method.name}</h3>
                    <p className="text-base mb-3">{method.description}</p>
                    <p className="text-sm opacity-75">{method.details}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Payment Policies */}
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Policies</h2>
            
            <div className="space-y-6">
              {/* Payment Timing */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">When to Pay</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>Payment is due at the time of service</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>Digital payments (Venmo/Zelle) can be sent before or after your appointment</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>Cash and card payments are processed at your appointment</span>
                  </li>
                </ul>
              </div>

              {/* Cancellation Policy */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-amber-900 mb-2">Cancellation Policy</h3>
                    <ul className="space-y-1 text-amber-800">
                      <li>• Cancellations must be made at least 48 hours in advance</li>
                      <li>• Late cancellations (less than 48 hours) incur a $35 fee</li>
                      <li>• No-shows are subject to the full service charge</li>
                      <li>• Cancellation fees must be paid before rebooking</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Information</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>All payments are processed securely</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Receipts are provided for all transactions</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Tips are always appreciated but never required</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Payment plans available for premium services - ask during consultation</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="card text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Questions About Payment?</h3>
            <p className="text-gray-600 mb-4">
              If you have any questions about payment options or policies, don't hesitate to reach out!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="tel:3213169898" 
                className="btn-primary inline-flex items-center justify-center"
              >
                <span>Call (321) 316-9898</span>
              </a>
              <a 
                href="mailto:anaidmdiazplaza@gmail.com" 
                className="btn-secondary inline-flex items-center justify-center"
              >
                <span>Email Us</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentOptionsPage;