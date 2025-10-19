import React, { useState, useEffect } from 'react';
import { X, Mail, Store, Phone } from 'lucide-react';

const ContactSalonModal = ({ isOpen, onClose, salon }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  // Initialize form when salon data changes
  useEffect(() => {
    if (salon && isOpen) {
      const lossAmount = Math.abs(salon.profit || 0);
      setSubject(`Important: Financial Performance Alert for ${salon.name} - Loss of ₹${lossAmount.toLocaleString()}`);
      
      const defaultMessage = `Dear ${salon.name} Team,

We've noticed that your salon has been experiencing financial challenges recently, with a net loss of ₹${lossAmount.toLocaleString()} in the selected period.

We're reaching out to understand if there are any operational challenges you're facing that we can help address. Our team is here to support you in improving your salon's performance.

Please feel free to reach out to discuss strategies that could help improve your profitability.

Best regards,
AuraCares Admin Team`;
      
      setMessage(defaultMessage);
    }
  }, [salon, isOpen]);

  if (!isOpen || !salon) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real implementation, this would send the email
    console.log('Sending message:', { salon, subject, message });
    alert(`Message would be sent to ${salon.name} with subject: ${subject}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Contact Salon</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center">
              <Store className="h-5 w-5 text-blue-500 mr-2" />
              <h4 className="font-medium text-blue-800">{salon.name}</h4>
            </div>
            {salon.contactEmail && (
              <div className="flex items-center mt-2 text-sm text-blue-700">
                <Mail className="h-4 w-4 mr-2" />
                <span>{salon.contactEmail}</span>
              </div>
            )}
            {salon.contactPhone && (
              <div className="flex items-center mt-1 text-sm text-blue-700">
                <Phone className="h-4 w-4 mr-2" />
                <span>{salon.contactPhone}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-6">
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                id="message"
                rows={8}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Message
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactSalonModal;