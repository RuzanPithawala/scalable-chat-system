import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../useSocket';
import type { User, Message } from '../types';

interface ChatProps {
  user: User;
  onLogout: () => void;
}

const AVAILABLE_ROOMS = [
  { id: 'general', name: 'General', description: 'General discussion' },
  { id: 'random', name: 'Random', description: 'Random chat' },
  { id: 'tech', name: 'Tech Talk', description: 'Technology discussions' },
  { id: 'gaming', name: 'Gaming', description: 'Gaming chat' },
];

export default function Chat({ user, onLogout }: ChatProps) {
  const [currentRoom, setCurrentRoom] = useState('general');
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [offset, setOffset] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalMessages, setTotalMessages] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const currentMessageIds = useRef<Set<string>>(new Set());

  const socket = useSocket();

  // Helper function to sort messages by sequence number
  const sortMessages = (msgs: Message[]): Message[] => {
    return [...msgs].sort((a, b) => a.sequence - b.sequence);
  };

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isLoadingMore) {
      scrollToBottom();
    }
  }, [messages, isLoadingMore]);

  // Setup socket listeners
  useEffect(() => {
    if (socket.isConnected) {
      socket.joinChat(currentRoom, user.id);

      // Chat history - backend now sends LATEST 50 messages
      socket.onChatHistory((history) => {
        console.log('📨 Received latest chat history:', history.length, 'messages');
        
        // Always add to existing messages (merge on reconnection)
        setMessages((prev) => {
          // Combine with existing
          const combined = [...prev, ...history];
          
          // Deduplicate by ID
          const seen = new Set<string>();
          const unique = combined.filter(msg => {
            if (seen.has(msg.id)) {
              return false;
            }
            seen.add(msg.id);
            return true;
          });
          
          // Sort and update ID tracker
          const sorted = sortMessages(unique);
          currentMessageIds.current = new Set(sorted.map(m => m.id));
          
          console.log('✅ Total messages after merge:', sorted.length);
          return sorted;
        });
        
        if (history.length > 0) {
          setOffset(history.length);
        }
      });

      // New messages arrive in real-time
      socket.onMessage((message) => {
        // Check if we already have this message
        if (currentMessageIds.current.has(message.id)) {
          console.log('⚠️ Duplicate message ignored:', message.id);
          return;
        }
        
        console.log('💬 New message:', message.content);
        currentMessageIds.current.add(message.id);
        
        setMessages((prev) => sortMessages([...prev, message]));
        setTotalMessages((prev) => prev + 1);
      });

      socket.onUserJoined((data) => {
        console.log('👋 User joined:', data.userId);
      });

      socket.onUserLeft((data) => {
        console.log('👋 User left:', data.userId);
      });

      return () => {
        socket.offMessage();
        socket.offChatHistory();
        socket.leaveChat(currentRoom, user.id);
      };
    }
  }, [socket.isConnected, currentRoom, user.id]);

  // Get total message count for the room
  useEffect(() => {
    const fetchMessageCount = async () => {
      try {
        const response = await fetch(
          `http://localhost:3002/messages/count?chatId=${currentRoom}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        const data = await response.json();
        setTotalMessages(data.count);
      } catch (error) {
        console.error('Failed to fetch message count:', error);
      }
    };

    if (socket.isConnected) {
      fetchMessageCount();
    }
  }, [currentRoom, socket.isConnected]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim()) return;

    socket.sendMessage(currentRoom, user.id, user.username, user.displayName, messageInput);
    setMessageInput('');
  };

  const handleRoomChange = (roomId: string) => {
    if (roomId === currentRoom) return;

    console.log('🔄 Changing room to', roomId);

    // Leave current room
    socket.leaveChat(currentRoom, user.id);

    // Clear everything for new room
    setMessages([]);
    setOffset(0);
    setTotalMessages(0);
    setIsLoadingMore(false);
    currentMessageIds.current.clear();
    setCurrentRoom(roomId);
  };

  // Load older messages via REST API
  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    console.log('🔄 Loading more messages. Current offset:', offset, 'Total:', totalMessages);
    
    try {
      const response = await fetch(
        `http://localhost:3002/messages?chatId=${currentRoom}&limit=50&offset=${offset}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to load messages');
      }
      
      const olderMessages: Message[] = await response.json();
      
      console.log('✅ Loaded', olderMessages.length, 'older messages');
      
      if (olderMessages.length === 0) {
        console.log('ℹ️ No more messages to load');
        setIsLoadingMore(false);
        return;
      }
      
      // Add older messages
      setMessages((prev) => {
        const combined = [...olderMessages, ...prev];
        
        // Deduplicate
        const seen = new Set<string>();
        const unique = combined.filter(msg => {
          if (seen.has(msg.id)) {
            return false;
          }
          seen.add(msg.id);
          return true;
        });
        
        const sorted = sortMessages(unique);
        currentMessageIds.current = new Set(sorted.map(m => m.id));
        return sorted;
      });
      
      setOffset((prev) => prev + olderMessages.length);
      setIsLoadingMore(false);
    } catch (error) {
      console.error('❌ Failed to load more messages:', error);
      setIsLoadingMore(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="chat-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h3>{user.displayName}</h3>
          <p>@{user.username}</p>
          <button onClick={onLogout}>Logout</button>
        </div>

        <div className="room-list">
          {AVAILABLE_ROOMS.map((room) => (
            <div
              key={room.id}
              className={`room-item ${currentRoom === room.id ? 'active' : ''}`}
              onClick={() => handleRoomChange(room.id)}
            >
              <h4>{room.name}</h4>
              <p>{room.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        <div className="chat-header">
          <h2>
            #{AVAILABLE_ROOMS.find((r) => r.id === currentRoom)?.name || currentRoom}
          </h2>
          <div className={`status ${socket.isConnected ? 'connected' : ''}`}>
            {socket.isConnected ? '● Connected' : '○ Disconnected'}
          </div>
        </div>

        <div className="messages-container" ref={messagesContainerRef}>
          {messages.length < totalMessages && !isLoadingMore && (
            <div className="load-more">
              <button onClick={handleLoadMore}>
                Load {Math.min(50, totalMessages - messages.length)} More Messages
              </button>
            </div>
          )}
          {isLoadingMore && (
            <div className="load-more">
              <button disabled>Loading...</button>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.userId === user.id ? 'own' : ''}`}
            >
              <div className="message-header">
                <span className="message-username">{message.displayName}</span>
                <span className="message-time">
                  {formatTime(message.createdAt)}
                </span>
              </div>
              <div className="message-content">{message.content}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="message-input-container">
          <form
            onSubmit={handleSendMessage}
            style={{ display: 'flex', gap: '12px', width: '100%' }}
          >
            <input
              type="text"
              placeholder={`Message #${
                AVAILABLE_ROOMS.find((r) => r.id === currentRoom)?.name ||
                currentRoom
              }`}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              disabled={!socket.isConnected}
            />
            <button
              type="submit"
              disabled={!socket.isConnected || !messageInput.trim()}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}