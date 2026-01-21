
import React, { useState, useEffect } from 'react';
import { X, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (user: User) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user, onSave }) => {
  const [userName, setUserName] = useState(user?.name || '');

  useEffect(() => {
    if (user) {
      setUserName(user.name);
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (user && userName.trim()) {
      onSave({ ...user, name: userName.trim() });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#0d0d0e] border border-[#282829] rounded-3xl p-8 md:p-10 shadow-2xl text-[#e3e3e3] max-w-md w-full relative animate-soft-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#9ca3af] hover:text-[#e3e3e3] transition-all duration-300 hover:bg-[#1a1a1b] rounded-xl active:scale-90"
          title="Close"
        >
          <X size={20} className="opacity-[0.7] hover:opacity-100" />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-center text-[#e3e3e3]">Your Profile</h2>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[#9ca3af] mb-2">
              Name
            </label>
            <div className="relative">
              <UserIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af] opacity-[0.7]" />
              <input
                id="name"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-[#131314] border border-[#282829] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 text-[#e3e3e3] placeholder-[#9ca3af] transition-all duration-300 shadow-inner shadow-black/20"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#9ca3af] mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={user?.email || ''}
              className="w-full px-4 py-3 bg-[#131314] border border-[#282829] rounded-xl text-[#9ca3af] cursor-not-allowed shadow-inner shadow-black/20"
              disabled
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-[#e3e3e3] font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!userName.trim() || userName === user?.name}
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
