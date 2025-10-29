import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Message } from './types';

const CHAT_SERVICE_URL = import.meta.env.VITE_CHAT_SERVICE_URL || 'http://localhost:3002';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    socketRef.current = io(CHAT_SERVICE_URL, {
      transports: ['websocket', 'polling'],
      auth: { token },
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to chat service');
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from chat service');
      setIsConnected(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const joinChat = (chatId: string, userId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join-chat', { chatId, userId });
    }
  };

  const leaveChat = (chatId: string, userId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leave-chat', { chatId, userId });
    }
  };

  const sendMessage = (chatId: string, userId: string, username: string, displayName: string, content: string) => {
    if (socketRef.current) {
      socketRef.current.emit('send-message', {
        chatId,
        userId,
        username,
        displayName,
        content,
      });
    }
  };

  const onMessage = (callback: (message: Message) => void) => {
    if (socketRef.current) {
      socketRef.current.on('message', callback);
    }
  };

  const onChatHistory = (callback: (messages: Message[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on('chat-history', callback);
    }
  };

  const onUserJoined = (callback: (data: { userId: string; chatId: string }) => void) => {
    if (socketRef.current) {
      socketRef.current.on('user-joined', callback);
    }
  };

  const onUserLeft = (callback: (data: { userId: string; chatId: string }) => void) => {
    if (socketRef.current) {
      socketRef.current.on('user-left', callback);
    }
  };

  const offMessage = () => {
    if (socketRef.current) {
      socketRef.current.off('message');
    }
  };

  const offChatHistory = () => {
    if (socketRef.current) {
      socketRef.current.off('chat-history');
    }
  };

  const loadMoreMessages = (chatId: string, offset: number) => {
    if (socketRef.current) {
      socketRef.current.emit('load-more-messages', { chatId, offset });
    }
  };

  return {
    isConnected,
    joinChat,
    leaveChat,
    sendMessage,
    onMessage,
    onChatHistory,
    onUserJoined,
    onUserLeft,
    offMessage,
    offChatHistory,
    loadMoreMessages,
  };
};