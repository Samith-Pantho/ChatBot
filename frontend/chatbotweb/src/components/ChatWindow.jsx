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
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const initializeChat = useCallback(async () => {
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
        if (data.is_bot === 'True') {
          setMessages(prev => [...prev, { text: data.response, isBot: true }]);
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
  }, [setConnectionStatus, socket, socketId, userInfo?.email]);

  useEffect(() => {
    initializeChat();
  }, [initializeChat]);

  useEffect(() => {
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
  }, [userInfo?.token]);

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
  }, [lastId, userInfo, isLoadingMore, hasMoreMessages]);

  const handleScroll = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      
      // Only auto-scroll if user is near the bottom
      setShouldScrollToBottom(isAtBottom);
      
      // Load more messages when scrolled to top
      if (scrollTop === 0 && hasMoreMessages) {
        loadMoreMessages();
      }
    }
  }, [loadMoreMessages, hasMoreMessages]);

  const handleSendMessage = async (text) => {
    if (text.trim()) {
      try {
        setShouldScrollToBottom(true);
        // Send message via HTTP API
        const response = await sendChatMessage(userInfo.token, text);
        setMessages(prev => [...prev, response.Result]);
        
        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.log(data);
          if (data.is_bot) {
            setMessages(prev => [...prev, data]);
            setShouldScrollToBottom(true);
          }
        };
        
        socket.onclose = () => {
          setConnectionStatus('disconnected');
          setSocket(null);
          setSocketId(null);
        };

        socket.onerror = () => {
          setConnectionStatus('disconnected');
        };

      } catch (error) {
        console.error('Failed to send message:', error);
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
        {isLoadingMore && (
          <div className="loading-more">Loading earlier messages...</div>
        )}
        <MessageList messages={messages} currentUser={userInfo} />
        <div ref={messagesEndRef} />
      </div>
      
      <div className="message-input-container">
        <MessageInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};

export default ChatWindow;