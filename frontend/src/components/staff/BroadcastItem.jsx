import React, { useState } from 'react';
import { 
  Mail, 
  MailOpen, 
  Archive, 
  Clock, 
  Building2, 
  Target,
  AlertCircle,
  CheckCircle,
  Star,
  Eye,
  ArchiveX,
  Reply
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { staffNotificationService } from '../../services/staffNotification';

const BroadcastItem = ({ notification, onUpdate, onReply }) => {
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const formattedNotification = staffNotificationService.formatNotificationData(notification);

  const handleMarkAsRead = async () => {
    if (notification.isRead) return;

    try {
      setLoading(true);
      await staffNotificationService.markAsRead(notification.id);
      toast.success('Notification marked as read');
      onUpdate && onUpdate();
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error('Failed to mark as read');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    try {
      setLoading(true);
      await staffNotificationService.archiveNotification(notification.id);
      toast.success('Notification archived');
      onUpdate && onUpdate();
    } catch (error) {
      console.error('Error archiving notification:', error);
      toast.error('Failed to archive notification');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExpand = () => {
    setExpanded(!expanded);
    if (!notification.isRead && !expanded) {
      handleMarkAsRead();
    }
  };

  const handleReply = () => {
    onReply && onReply(notification);
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <Star className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className={`bg-white rounded-lg border transition-all duration-200 hover:shadow-md ${
      !notification.isRead ? 'border-l-4 border-l-primary-500 bg-primary-50/30' : 'border-gray-200'
    } ${notification.isArchived ? 'opacity-75' : ''}`}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {/* Status Icon */}
            <div className="flex-shrink-0 mt-1">
              {notification.isArchived ? (
                <Archive className="h-5 w-5 text-gray-400" />
              ) : notification.isRead ? (
                <MailOpen className="h-5 w-5 text-gray-600" />
              ) : (
                <Mail className="h-5 w-5 text-primary-600" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Subject and Priority */}
              <div className="flex items-center space-x-2 mb-1">
                <h3 className={`text-sm font-medium truncate ${
                  !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                }`}>
                  {notification.subject}
                </h3>
                {getPriorityIcon(notification.priority)}
              </div>

              {/* Sender Info */}
              <div className="flex items-center space-x-2 text-xs text-gray-600 mb-2">
                <Building2 className="h-3 w-3" />
                <span>{notification.sender.salonName}</span>
                <span>•</span>
                <Target className="h-3 w-3" />
                <span>{notification.targetSkill}</span>
                <span>•</span>
                <Clock className="h-3 w-3" />
                <span>{formattedNotification.timeAgo}</span>
              </div>

              {/* Category and Priority Badges */}
              <div className="flex items-center space-x-2 mb-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                  formattedNotification.categoryColor
                }`}>
                  {staffNotificationService.getCategoryDisplayName(notification.category)}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                  formattedNotification.priorityColor
                }`}>
                  {staffNotificationService.getPriorityDisplayName(notification.priority)}
                </span>
              </div>

              {/* Message Preview */}
              <p className="text-sm text-gray-600 line-clamp-2">
                {notification.message}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={handleReply}
              className="p-2 text-primary-600 hover:text-primary-700 rounded-lg hover:bg-primary-50 transition-colors"
              title="Reply"
            >
              <Reply className="h-4 w-4" />
            </button>
            
            <button
              onClick={handleToggleExpand}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title={expanded ? 'Collapse' : 'Expand'}
            >
              <Eye className="h-4 w-4" />
            </button>
            
            {!notification.isArchived && (
              <button
                onClick={handleArchive}
                disabled={loading}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                title="Archive"
              >
                <ArchiveX className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="pt-4 space-y-4">
            {/* Full Message */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Message:</h4>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {notification.message}
                </p>
              </div>
            </div>

            {/* Sender Details */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">From:</h4>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center space-x-2 text-sm">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{notification.sender.salonName}</span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Sent by: {notification.sender.name}
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
              <div>
                <span className="font-medium">Sent:</span> {formattedNotification.formattedSentAt}
              </div>
              {notification.readAt && (
                <div>
                  <span className="font-medium">Read:</span> {formattedNotification.formattedReadAt}
                </div>
              )}
              <div>
                <span className="font-medium">Target Skill:</span> {notification.targetSkill}
              </div>
              <div>
                <span className="font-medium">Category:</span> {
                  staffNotificationService.getCategoryDisplayName(notification.category)
                }
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="flex items-center space-x-2">
                {!notification.isRead && (
                  <button
                    onClick={handleMarkAsRead}
                    disabled={loading}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
                  >
                    Mark as Read
                  </button>
                )}
                <button
                  onClick={handleReply}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Reply
                </button>
              </div>
              
              <div className="text-xs text-gray-500">
                ID: {notification.id.slice(-8)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BroadcastItem;