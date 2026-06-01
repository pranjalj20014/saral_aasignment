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

const ROOMS = [
  'XYZ college ECE dpt.',
  'XYZ college CSE dpt.',
  'XYZ college Civil dpt.',
  'XYZ college Mech dpt.',
];

export default function ChatRoom() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [room, setRoom] = useState(ROOMS[0]);
  const [inRoom, setInRoom] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
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
      const backendUrl = typeof window !== 'undefined' 
        ? window.location.origin.replace(/:3000/, ':1337').replace(/:3001/, ':1337')
        : 'http://localhost:1337';
      
      const newSocket = io(backendUrl, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        transports: ['websocket', 'polling'],
        auth: { token },
        query: { room, username: user.username },
      });

      newSocket.on('connect', () => {
        console.log('Socket connected successfully');
        setError('');
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setError('Failed to connect to chat server (Network/Server offline)');
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!room.trim()) {
      setError('Please select a room');
      return;
    }
    setError('');
    setInRoom(true);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !socket) return;
    
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

  if (!user) return <div className="min-h-screen flex items-center justify-center text-slate-300">Loading...</div>;

  if (!inRoom) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 animate-fade-in relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]" />
        
        <div className="glass rounded-2xl w-full max-w-sm p-8 relative z-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gradient">Select Department Room</h2>
            <p className="text-slate-400 text-sm mt-2">Join a discussion forum</p>
          </div>

          {error && <div className="text-red-400 text-sm mb-4 text-center">{error}</div>}
          
          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <label className="block text-slate-300 text-xs font-semibold mb-2 uppercase tracking-wider">Department</label>
              <select
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer appearance-none"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
              >
                {ROOMS.map(r => <option key={r} value={r} className="bg-slate-800 text-slate-200">{r}</option>)}
              </select>
            </div>
            
            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all">
              Join Room
            </button>
            <button type="button" onClick={logout} className="w-full bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-medium py-3 px-4 rounded-xl transition-all">
              Logout
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Sidebar */}
      <div className="w-72 glass-panel border-r border-slate-800/50 hidden md:flex flex-col z-10">
        <div className="p-6 border-b border-slate-800/50">
          <h2 className="font-bold text-lg text-white break-words">{room}</h2>
          <div className="flex items-center mt-2 space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <p className="text-sm text-slate-400 font-medium">{user.username}</p>
          </div>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Online Now</h3>
            <span className="bg-blue-500/20 text-blue-400 text-xs py-0.5 px-2 rounded-full font-medium">
              {activeUsers.length}
            </span>
          </div>
          <ul className="space-y-3">
             {activeUsers.map((u, i) => (
                <li key={i} className="flex items-center space-x-3 text-sm text-slate-300">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="font-medium">{u}</span>
                </li>
             ))}
          </ul>
        </div>
        
        <div className="p-4 border-t border-slate-800/50 space-y-2">
          <button onClick={() => setInRoom(false)} className="w-full bg-slate-800/50 hover:bg-slate-700 text-slate-300 font-medium py-2.5 rounded-lg transition-colors text-sm">
            Switch Room
          </button>
          <button onClick={logout} className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium py-2.5 rounded-lg transition-colors text-sm">
            Logout
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col z-10 relative">
        {/* Header */}
        <div className="glass-panel border-b border-slate-800/50 p-4 px-6 flex justify-between items-center shrink-0 h-16">
            <div className="flex items-center space-x-3">
              <span className="md:hidden text-lg font-bold">{room}</span>
              <span className="hidden md:inline-block w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
              <span className="hidden md:inline text-sm font-medium text-slate-300">Server Connected</span>
            </div>
            <div className="md:hidden">
              <button onClick={() => setInRoom(false)} className="text-slate-400 text-sm hover:text-white transition-colors">Switch Room</button>
            </div>
        </div>

        {error && (
            <div className="bg-red-500/20 border-b border-red-500/50 text-red-200 text-center py-2 px-4 text-sm backdrop-blur-md">
                 {error}
            </div>
        )}

        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col space-y-6">
          {messages.map((msg, idx) => {
            const isMe = msg.sender === user.username;
            return (
              <div key={msg.id || idx} className={`flex w-full animate-fade-in ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                  <div className="flex items-center space-x-2 mb-1.5 px-1">
                    <span className="text-[11px] font-medium text-slate-400">
                      {isMe ? 'You' : msg.sender}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <div className={`px-5 py-3 rounded-2xl break-words text-[15px] leading-relaxed shadow-md
                    ${isMe 
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-sm' 
                      : 'bg-slate-800/80 border border-slate-700/50 text-slate-200 rounded-tl-sm'}`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 px-6 glass-panel border-t border-slate-800/50 shrink-0 mb-4 mx-4 rounded-2xl shadow-lg">
          <form onSubmit={handleSendMessage} className="flex space-x-3 items-center">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-xl px-5 py-3.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
              placeholder="Type your message..."
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!message.trim()}
              className={`bg-blue-600 hover:bg-blue-500 text-white h-[52px] px-8 rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center
                ${!message.trim() ? 'opacity-50 cursor-not-allowed shadow-none' : ''}`}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
