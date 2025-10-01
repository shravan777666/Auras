import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Bell } from 'lucide-react';
import { customerMessageService } from '../../services/customerMessage';

const MessageNotificationBadge = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnreadCount();
    
    // Set up polling for real-time updates every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await customerMessageService.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data.totalUnreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unread message count:', error);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
      </div>
    );
  }

  return (
    <Link
      to="/customer/messages"
      className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
      title={unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'Messages'}
    >
      <MessageCircle className="h-6 w-6" />
      {unreadCount > 0 && (
        <>
          {/* Notification badge */}
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[1.25rem] h-5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
          {/* Pulsing animation for new messages */}
          <span className="absolute -top-1 -right-1 inline-flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          </span>
        </>
      )}
    </Link>
  );
};

export default MessageNotificationBadge;
