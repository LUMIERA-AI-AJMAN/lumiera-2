
import React, { useState } from 'react';
import { Bot, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [name, setName] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      const newUser: User = {
        id: Date.now().toString(),
        name: name.trim(),
        email: `${name.trim().toLowerCase().replace(/\s/g, '.')}@lumiera.ai`, // Placeholder email
      };
      onLogin(newUser);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-[#000000] text-[#e3e3e3] p-4">
      <div className="bg-[#0d0d0e] border border-[#282829] rounded-3xl p-8 md:p-12 shadow-2xl text-center max-w-md w-full animate-soft-in">
        <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/20">
          <Bot size={40} className="text-[#e3e3e3] opacity-[0.6]" />
        </div>
        <h1 className="text-3xl font-bold mb-3 text-[#e3e3e3]">Welcome to Lumiera AI</h1>
        <p className="text-[#9ca3af] mb-8">
          Enter your name to begin your journey with advanced professional intelligence.
        </p>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="name" className="sr-only">Your Name</label>
            <div className="relative">
              <UserIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af] opacity-[0.6]" />
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                className="w-full pl-12 pr-4 py-3 bg-[#131314] border border-[#282829] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 text-[#e3e3e3] placeholder-[#9ca3af] transition-all duration-300 shadow-inner shadow-black/20"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-[#e3e3e3] font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!name.trim()}
          >
            Start Chatting
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginView;
