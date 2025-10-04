import React, { useState, useEffect } from 'react';
import { X, Send, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { staffNotificationService } from '../../services/staffNotification';

const BroadcastReplyModal = ({ isOpen, onClose, notification, onSuccess }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMessage('');
    }
  }, [isOpen]);

  // Return null if modal is not open or notification is not provided
  if (!isOpen || !notification) return null;

  const quickReplies = [
    "I'm interested and would like to learn more.",
    "I am available for an interview this week.",
    "Thank you, but I am not available at this time."
  ];

  const handleQuickReply = (reply) => {
    setMessage(reply);
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    // Validate required data before sending
    if (!notification.sender || !notification.sender.salonId) {
      toast.error('Invalid notification data: Missing sender information');
      return;
    }

    if (!notification.id) {
      toast.error('Invalid notification data: Missing notification ID');
      return;
    }

    try {
      setIsSending(true);
      
      // Log the data being sent for debugging
      console.log('📤 Sending reply with data:', {
        message,
        recipient: notification.sender.salonId,
        originalMessageId: notification.id
      });

      const replyData = {
        message,
        recipient: notification.sender.salonId, // Send only the salonId, not the entire object
        originalMessageId: notification.id
      };
      
      await staffNotificationService.sendReply(replyData);
      onSuccess && onSuccess();
    } catch (error) {
      console.error('Error sending reply:', error);
      // Show more detailed error message if available
      const errorMessage = error.response?.data?.message || error.response?.data?.errors || error.message || 'Failed to send reply';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg transform transition-all duration-300 ease-in-out">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            <MessageSquare className="h-5 w-5 text-primary-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Reply to {notification.sender.salonName}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Original Message Snippet */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm font-medium text-gray-800 mb-2">Original: <span className="font-normal text-gray-600">{notification.subject}</span></p>
            <p className="text-xs text-gray-600 line-clamp-2">{notification.message}</p>
          </div>

          {/* Reply Form */}
          <div className="space-y-4">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow resize-none"
              disabled={isSending}
            />

            {/* Quick Replies */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Or use a quick reply:</p>
              <div className="flex flex-wrap gap-2">
                {quickReplies.map((reply, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickReply(reply)}
                    className="px-3 py-2 text-xs font-medium text-primary-700 bg-primary-100 border border-primary-200 rounded-full hover:bg-primary-200 hover:text-primary-800 transition-colors disabled:opacity-50"
                    disabled={isSending}
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <button
            onClick={onClose}
            disabled={isSending}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 mr-3 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={isSending}
            className="flex items-center px-6 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSending ? (
              <>
                <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-r-2 border-white rounded-full"></span>
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Reply
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BroadcastReplyModal;