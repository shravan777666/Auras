import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  MessageCircle, 
  Clock, 
  Calendar, 
  User, 
  Heart, 
  AlertTriangle, 
  Plus, 
  Send, 
  Edit3, 
  Trash2,
  Save,
  Phone,
  Mail
} from 'lucide-react';
import { clientProfileService } from '../../services/clientProfile';
import { toast } from 'react-hot-toast';

const ClientProfileCard = ({ customerId, isOpen, onClose }) => {
  const [profile, setProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [editingNote, setEditingNote] = useState(null);
  const [newNote, setNewNote] = useState('');
  const [activeTab, setActiveTab] = useState('messaging');
  
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && customerId) {
      fetchClientProfile();
      fetchMessages();
    }
  }, [isOpen, customerId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchClientProfile = async () => {
    try {
      setLoading(true);
      const response = await clientProfileService.getClientProfile(customerId);
      setProfile(response.data.profile);
    } catch (error) {
      console.error('Error fetching client profile:', error);
      toast.error('Failed to load client profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      setMessageLoading(true);
      const response = await clientProfileService.getConversation(customerId);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setMessageLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await clientProfileService.sendMessage(customerId, {
        content: newMessage.trim(),
        messageType: 'text'
      });
      
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
      toast.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      await clientProfileService.addInternalNote(customerId, newNote.trim());
      setNewNote('');
      fetchClientProfile();
      toast.success('Note added successfully');
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {profile?.customerId?.name || 'Loading...'}
              </h2>
              <p className="text-sm text-gray-500">Client Profile & Messaging</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          {[
            { key: 'messaging', label: 'Messaging', icon: MessageCircle },
            { key: 'services', label: 'Service Info', icon: Calendar },
            { key: 'notes', label: 'Internal Notes', icon: Edit3 }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <>
              {/* Messaging Tab */}
              {activeTab === 'messaging' && (
                <div className="h-full flex flex-col">
                  {/* Messaging Status */}
                  <div className="p-4 bg-gray-50 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {profile?.customerId?.name?.split(' ')[0] || 'Client'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Messaging via {profile?.messagingStatus?.platform === 'text' ? 'Text' : 'App Chat'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Last message</p>
                        <p className="text-sm font-medium">
                          {profile?.messagingStatus?.lastMessageAt 
                            ? formatTime(profile.messagingStatus.lastMessageAt)
                            : 'No messages yet'
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messageLoading ? (
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message._id}
                          className={`flex ${message.senderType === 'salon' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.senderType === 'salon'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-200 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.senderType === 'salon' ? 'text-indigo-200' : 'text-gray-500'
                            }`}>
                              {formatTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t">
                    <div className="flex space-x-2">
                      <input
                        ref={messageInputRef}
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Service Info Tab */}
              {activeTab === 'services' && (
                <div className="p-6 space-y-6 overflow-y-auto">
                  {/* Last Visit */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Last Visit
                    </h3>
                    {profile?.serviceInfo?.lastVisit ? (
                      <div>
                        <p className="text-sm text-gray-600">
                          {formatDate(profile.serviceInfo.lastVisit.date)}: {profile.serviceInfo.lastVisit.service}
                        </p>
                        <p className="text-sm text-gray-500">
                          with {profile.serviceInfo.lastVisit.stylist}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No previous visits</p>
                    )}
                  </div>

                  {/* Upcoming Appointment */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Upcoming Appointment
                    </h3>
                    {profile?.serviceInfo?.upcomingAppointment ? (
                      <div>
                        <p className="text-sm text-gray-600">
                          {formatDate(profile.serviceInfo.upcomingAppointment.date)} @ {profile.serviceInfo.upcomingAppointment.time}
                        </p>
                        <p className="text-sm text-gray-500">
                          {profile.serviceInfo.upcomingAppointment.service}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No upcoming appointments</p>
                    )}
                  </div>

                  {/* Preferred Services */}
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Heart className="h-4 w-4 mr-2" />
                      Preferred Services
                    </h3>
                    {profile?.serviceInfo?.preferredServices?.length > 0 ? (
                      <div className="space-y-2">
                        {profile.serviceInfo.preferredServices.map((service, index) => (
                          <div key={index} className="text-sm">
                            <p className="font-medium text-gray-700">{service.serviceName}</p>
                            {service.notes && <p className="text-gray-500">{service.notes}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No preferred services recorded</p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {profile?.serviceInfo?.totalVisits || 0}
                      </p>
                      <p className="text-sm text-gray-500">Total Visits</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        ₹{profile?.serviceInfo?.totalSpent || 0}
                      </p>
                      <p className="text-sm text-gray-500">Total Spent</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Internal Notes Tab */}
              {activeTab === 'notes' && (
                <div className="p-6 space-y-6 overflow-y-auto">
                  {/* Allergies */}
                  <div className="bg-red-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                      Allergies & Sensitivities
                    </h3>
                    {profile?.internalNotes?.allergies?.length > 0 ? (
                      <div className="space-y-2">
                        {profile.internalNotes.allergies.map((allergy, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">{allergy}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No allergies recorded</p>
                    )}
                  </div>

                  {/* Personal Preferences */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                      <User className="h-4 w-4 mr-2 text-blue-500" />
                      Personal Preferences
                    </h3>
                    {profile?.internalNotes?.personalPreferences?.length > 0 ? (
                      <div className="space-y-2">
                        {profile.internalNotes.personalPreferences.map((pref, index) => (
                          <div key={index} className="text-sm">
                            <p className="font-medium text-gray-700">{pref.preference}</p>
                            {pref.notes && <p className="text-gray-500">{pref.notes}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No preferences recorded</p>
                    )}
                  </div>

                  {/* General Notes */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Edit3 className="h-4 w-4 mr-2" />
                      General Notes
                    </h3>
                    
                    {/* Add New Note */}
                    <div className="mb-4">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          placeholder="Add a new note..."
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <button
                          onClick={handleAddNote}
                          disabled={!newNote.trim()}
                          className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Existing Notes */}
                    {profile?.internalNotes?.generalNotes?.length > 0 ? (
                      <div className="space-y-3">
                        {profile.internalNotes.generalNotes.map((note) => (
                          <div key={note._id} className="bg-white rounded-lg p-3 border border-gray-200">
                            <p className="text-sm text-gray-700 mb-2">{note.note}</p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>
                                {formatDate(note.addedAt)} by {note.addedBy?.name || 'Unknown'}
                              </span>
                              <span className="px-2 py-1 bg-gray-100 rounded-full">
                                {note.category}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No notes yet</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientProfileCard;
