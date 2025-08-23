import React, { useState, useRef, useEffect } from 'react';
import { FaRobot, FaTimes, FaPaperPlane, FaComments } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import './Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    setMessages([
      {
        id: 1,
        text: "Hello! I'm your AI coding assistant. I can help you with:\n• Platform questions\n• Programming concepts\n• Code explanations\n• Algorithm guidance\n\nWhat would you like to know?",
        sender: 'bot',
        timestamp: new Date()
      }
    ]);
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const API_BASE = import.meta.env.VITE_API_URL;
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await axios.post(`${API_BASE}/ai/chatbot`, {
        message: userMessage.text,
        type: 'general'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const botMessage = {
          id: Date.now() + 1,
          text: response.data.data.response,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error(response.data.message || 'Failed to get response');
      }
    } catch (error) {
      
      let errorText = "I'm sorry, I'm having trouble responding right now. Please try again later.";
      let toastMessage = 'Failed to get chatbot response';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        switch (status) {
          case 401:
            errorText = "It looks like you need to log in to use the AI assistant. Please sign in and try again!\n\n💡 Tip: Make sure you're logged into your account.";
            toastMessage = 'Please log in to use the chatbot';
            break;
          case 403:
            errorText = "You don't have permission to use the AI assistant right now. Please contact support if this is an error.\n\n💡 Tip: This might be a temporary restriction.";
            toastMessage = 'Access denied';
            break;
          case 429:
            errorText = "You're sending messages too quickly! Please wait a moment before sending another message.\n\n💡 Tip: Try waiting 10-15 seconds between messages.";
            toastMessage = 'Rate limit exceeded - please slow down';
            break;
          case 500:
            errorText = "The AI service is experiencing technical difficulties. Our team has been notified and is working on it.\n\n💡 Tip: This is usually temporary. Try again in a few minutes.";
            toastMessage = 'Server error - please try again later';
            break;
          case 503:
            errorText = "The AI service is temporarily unavailable for maintenance. Please check back in a few minutes.\n\n💡 Tip: We're making improvements! Check back soon.";
            toastMessage = 'Service temporarily unavailable';
            break;
          default:
            if (data && data.message) {
              errorText = data.message;
              toastMessage = data.message;
            } else {
              errorText = "I'm experiencing some technical difficulties. Please try again in a moment.";
              toastMessage = 'Technical error occurred';
            }
        }
      } else if (error.request) {
        errorText = "I can't connect to the AI service right now. Please check your internet connection and try again.\n\n💡 Tip: Check if your internet is working and try refreshing the page.";
        toastMessage = 'Network error - check your connection';
      } else if (error.code === 'ECONNABORTED') {
        errorText = "The request is taking too long to process. Please try again with a shorter message.\n\n💡 Tip: Try breaking your question into smaller parts.";
        toastMessage = 'Request timeout - try a shorter message';
      } else if (error.message) {
        if (error.message.includes('Network Error')) {
          errorText = "I'm having trouble connecting to the server. Please check your internet connection.\n\n💡 Tip: Try refreshing the page or check your network settings.";
          toastMessage = 'Network connection issue';
        } else if (error.message.includes('timeout')) {
          errorText = "The AI is taking longer than expected to respond. Please try again.\n\n💡 Tip: The AI might be busy. Try again in a moment.";
          toastMessage = 'Response timeout';
        } else {
          errorText = `I encountered an issue: ${error.message}. Please try again.\n\n💡 Tip: If this keeps happening, try refreshing the page.`;
          toastMessage = 'Unexpected error occurred';
        }
      }
      
      const errorMessage = {
        id: Date.now() + 1,
        text: errorText,
        sender: 'bot',
        timestamp: new Date(),
        isError: true,
        canRetry: status !== 401 && status !== 403
      };
      setMessages(prev => [...prev, errorMessage]);
      setLastFailedMessage(userMessage.text);
      toast.error(toastMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRetry = () => {
    if (lastFailedMessage) {
      setInputMessage(lastFailedMessage);
      setLastFailedMessage(null);
      setMessages(prev => prev.filter(msg => !msg.isError));
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button 
        className={`chatbot-toggle ${isOpen ? 'hidden' : ''}`}
        onClick={toggleChatbot}
        title="Chat with AI Assistant"
      >
        <FaComments />
      </button>

      {/* Chatbot Modal */}
      {isOpen && (
        <div className="chatbot-overlay" onClick={toggleChatbot}>
          <div className="chatbot-container" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="chatbot-header">
              <div className="chatbot-title">
                <FaRobot className="chatbot-icon" />
                <span>AI Coding Assistant</span>
              </div>
              <button className="chatbot-close" onClick={toggleChatbot}>
                <FaTimes />
              </button>
            </div>

            {/* Messages */}
            <div className="chatbot-messages">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
                >
                  <div className={`message-content ${message.isError ? 'error-message' : ''}`}>
                    <div className="message-text">
                      {message.text.split('\n').map((line, index) => (
                        <React.Fragment key={index}>
                          {line}
                          {index < message.text.split('\n').length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </div>
                    <div className="message-time">
                      {formatTime(message.timestamp)}
                    </div>
                    {message.isError && message.canRetry && (
                      <div className="error-actions">
                        <button 
                          className="retry-button"
                          onClick={handleRetry}
                          title="Try sending the message again"
                        >
                          🔄 Try Again
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="message bot-message">
                  <div className="message-content">
                    <div className="message-text">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="chatbot-input">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                disabled={isLoading}
                rows="1"
              />
              <button 
                className="send-button"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
              >
                <FaPaperPlane />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot; 