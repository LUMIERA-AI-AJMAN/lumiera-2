
import React from 'react';
import { MessageSquare, Plus, Trash2, LogOut, Clock, User as UserIcon, X, Bot } from 'lucide-react';
import { ChatSession, User } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  user: User | null;
  onLogout: () => void;
  onOpenProfile: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  isOpen,
  user,
  onLogout,
  onOpenProfile,
  onToggle // Keep onToggle for mobile close button
}) => {
  // Fix: Removed `if (!isOpen) return null;` as the sidebar's visibility is now controlled by CSS classes
  // within the component's div, allowing for transitions.

  const groupSessions = (sessions: ChatSession[]) => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const groups: { [key: string]: ChatSession[] } = {
      Today: [],
      Yesterday: [],
      'Previous 7 Days': [],
      Older: []
    };

    sessions.forEach(session => {
      const diff = now - session.updatedAt;
      if (diff < oneDay) groups['Today'].push(session);
      else if (diff < 2 * oneDay) groups['Yesterday'].push(session);
      else if (diff < 7 * oneDay) groups['Previous 7 Days'].push(session);
      else groups['Older'].push(session);
    });

    return groups;
  };

  const groupedSessions = groupSessions(sessions);

  return (
    <div className={`fixed inset-y-0 left-0 z-50 flex flex-col h-full bg-[#0d0d0e] border-r border-[#282829] transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] backdrop-blur-md bg-black/40
        ${isOpen ? 'w-72' : 'w-0 overflow-hidden'} md:w-72 md:relative md:bg-[#0d0d0e] md:backdrop-blur-none md:translate-x-0`}>
      {/* Overlay for mobile when open */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onToggle}></div>
      )}

      {/* Sidebar content */}
      <div className={`flex flex-col h-full ${isOpen ? '' : 'hidden md:flex'}`}>
        {/* Header with Close Button for Mobile */}
        <div className="flex items-center justify-between p-4 md:px-6 md:py-5 border-b border-[#282829]">
          <div className="flex items-center">
            <Bot size={28} className="text-indigo-400 opacity-[0.6] group-hover:opacity-100 mr-2 flex-shrink-0" />
            <span className="text-xl font-bold text-[#e3e3e3] truncate">Lumiera AI</span>
          </div>
          <button
            onClick={onToggle}
            className="md:hidden p-2 text-[#9ca3af] hover:text-[#e3e3e3] transition-all duration-300 hover:bg-[#1a1a1b] rounded-xl active:scale-90"
          >
            <X size={20} className="opacity-[0.6] hover:opacity-100" />
          </button>
        </div>


        <div className="p-6">
          <button
            onClick={() => { onNewChat(); if (window.innerWidth < 768) onToggle(); }}
            className="w-full flex items-center gap-4 px-5 py-4 bg-[#131314] border border-[#282829] rounded-2xl hover:bg-[#1a1a1b] hover:border-[#383839] transition-all duration-500 text-[#e3e3e3] text-[13px] font-bold group shadow-2xl shadow-black active:scale-[0.98] tracking-tight"
          >
            <div className="w-6 h-6 rounded-lg bg-white text-black flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              <Plus size={16} strokeWidth={3} />
            </div>
            Initialize New Protocol
          </button>
        </div>

        <div className="flex-grow overflow-y-auto px-4 no-scrollbar space-y-8 pb-6">
          {Object.entries(groupedSessions).map(([title, group], idx) => (
            group.length > 0 && (
              <div key={title} className={`space-y-2 animate-soft-in stagger-${idx + 1}`}>
                <h3 className="px-4 text-[10px] font-bold text-[#9ca3af] uppercase tracking-[0.25em] mb-3 flex items-center gap-2">
                  <Clock size={12} className="opacity-[0.6] group-hover:opacity-100" />
                  {title}
                </h3>
                {group.map((session) => (
                  <div
                    key={session.id}
                    className={`group flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl cursor-pointer transition-all duration-500 relative ${
                      activeSessionId === session.id 
                        ? 'bg-[#1a1a1b] text-[#e3e3e3] border border-[#383839] shadow-lg shadow-black/40' 
                        : 'hover:bg-[#1a1a1b] text-[#9ca3af] hover:text-[#e3e3e3] border border-transparent'
                    }`}
                    onClick={() => { onSelectSession(session.id); if (window.innerWidth < 768) onToggle(); }}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <MessageSquare size={16} className={`flex-shrink-0 opacity-[0.6] group-hover:opacity-100 transition-colors duration-500 ${activeSessionId === session.id ? 'text-[#e3e3e3]' : 'text-[#9ca3af]'}`} />
                      <span className="truncate text-[13px] font-semibold leading-none tracking-tight">{session.title}</span>
                    </div>
                    
                    {activeSessionId === session.id && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-full shadow-[0_0_10px_white]" />
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-2 hover:bg-rose-500/10 rounded-xl text-[#9ca3af] hover:text-rose-400 transition-all duration-300"
                    >
                      <Trash2 size={14} className="opacity-[0.6] group-hover:opacity-100"/>
                    </button>
                  </div>
                ))}
              </div>
            )
          ))}
          
          {sessions.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-center px-6 animate-soft-in">
              <div className="w-14 h-14 rounded-[1.5rem] bg-[#1a1a1b] border border-[#282829] flex items-center justify-center mb-5">
                <MessageSquare size={20} className="text-[#9ca3af] opacity-[0.6]" />
              </div>
              <p className="text-[11px] text-[#9ca3af] font-bold uppercase tracking-[0.2em]">Zero Active Nodes</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-[#282829] mt-auto bg-[#131314]/80 backdrop-blur-3xl">
          <div 
            onClick={onOpenProfile}
            className="flex items-center justify-between px-3 py-3 rounded-2xl hover:bg-[#1a1a1b] transition-all duration-500 cursor-pointer group border border-transparent hover:border-[#282829]"
          >
            <div className="flex items-center gap-4 min-w-0">
              {user?.profilePicture ? (
                <div className="relative">
                  <img src={user.profilePicture} alt={user.name} className="w-10 h-10 rounded-2xl object-cover grayscale opacity-[0.6] group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 border border-[#282829] shadow-xl" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white rounded-full border-4 border-black animate-pulse" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-[#1a1a1b] border border-[#282829] flex items-center justify-center text-white/40">
                  <UserIcon size={18} className="opacity-[0.6] group-hover:opacity-100" />
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-bold truncate text-[#9ca3af] group-hover:text-[#e3e3e3] transition-colors duration-500">{user?.name}</span>
                <span className="text-[9px] font-bold text-[#9ca3af] uppercase tracking-[0.2em] group-hover:text-[#e3e3e3]/40 transition-colors">Tier: Elite User</span>
              </div>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onLogout();
              }}
              className="p-2.5 text-[#9ca3af] hover:text-[#e3e3e3] hover:bg-[#1a1a1b] rounded-xl transition-all duration-500"
              title="Terminate Session"
            >
              <LogOut size={16} className="opacity-[0.6] group-hover:opacity-100" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;