import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Search, 
  Bell, 
  Clock, 
  ChevronRight,
  Inbox,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { customerMessageService } from '../../services/customerMessage';
import { toast } from 'react-hot-toast';
import CustomerChatInterface from './CustomerChatInterface';

const CustomerMessages = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    fetchConversations();
    fetchUnreadCount();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await customerMessageService.getConversations();
      setConversations(response.data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await customerMessageService.getUnreadCount();
      setUnreadCount(response.data.totalUnreadCount || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchConversations();
      await fetchUnreadCount();
      toast.success('Messages refreshed');
    } catch (error) {
      toast.error('Failed to refresh messages');
    } finally {
      setRefreshing(false);
    }
  };

  const handleConversationClick = (conversation) => {
    setSelectedConversation(conversation);
    setShowChat(true);
  };

  const handleBackToList = () => {
    setShowChat(false);
    setSelectedConversation(null);
    // Refresh conversations to update unread counts
    fetchConversations();
    fetchUnreadCount();
  };

  const filteredConversations = conversations.filter(conversation =>
    conversation.salonName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (showChat && selectedConversation) {
    return (
      <CustomerChatInterface
        conversation={selectedConversation}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
                <p className="text-sm text-gray-500">
                  {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                </p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search salons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {/* Conversations List */}
            {filteredConversations.length === 0 ? (
              <div className="text-center py-12">
                <Inbox className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No conversations found' : 'No messages yet'}
                </h3>
                <p className="text-gray-500">
                  {searchTerm 
                    ? 'Try adjusting your search terms'
                    : 'When salons send you messages, they\'ll appear here'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.salonId}
                    onClick={() => handleConversationClick(conversation)}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        {/* Salon Avatar */}
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {conversation.salonName?.charAt(0)?.toUpperCase() || 'S'}
                        </div>

                        {/* Conversation Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {conversation.salonName}
                            </h3>
                            <div className="flex items-center space-x-2">
                              {conversation.unreadCount > 0 && (
                                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                                  {conversation.unreadCount}
                                </span>
                              )}
                              <span className="text-xs text-gray-500 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {customerMessageService.formatMessageTime(conversation.lastMessage?.createdAt)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <p className={`text-sm truncate ${
                              conversation.unreadCount > 0 ? 'font-medium text-gray-900' : 'text-gray-600'
                            }`}>
                              {conversation.lastMessage?.senderType === 'customer' && (
                                <span className="text-indigo-600 mr-1">You: </span>
                              )}
                              {conversation.lastMessage?.content || 'No messages yet'}
                            </p>
                            <ChevronRight className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0" />
                          </div>

                          {/* Salon Info */}
                          {conversation.salonAddress && (
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              📍 {conversation.salonAddress}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Quick Stats */}
        {conversations.length > 0 && (
          <div className="mt-8 bg-white rounded-lg border border-gray-200 p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">{conversations.length}</p>
                <p className="text-sm text-gray-500">Total Conversations</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{unreadCount}</p>
                <p className="text-sm text-gray-500">Unread Messages</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {conversations.reduce((sum, conv) => sum + conv.totalMessages, 0)}
                </p>
                <p className="text-sm text-gray-500">Total Messages</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerMessages;
