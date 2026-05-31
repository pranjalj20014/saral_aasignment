'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  username: string;
}

interface Message {
  id: string | number;
  text: string;
  sender: string;
  createdAt: string;
}

export default function ChatRoom() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [room, setRoom] = useState('general');
  const [inRoom, setInRoom] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Client-side execution
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (!storedToken || !storedUser) {
        router.push('/');
        return;
      }
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        router.push('/');
      }
    }
  }, [router]);

  useEffect(() => {
    if (inRoom && token && user) {
      const URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
      
      const newSocket = io(URL, {
        auth: { token },
        query: { room, username: user.username }
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setError('Failed to connect to chat server (Network/Server offline)');
      });

      newSocket.on('message', (incomingMessage: Message) => {
        setMessages((prev) => [...prev, incomingMessage]);
      });

      newSocket.on('chatHistory', (history: Message[]) => {
        setMessages(history);
      });

      newSocket.on('activeUsers', (users: string[]) => {
        setActiveUsers(users);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [inRoom, room, token, user]);

  useEffect(() => {
    // Scroll to bottom when messages get added
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!room.trim()) {
      setError('Room name cannot be empty');
      return;
    }
    setError('');
    setInRoom(true);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !socket) return;
    
    // Check for extreme length
    if (message.length > 500) {
        setError('Message is too long (limit 500 chars)');
        return;
    }

    try {
        socket.emit('sendMessage', { text: message });
        setMessage('');
        setError('');
    } catch (e) {
        setError('Failed to send message (Network issue)');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (socket) socket.disconnect();
    router.push('/');
  };

  if (!user) return <div className="p-10 text-center">Loading...</div>;

  if (!inRoom) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white rounded-lg shadow-md w-full max-w-sm p-6">
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Join a Room</h2>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Room Name</label>
              <input
                type="text"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="e.g. general"
              />
            </div>
            <button type="submit" className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition">
              Join
            </button>
            <button type="button" onClick={logout} className="w-full bg-red-400 hover:bg-red-600 text-white font-bold py-2 px-4 rounded mt-4 transition">
              Logout
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row h-screen bg-gray-50">
      {/* Sidebar for Users */}
      <div className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-4 border-b bg-blue-600 text-white">
          <h2 className="font-bold text-lg text-center break-words">Room: {room}</h2>
          <p className="text-sm mt-1 text-blue-100">Logged in as {user.username}</p>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          <h3 className="font-semibold text-gray-700 mb-2">Active Users ({activeUsers.length})</h3>
          <ul className="space-y-2">
             {activeUsers.map((u, i) => (
                <li key={i} className="flex items-center space-x-2 text-sm text-gray-600">
                    <span className="w-2 h-2 rounded-full bg-green-500 block"></span>
                    <span>{u}</span>
                </li>
             ))}
          </ul>
        </div>
        <div className="p-4 border-t">
          <button onClick={() => setInRoom(false)} className="w-full bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 rounded mb-2 transition">
            Leave Room
          </button>
          <button onClick={logout} className="w-full bg-red-500 hover:bg-red-700 text-white font-bold py-2 rounded transition">
            Logout
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <div className="md:hidden bg-blue-600 text-white p-4 flex justify-between items-center">
            <div>
                <h2 className="font-bold">Room: {room}</h2>
                <span className="text-xs">{activeUsers.length} online</span>
            </div>
            <button onClick={() => setInRoom(false)} className="text-white text-sm underline">Leave</button>
        </div>

        {error && (
            <div className="bg-red-500 text-white text-center py-2 px-4 shadow">
                 {error}
            </div>
        )}

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col space-y-4">
          {messages.map((msg, idx) => {
            const isMe = msg.sender === user.username;
            return (
              <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-xs text-gray-500 mb-1 px-1">{isMe ? 'You' : msg.sender} • {new Date(msg.createdAt).toLocaleTimeString()}</span>
                <div className={`px-4 py-2 rounded-lg max-w-xs lg:max-w-md break-words shadow-sm ${isMe ? 'bg-blue-500 text-white' : 'bg-white text-gray-800 border'}`}>
                  {msg.text}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-200">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type a message..."
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!message.trim()}
              className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition ${!message.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
