'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!username.trim() && !isLogin) {
      setError('Username is required');
      return;
    }
    if (!email.trim() && isLogin && !username.trim()) {
      setError('Identifier (Email or Username) is required');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/local' : '/auth/local/register';
      const body = isLogin
        ? { identifier: email || username, password }
        : { username, email, password };

      const { response, data } = await fetchAPI(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(data?.error?.message || 'Authentication failed');
      }

      if (data.jwt && typeof window !== 'undefined') {
        localStorage.setItem('token', data.jwt);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/chat');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 animate-fade-in relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]" />
      
      <div className="glass rounded-2xl w-full max-w-md p-8 relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gradient mb-2">
            {isLogin ? 'Welcome Back' : 'Join the Network'}
          </h2>
          <p className="text-slate-400 text-sm">
            {isLogin ? 'Sign in to continue your conversations' : 'Create an account to start chatting'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm backdrop-blur-sm" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-slate-300 text-xs font-semibold mb-1 uppercase tracking-wider" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                type="text"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2.5 px-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="SecureUser123"
              />
            </div>
          )}
          <div>
            <label className="block text-slate-300 text-xs font-semibold mb-1 uppercase tracking-wider" htmlFor="email">
              {isLogin ? 'Email or Username' : 'Email'}
            </label>
            <input
              id="email"
              type={isLogin ? 'text' : 'email'}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2.5 px-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-slate-300 text-xs font-semibold mb-1 uppercase tracking-wider" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2.5 px-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 transition-all ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Authenticating...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-sm text-slate-400 hover:text-blue-400 transition-colors"
          >
            {isLogin ? 'Need an account? Register here' : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
