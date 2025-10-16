// src/components/ChatWindow.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { getMessageHistory, sendChatMessage } from '../services/api';
import { WS_BASE_URL } from '../utils/constants';
import '../styles/Chat.css';

const ChatWindow = () => {
  const { userInfo, setConnectionStatus } = useOutletContext();
  const [messages, setMessages] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastId, setLastId] = useState(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [socket, setSocket] = useState(null);
  const [socketId, setSocketId] = useState(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Check if user is demo user
  const isDemoUser = userInfo?.isDemo;

  // Demo message responses
  const getDemoResponse = (userMessage) => {
    const responses = [
      "This is a demo response! In the full version, you'd get AI-powered answers here.",
      "I'm a demo chatbot. With a real account, I could help you with much more!",
      "Thanks for trying the demo! Sign up to unlock the full AI chat experience.",
      "Demo mode: This is where intelligent responses would appear with a real account.",
      "Interesting question! In the full version, I'd provide a detailed, helpful response."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  // Initialize WebSocket only for non-demo users
  const initializeChat = useCallback(async () => {
    if (isDemoUser) {
      setConnectionStatus('connected');
      return;
    }

    if (!socket && !socketId) {
      setConnectionStatus('connecting');
      const wsId = userInfo?.email;
      setSocketId(wsId);
      
      const newSocket = new WebSocket(
        `${window.location.protocol === "https:" ? "wss" : "ws"}://${WS_BASE_URL}/initialize/${wsId}`
      );
      
      newSocket.onopen = () => {
        setConnectionStatus('connected');
      };

      newSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.IS_BOT === 'True' || data.is_bot === 'True') {
          const botMessage = {
            ID: `bot-${Date.now()}`,
            MESSAGE: data.response || data.message,
            IS_BOT: true,
            CREATED_AT: new Date().toISOString()
          };
          setMessages(prev => [...prev, botMessage]);
          setShouldScrollToBottom(true);
        }
      };
      
      newSocket.onclose = () => {
        setConnectionStatus('disconnected');
        setSocket(null);
        setSocketId(null);
      };

      newSocket.onerror = () => {
        setConnectionStatus('disconnected');
      };
      
      setSocket(newSocket);
    }
  }, [setConnectionStatus, socket, socketId, userInfo?.email, isDemoUser]);

  useEffect(() => {
    initializeChat();
  }, [initializeChat]);

  // Fetch message history only for non-demo users
  useEffect(() => {
    if (isDemoUser) {
      // Set demo welcome messages
      const demoMessages = [
        { 
          ID: 'demo-welcome-1',
          MESSAGE: "Welcome to the demo! Try sending a message to see how the chat works.", 
          IS_BOT: true,
          CREATED_AT: new Date().toISOString()
        },
        { 
          ID: 'demo-welcome-2',
          MESSAGE: "This is a preview of the chat interface. Sign up for full AI capabilities!", 
          IS_BOT: true,
          CREATED_AT: new Date().toISOString()
        }
      ];
      setMessages(demoMessages);
      setIsLoadingHistory(false);
      setShouldScrollToBottom(true);
      return;
    }

    if (!userInfo?.token) return;

    const fetchMessageHistory = async () => {
      try {
        const historyData = await getMessageHistory(userInfo.token);
        setMessages(historyData.messages);
        setLastId(historyData.lastId);
        setHasMoreMessages(historyData.messages.length > 0);
        setShouldScrollToBottom(true);
      } catch (error) {
        console.error('Failed to fetch message history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchMessageHistory();
  }, [userInfo?.token, isDemoUser]);

  // Scroll to bottom when new messages arrive or when shouldScrollToBottom is true
  useEffect(() => {
    if (shouldScrollToBottom) {
      scrollToBottom();
      setShouldScrollToBottom(false);
    }
  }, [messages, shouldScrollToBottom]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMoreMessages = useCallback(async () => {
    if (isDemoUser) return; // No message history for demo users
    
    if (isLoadingMore || !hasMoreMessages || !lastId) return;
    
    setIsLoadingMore(true);
    try {
      // Store current scroll position and height
      const messagesContainer = messagesContainerRef.current;
      const previousScrollHeight = messagesContainer.scrollHeight;
      const previousScrollTop = messagesContainer.scrollTop;
      
      const historyData = await getMessageHistory(userInfo.token, lastId);
      
      if (historyData.messages.length > 0) {
        setMessages(prev => [...historyData.messages, ...prev]);
        setLastId(historyData.lastId);
        
        // Wait for the DOM to update with new messages
        setTimeout(() => {
          const newScrollHeight = messagesContainer.scrollHeight;
          messagesContainer.scrollTop = newScrollHeight - previousScrollHeight + previousScrollTop;
        }, 0);
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [lastId, userInfo, isLoadingMore, hasMoreMessages, isDemoUser]);

  const handleScroll = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      
      // Only auto-scroll if user is near the bottom
      setShouldScrollToBottom(isAtBottom);
      
      // Load more messages when scrolled to top (only for non-demo users)
      if (scrollTop === 0 && hasMoreMessages && !isDemoUser) {
        loadMoreMessages();
      }
    }
  }, [loadMoreMessages, hasMoreMessages, isDemoUser]);

  const handleSendMessage = async (text) => {
    if (text.trim()) {
      try {
        setShouldScrollToBottom(true);
        
        // Add user message immediately
        const userMessage = { 
          ID: `user-${Date.now()}`,
          MESSAGE: text, 
          IS_BOT: false,
          CREATED_AT: new Date().toISOString()
        };
        setMessages(prev => [...prev, userMessage]);

        if (isDemoUser) {
          // Demo mode: Show typing indicator
          setIsTyping(true);
          
          // Simulate bot response after delay
          setTimeout(() => {
            setIsTyping(false);
            const botResponse = { 
              ID: `demo-bot-${Date.now()}`,
              MESSAGE: getDemoResponse(text), 
              IS_BOT: true,
              CREATED_AT: new Date().toISOString()
            };
            setMessages(prev => [...prev, botResponse]);
            setShouldScrollToBottom(true);
          }, 1500);
        } else {
          // Real user: Send via HTTP API and WebSocket
          const response = await sendChatMessage(userInfo.token, text);
          if (response.Result) {
            setMessages(prev => [...prev, response.Result]);
          }
          
          if (socket) {
            socket.onmessage = (event) => {
              const data = JSON.parse(event.data);
              console.log('WebSocket message:', data);
              if (data.IS_BOT || data.is_bot) {
                const botMessage = {
                  ID: `bot-${Date.now()}`,
                  MESSAGE: data.response || data.message,
                  IS_BOT: true,
                  CREATED_AT: new Date().toISOString()
                };
                setMessages(prev => [...prev, botMessage]);
                setShouldScrollToBottom(true);
              }
            };
          }
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        // Add error message for user feedback
        const errorMessage = { 
          ID: `error-${Date.now()}`,
          MESSAGE: isDemoUser 
            ? "Demo mode: Message processing simulation failed." 
            : "Failed to send message. Please try again.", 
          IS_BOT: true,
          CREATED_AT: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMessage]);
        setShouldScrollToBottom(true);
      }
    }
  };

  if (isLoadingHistory) {
    return <div className="chat-loading">Loading chat history...</div>;
  }

  return (
    <div className="chat-window">
      
      <div 
        className="messages-container" 
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {isLoadingMore && !isDemoUser && (
          <div className="loading-more">Loading earlier messages...</div>
        )}
        
        <MessageList messages={messages} currentUser={userInfo} isDemo={isDemoUser} />
        
        {isTyping && (
          <div className="typing-indicator">
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="message-input-container">
        <MessageInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};

export default ChatWindow;