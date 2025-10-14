import { useState, useEffect, useRef, useCallback } from 'react';
import { WS_BASE_URL } from '../utils/constants';

export const useWebSocket = (wsId, onMessage) => {
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastError, setLastError] = useState(null);
  const isMountedRef = useRef(true);

  // Use useCallback for onMessage to prevent unnecessary re-renders
  const onMessageCallback = useCallback(onMessage, [onMessage]);

  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!wsId) {
      setLastError('No WebSocket ID provided');
      return;
    }

    const connectWebSocket = () => {
      if (!isMountedRef.current) return;
      if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        setLastError('Max reconnection attempts reached');
        return;
      }

      setConnectionStatus('connecting');
      setLastError(null);

      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const url = `${protocol}//${WS_BASE_URL}/initialize/${encodeURIComponent(wsId)}`;
        
        console.log('Attempting WebSocket connection to:', url);
        
        const websocket = new WebSocket(url);
        wsRef.current = websocket;

        websocket.onopen = () => {
          if (!isMountedRef.current) {
            websocket.close();
            return;
          }
          console.log('WebSocket connected successfully');
          setConnectionStatus('connected');
          reconnectAttemptsRef.current = 0;
        };

        websocket.onmessage = (event) => {
          if (!isMountedRef.current) return;
          try {
            const message = JSON.parse(event.data);
            onMessageCallback(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
            setLastError('Failed to parse message');
          }
        };

        websocket.onclose = (event) => {
          if (!isMountedRef.current) return;
          console.log('WebSocket closed - Code:', event.code, 'Reason:', event.reason, 'Clean:', event.wasClean);
          
          setConnectionStatus('disconnected');
          wsRef.current = null;
          
          // Don't reconnect if it was a normal closure or max attempts reached
          if (event.code === 1000 || reconnectAttemptsRef.current >= maxReconnectAttempts) {
            console.log('Not reconnecting - normal closure or max attempts');
            return;
          }

          // Exponential backoff with jitter
          const baseDelay = 3000;
          const maxDelay = 30000;
          const delay = Math.min(
            maxDelay, 
            baseDelay * Math.pow(2, reconnectAttemptsRef.current) + Math.random() * 1000
          );
          
          console.log(`Reconnecting in ${Math.round(delay)}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
          
          reconnectAttemptsRef.current += 1;
          reconnectRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              connectWebSocket();
            }
          }, delay);
        };

        websocket.onerror = (error) => {
          if (!isMountedRef.current) return;
          console.error('WebSocket error event:', error);
          setLastError('WebSocket connection error');
        };

      } catch (error) {
        if (!isMountedRef.current) return;
        console.error('Error creating WebSocket:', error);
        setConnectionStatus('disconnected');
        setLastError('Failed to create WebSocket connection');
      }
    };

    connectWebSocket();

    return () => {
      console.log('Cleaning up WebSocket');
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
      if (wsRef.current) {
        // Remove event listeners to prevent memory leaks
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        
        if (wsRef.current.readyState === WebSocket.OPEN || 
            wsRef.current.readyState === WebSocket.CONNECTING) {
          wsRef.current.close(1000, 'Component unmounting');
        }
        wsRef.current = null;
      }
    };
  }, [wsId, onMessageCallback, maxReconnectAttempts]);

  const sendMessage = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Error sending message:', error);
        setLastError('Failed to send message');
        return false;
      }
    } else {
      console.warn('WebSocket is not connected');
      setLastError('WebSocket is not connected');
      return false;
    }
  }, []);

  const disconnect = useCallback(() => {
    console.log('Manual disconnect requested');
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
    }
  }, []);

  return { sendMessage, disconnect, connectionStatus, lastError };
};