import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Send, 
  Phone, 
  MapPin, 
  Clock,
  CheckCircle,
  Circle,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { customerMessageService } from '../../services/customerMessage';
import { toast } from 'react-hot-toast';

const CustomerChatInterface = ({ conversation, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [salon, setSalon] = useState(null);
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  useEffect(() => {
    if (conversation) {
      fetchMessages();
    }
  }, [conversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await customerMessageService.getConversationMessages(conversation.salonId);
      setMessages(response.data.messages || []);
      setSalon(response.data.salon);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const response = await customerMessageService.sendMessage(conversation.salonId, {
        content: messageContent,
        messageType: 'text'
      });

      // Add the new message to the list
      setMessages(prev => [...prev, response.data]);
      toast.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      // Restore the message content if sending failed
      setNewMessage(messageContent);
    } finally {
      setSending(false);
      messageInputRef.current?.focus();
    }
  };

  const handleRefresh = async () => {
    await fetchMessages();
    toast.success('Messages refreshed');
  };

  const formatTime = (timestamp) => {
    return customerMessageService.formatDetailedTime(timestamp);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  // Group messages by date
  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach(message => {
      const dateKey = new Date(message.createdAt).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                {conversation.salonName?.charAt(0)?.toUpperCase() || 'S'}
              </div>
              
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {conversation.salonName}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  {salon?.phone && (
                    <div className="flex items-center">
                      <Phone className="h-3 w-3 mr-1" />
                      {salon.phone}
                    </div>
                  )}
                  {salon?.address && (
                    <div className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {salon.address}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
              <p className="text-gray-500">Start the conversation by sending a message below</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(messageGroups).map(([dateKey, dayMessages]) => (
                <div key={dateKey}>
                  {/* Date Separator */}
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-gray-100 px-3 py-1 rounded-full">
                      <span className="text-xs font-medium text-gray-600">
                        {formatDate(dayMessages[0].createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Messages for this date */}
                  <div className="space-y-4">
                    {dayMessages.map((message) => (
                      <div
                        key={message._id}
                        className={`flex ${message.senderType === 'customer' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.senderType === 'customer'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white border border-gray-200 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <div className={`flex items-center justify-between mt-1 ${
                            message.senderType === 'customer' ? 'text-indigo-200' : 'text-gray-500'
                          }`}>
                            <span className="text-xs">{formatTime(message.createdAt)}</span>
                            {message.senderType === 'customer' && (
                              <div className="ml-2">
                                {message.isRead ? (
                                  <CheckCircle className="h-3 w-3" />
                                ) : (
                                  <Circle className="h-3 w-3" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white border-t">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <form onSubmit={handleSendMessage} className="flex space-x-3">
            <div className="flex-1">
              <input
                ref={messageInputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={sending}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomerChatInterface;
