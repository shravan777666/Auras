import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, RotateCcw, Bot, User } from 'lucide-react';
import { chatbotService } from '../../services/chatbot';
import { toast } from 'react-hot-toast';

const ChatbotWindow = ({ onNewMessage }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize chat on mount
  useEffect(() => {
    initializeChat();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = async () => {
    try {
      setIsLoading(true);
      
      // Try to get existing conversation history
      try {
        const historyResponse = await chatbotService.getHistory();
        
        if (historyResponse.success && historyResponse.data.conversationHistory.length > 0) {
          // Load existing conversation
          setMessages(historyResponse.data.conversationHistory);
          setIsInitialized(true);
          return;
        }
      } catch (historyError) {
        console.warn('Could not load history, starting new conversation:', historyError);
      }
      
      // Start new conversation
      const response = await chatbotService.sendMessage(null, null, null);
      
      if (response.success && response.data) {
        setMessages([
          {
            role: 'assistant',
            content: response.data.message,
            options: response.data.options,
            data: response.data.data,
            timestamp: new Date()
          }
        ]);
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing chat:', error);
      console.error('Error details:', error.response?.data);
      
      // Check if it's an authentication error
      if (error.response?.status === 401) {
        toast.error('Please log in to use the chatbot');
      } else {
        toast.error('Failed to initialize chat. Please refresh the page.');
      }
      
      // Show fallback welcome message
      setMessages([
        {
          role: 'assistant',
          content: "Hi! I'm Aura, your salon assistant. How can I help you today?",
          options: [
            { label: 'Book an Appointment', action: 'start_booking' },
            { label: 'Browse Salons', action: 'browse_salons' },
            { label: 'View Offers', action: 'view_offers' }
          ],
          timestamp: new Date()
        }
      ]);
      setIsInitialized(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (message = null, action = null, data = null) => {
    const messageToSend = message || inputMessage.trim();
    
    if (!messageToSend && !action) return;
    
    try {
      // Add user message to UI
      if (messageToSend) {
        const userMessage = {
          role: 'user',
          content: messageToSend,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
      }
      
      // Show loading indicator
      setIsLoading(true);
      
      // Send message to backend
      const response = await chatbotService.sendMessage(messageToSend, action, data);
      
      if (response.success && response.data) {
        const botMessage = {
          role: 'assistant',
          content: response.data.message,
          options: response.data.options,
          data: response.data.data,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, botMessage]);
        
        // Notify parent if needed (for unread badge)
        if (onNewMessage) {
          onNewMessage();
        }

        // Auto-navigate if booking confirmed
        if (response.data.data?.bookingConfirmed) {
          setTimeout(() => {
            toast.success('Booking confirmed! Redirecting to your bookings...');
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
      
      // Add error message
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "Sorry, I'm having trouble processing your request. Please try again.",
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionClick = (option) => {
    // Special handling for Razorpay payment
    if (option.action === 'open_razorpay' && option.data) {
      handleRazorpayPayment(option.data);
    } else {
      handleSendMessage(option.label, option.action, option.data);
    }
  };

  const handleRazorpayPayment = async (paymentData) => {
    try {
      // Check if Razorpay is loaded
      if (!window.Razorpay) {
        toast.error('Payment gateway not loaded. Please refresh the page.');
        return;
      }

      const { razorpayKeyId, appointmentId, orderId, amount, currency } = paymentData;

      if (!razorpayKeyId || !orderId) {
        toast.error('Payment configuration error. Please contact support.');
        return;
      }

      const options = {
        key: razorpayKeyId,
        amount: amount * 100, // Convert to paise
        currency: currency || 'INR',
        name: 'AuraCares',
        description: 'Appointment Booking Payment',
        order_id: orderId,
        handler: async function (response) {
          try {
            // Import payment service dynamically
            const { paymentService } = await import('../../services/payment');
            
            // Verify payment
            const verifyResponse = await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              appointmentId: appointmentId
            });

            if (verifyResponse?.success) {
              toast.success('Payment successful! Appointment confirmed.');
              
              // Add success message to chat
              setMessages(prev => [
                ...prev,
                {
                  role: 'assistant',
                  content: '✅ **Payment Successful!**\n\nYour payment has been processed and your appointment is now confirmed. You will receive a confirmation email shortly.',
                  options: [
                    { label: 'View My Bookings', action: 'view_bookings' },
                    { label: 'Book Another', action: 'start_booking' }
                  ],
                  timestamp: new Date()
                }
              ]);
            } else {
              toast.error('Payment verification failed. Please contact support.');
              
              // Add error message to chat
              setMessages(prev => [
                ...prev,
                {
                  role: 'assistant',
                  content: '❌ **Payment Verification Failed**\n\nYour payment could not be verified. Please contact support with your payment ID: ' + response.razorpay_payment_id,
                  options: [
                    { label: 'Contact Support', action: 'help' },
                    { label: 'View My Bookings', action: 'view_bookings' }
                  ],
                  timestamp: new Date()
                }
              ]);
            }
          } catch (error) {
            console.error('Error verifying payment:', error);
            toast.error('Payment verification error. Please contact support.');
            
            // Add error message to chat
            setMessages(prev => [
              ...prev,
              {
                role: 'assistant',
                content: '❌ **Payment Verification Error**\n\nThere was an error verifying your payment. Please contact support.',
                options: [
                  { label: 'Contact Support', action: 'help' }
                ],
                timestamp: new Date()
              }
            ]);
          }
        },
        modal: {
          ondismiss: function () {
            // User closed the payment modal
            setMessages(prev => [
              ...prev,
              {
                role: 'assistant',
                content: '💳 **Payment Cancelled**\n\nYou cancelled the payment. Your booking is still saved. You can complete the payment later from "My Bookings".',
                options: [
                  { label: 'Try Payment Again', action: 'initiate_payment', data: paymentData },
                  { label: 'View My Bookings', action: 'view_bookings' },
                  { label: 'Book Another', action: 'start_booking' }
                ],
                timestamp: new Date()
              }
            ]);
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: ''
        },
        theme: {
          color: '#9333ea' // Purple color matching the theme
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Error initiating Razorpay payment:', error);
      toast.error('Failed to initiate payment. Please try again.');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetSession = async () => {
    try {
      setIsLoading(true);
      await chatbotService.resetSession();
      setMessages([]);
      await initializeChat();
      toast.success('Chat session reset');
    } catch (error) {
      console.error('Error resetting session:', error);
      toast.error('Failed to reset chat');
    } finally {
      setIsLoading(false);
    }
  };

  const formatMessage = (content) => {
    // Convert markdown-style bold text
    return content
      .split('**')
      .map((part, index) =>
        index % 2 === 0 ? (
          part
        ) : (
          <strong key={index} className="font-bold">
            {part}
          </strong>
        )
      );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {!isInitialized ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`flex items-start space-x-2 max-w-[85%] ${
                    message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="w-5 h-5" />
                    ) : (
                      <Bot className="w-5 h-5" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-800 shadow-sm'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap break-words">
                      {formatMessage(message.content)}
                    </div>

                    {/* Options Buttons */}
                    {message.options && message.options.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.options.map((option, optIndex) => (
                          <button
                            key={optIndex}
                            onClick={() => handleOptionClick(option)}
                            disabled={isLoading}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                              message.role === 'user'
                                ? 'bg-purple-700 hover:bg-purple-800 text-white'
                                : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
                            } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <div className="font-medium">{option.label}</div>
                            {option.sublabel && (
                              <div className="text-xs opacity-80 mt-1">{option.sublabel}</div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Timestamp */}
                    <div
                      className={`text-xs mt-1 ${
                        message.role === 'user' ? 'text-purple-200' : 'text-gray-400'
                      }`}
                    >
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="flex items-center space-x-2 bg-white rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                  <span className="text-sm text-gray-500">Aura is typing...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t bg-white p-4">
        <div className="flex items-center space-x-2">
          {/* Reset Button */}
          <button
            onClick={handleResetSession}
            disabled={isLoading}
            className="flex-shrink-0 p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Reset conversation"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />

          {/* Send Button */}
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputMessage.trim()}
            className="flex-shrink-0 p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mt-3">
          <button
            onClick={() => handleSendMessage(null, 'start_booking', null)}
            disabled={isLoading}
            className="text-xs px-3 py-1 bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 transition-colors disabled:opacity-50"
          >
            📅 Book Now
          </button>
          <button
            onClick={() => handleSendMessage(null, 'browse_salons', null)}
            disabled={isLoading}
            className="text-xs px-3 py-1 bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 transition-colors disabled:opacity-50"
          >
            🏪 Browse Salons
          </button>
          <button
            onClick={() => handleSendMessage(null, 'view_offers', null)}
            disabled={isLoading}
            className="text-xs px-3 py-1 bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 transition-colors disabled:opacity-50"
          >
            🎁 View Offers
          </button>
        </div>
      </div>

      {/* Custom Animation Styles */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .delay-100 {
          animation-delay: 0.1s;
        }

        .delay-200 {
          animation-delay: 0.2s;
        }
      `}</style>
    </div>
  );
};

export default ChatbotWindow;
