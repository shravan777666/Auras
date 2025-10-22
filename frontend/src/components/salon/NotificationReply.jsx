import React, { useState } from 'react';
import { Send, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { salonService } from '../../services/salon';

const NotificationReply = ({ notification, onReplySent, onCancel }) => {
  const [replyMessage, setReplyMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    // Get notification ID (could be _id or id)
    const notificationId = notification._id || notification.id;
    
    if (!notificationId) {
      toast.error('Cannot reply to this notification: missing ID');
      return;
    }

    try {
      setIsSending(true);
      
      // Send the reply using the salon service
      await salonService.sendReplyToStaff(notificationId, replyMessage);
      
      // Call the parent callback
      onReplySent && onReplySent(replyMessage);
      
      // Clear the message and hide the reply form
      setReplyMessage('');
      
      toast.success('Reply sent successfully!');
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-700">Reply to {notification.staff?.name || 'Staff Member'}</h4>
        <button
          onClick={onCancel}
          className="p-1 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      <textarea
        value={replyMessage}
        onChange={(e) => setReplyMessage(e.target.value)}
        placeholder="Type your reply here..."
        className="w-full h-24 p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
        disabled={isSending}
      />
      
      <div className="flex justify-end mt-3">
        <button
          onClick={handleSendReply}
          disabled={isSending || !replyMessage.trim()}
          className="flex items-center px-4 py-2 text-sm text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed transition-colors"
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
  );
};

export default NotificationReply;