import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import ChatbotWindow from './ChatbotWindow';

const ChatbotButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnreadMessage, setHasUnreadMessage] = useState(false);

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasUnreadMessage(false);
    }
  };

  // Handle new messages when chat is closed
  const handleNewMessage = () => {
    if (!isOpen) {
      setHasUnreadMessage(true);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            onClick={toggleChatbot}
            className="relative bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full p-4 shadow-2xl transform transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-purple-400 animate-bounce-subtle"
            aria-label="Open Aura Chatbot"
          >
            <MessageCircle className="w-7 h-7" />
            
            {/* Unread Message Badge */}
            {hasUnreadMessage && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                !
              </span>
            )}
            
            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
              Talk to Aura
            </div>
          </button>
        )}

        {/* Chat Window */}
        {isOpen && (
          <div className="fixed bottom-6 right-6 w-[95vw] sm:w-96 h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden transform transition-all duration-300 animate-slide-up">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-purple-600" />
                  </div>
                  {/* Online Indicator */}
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></span>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Talk to Aura</h3>
                  <p className="text-xs text-purple-100">Your Salon Assistant</p>
                </div>
              </div>
              <button
                onClick={toggleChatbot}
                className="hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Window Component */}
            <ChatbotWindow onNewMessage={handleNewMessage} />
          </div>
        )}
      </div>

      {/* Custom Animation Styles */}
      <style jsx>{`
        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default ChatbotButton;
