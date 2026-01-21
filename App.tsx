
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Menu, ShieldCheck, ChevronRight, AlertCircle, Wand2, Fan, Cpu, Zap, Box, CheckCircle2, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { Message, Role, ChatSession, User, ModelType, ModelTypeValues } from './types';
import { gemini } from './services/geminiService';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import LoginView from './components/LoginView';
import ProfileModal from './components/ProfileModal';
// remarkGfm is imported in ChatMessage.tsx, not needed here directly.

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelType>(ModelTypeValues.PRO);
  const [gpuStatusColor, setGpuStatusColor] = useState('text-[#e3e3e3]');
  const [gpuStatusText, setGpuStatusText] = useState('0/17 GPU'); // New state for GPU text
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isImageMode, setIsImageMode] = useState(false); // New state for image generation mode
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const gpuIntervalRef = useRef<number | null>(null); // Ref for GPU interval

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [sessions, activeSessionId]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Cleanup for GPU interval on unmount
  useEffect(() => {
    return () => {
      if (gpuIntervalRef.current) {
        clearInterval(gpuIntervalRef.current);
      }
    };
  }, []);
  
  const handleNewChat = useCallback(() => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: 'New chat',
      messages: [],
      updatedAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    setError(null);
    setInput(''); // Clear input on new chat
    setIsImageMode(false); // Reset image mode on new chat
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    if (user && sessions.length === 0) {
      handleNewChat();
    }
  }, [user, sessions.length, handleNewChat]);

  useEffect(() => {
    if (isLoading) {
      setGpuStatusColor('text-rose-500');
    } else {
      // Clear interval when loading stops
      if (gpuIntervalRef.current) {
        clearInterval(gpuIntervalRef.current);
        gpuIntervalRef.current = null;
      }
      setGpuStatusText('0/17 GPU'); // Reset GPU status to idle
      const timer = setTimeout(() => {
        setGpuStatusColor('text-[#e3e3e3]/70');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUpdateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  const handleEnhancePrompt = useCallback(async () => {
    if (!input.trim() || isEnhancing || isLoading) return;
    setIsEnhancing(true);
    try {
      const enhanced = await gemini.enhancePrompt(input);
      setInput(enhanced);
    } catch (err) {
      console.error(err);
      setError("Failed to enhance prompt. Please try again.");
    } finally {
      setIsEnhancing(false);
    }
  }, [input, isEnhancing, isLoading]);

  const toggleImageMode = useCallback(() => {
    setIsImageMode(prev => {
      const newMode = !prev;
      if (newMode) {
        setSelectedModel(ModelTypeValues.IMAGE_CREATOR);
      } else {
        setSelectedModel(ModelTypeValues.PRO); // Revert to default text model
      }
      return newMode;
    });
    setShowModelDropdown(false); // Close dropdown if open
    setTimeout(() => inputRef.current?.focus(), 100); // Focus input
  }, []);

  const handleSendMessage = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading || !activeSessionId) return;

    const currentInput = input;
    setInput('');
    setError(null);
    setIsLoading(true);

    // Determine GPU usage based on input length
    const wordCount = currentInput.split(/\s+/).filter(word => word.length > 0).length;
    
    // Clear any existing interval
    if (gpuIntervalRef.current) {
      clearInterval(gpuIntervalRef.current);
      gpuIntervalRef.current = null;
    }

    if (wordCount < 40) {
      setGpuStatusText('3-5 GPU'); // Adjusted for precision
    } else if (wordCount >= 100) {
      let currentGpu = 5;
      setGpuStatusText(`${currentGpu}/17 GPU`); // Adjusted max GPU to 17
      const intervalId = window.setInterval(() => {
        currentGpu = Math.min(currentGpu + 1, 17);
        setGpuStatusText(`${currentGpu}/17 GPU`);
        if (currentGpu >= 17) {
          clearInterval(intervalId);
          gpuIntervalRef.current = null;
        }
      }, 500); // Increment every 0.5 seconds
      gpuIntervalRef.current = intervalId;
    } else { // 40 to 99 words
      setGpuStatusText('5-10 GPU'); // Adjusted for precision
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content: currentInput,
      timestamp: Date.now()
    };

    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        const newTitle = s.messages.length === 0 ? currentInput.slice(0, 30) + (currentInput.length > 30 ? '...' : '') : s.title;
        return {
          ...s,
          title: newTitle,
          messages: [...s.messages, userMessage],
          updatedAt: Date.now()
        };
      }
      return s;
    }));

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessagePlaceholder: Message = {
      id: assistantMessageId,
      role: Role.ASSISTANT,
      content: '',
      timestamp: Date.now() + 1
    };
    if (isImageMode) {
      assistantMessagePlaceholder.content = 'Generating image...'; // Indicate image generation
    }

    setSessions(prev => prev.map(s => 
      s.id === activeSessionId ? { ...s, messages: [...s.messages, assistantMessagePlaceholder] } : s
    ));

    try {
      if (isImageMode) {
        const generatedImageParts = await gemini.generateImage(currentInput);
        
        setSessions(prev => prev.map(s => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              messages: s.messages.map(m => 
                m.id === assistantMessageId ? { ...m, content: generatedImageParts ? 'Image generated:' : 'Failed to generate image.', imageParts: generatedImageParts || undefined } : m
              ),
              updatedAt: Date.now()
            };
          }
          return s;
        }));
      } else {
        const activeSession = sessions.find(s => s.id === activeSessionId);
        const messageHistory = activeSession ? [...activeSession.messages, userMessage] : [userMessage];
        
        const fullContent = await gemini.streamChat(messageHistory, selectedModel);
        
        setSessions(prev => prev.map(s => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              messages: s.messages.map(m => 
                m.id === assistantMessageId ? { ...m, content: fullContent } : m
              ),
              updatedAt: Date.now()
            };
          }
          return s;
        }));
      }
      
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes("Requested entity was not found.")) {
        setError("Authentication error: Please ensure your API key is correctly configured and has access to the model.");
      } else {
        setError("System overhead exceeded. Please retry your request.");
      }
      
      setSessions(prev => prev.map(s => 
        s.id === activeSessionId ? { ...s, messages: s.messages.filter(m => m.id !== assistantMessageId) } : s
      ));
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, isLoading, activeSessionId, sessions, selectedModel, isImageMode]);

  const handleLogout = useCallback(() => {
    setUser(null);
    setSessions([]);
    setActiveSessionId(null);
  }, []);

  const currentSession = sessions.find(s => s.id === activeSessionId);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getModelLabel = (model: ModelType) => {
    switch(model) {
      case ModelTypeValues.PRO: return "PRO V3";
      case ModelTypeValues.FLASH: return "FLASH  V2";
      case ModelTypeValues.LITE: return "LITE V1";
      case ModelTypeValues.IMAGE_CREATOR: return "IMAGE CREATOR V1";
      default: return "SYSTEM INTELLIGENCE";
    }
  };

  const getModelIcon = (model: ModelType) => {
    switch(model) {
      case ModelTypeValues.PRO: return <Cpu size={14} className="opacity-[0.6] group-hover:opacity-100" />;
      case ModelTypeValues.FLASH: return <Zap size={14} className="opacity-[0.6] group-hover:opacity-100" />;
      case ModelTypeValues.LITE: return <Box size={14} className="opacity-[0.6] group-hover:opacity-100" />;
      case ModelTypeValues.IMAGE_CREATOR: return <ImageIcon size={14} className="opacity-[0.6] group-hover:opacity-100" />;
      default: return <ShieldCheck size={14} className="opacity-[0.6] group-hover:opacity-100" />;
    }
  };

  if (!user) {
    return <LoginView onLogin={setUser} />;
  }

  return (
    <div className="flex h-screen bg-[#000000] font-sans antialiased text-[#e3e3e3] overflow-hidden">
      <Sidebar 
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewChat={handleNewChat}
        onDeleteSession={(id) => {
          setSessions(prev => prev.filter(s => s.id !== id));
          if (activeSessionId === id) setActiveSessionId(null);
        }}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        user={user || undefined}
        onLogout={handleLogout}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      <main className={`flex-grow flex flex-col relative overflow-hidden bg-[#000000] transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]`}>
        <header className="h-16 flex items-center justify-between px-6 sticky top-0 bg-[#000000]/90 backdrop-blur-xl z-20 border-b border-[#282829]">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-[#9ca3af] hover:text-[#e3e3e3] transition-all duration-300 hover:bg-[#1a1a1b] rounded-xl active:scale-90"
            >
              <Menu size={20} className="opacity-[0.6] hover:opacity-100" />
            </button>
            <div className="flex items-center gap-3 px-4 py-1.5 bg-[#1a1a1b]/50 border border-[#282829] rounded-2xl">
               <Fan 
                  size={14} 
                  className={`text-[#e3e3e3]/60 ${isLoading ? 'animate-fan-fast' : 'animate-fan'}`} 
                />
              <span className={`text-[10px] font-bold uppercase tracking-[0.2em] gpu-text-transition ${gpuStatusColor}`}>
                {gpuStatusText} {/* Display the dynamic GPU status text */}
              </span>
            </div>
          </div>
        </header>

        <div className="flex-grow overflow-y-auto no-scrollbar scroll-smooth">
          {!currentSession || currentSession.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 max-w-3xl mx-auto">
              <div className="w-20 h-20 bg-[#e3e3e3] rounded-[2rem] flex items-center justify-center mb-10 border border-[#282829] shadow-2xl shadow-white/5 animate-soft-in">
                <ShieldCheck size={40} className="text-black" />
              </div>
              <h2 className="text-4xl font-bold text-[#e3e3e3] mb-12 tracking-tight animate-soft-in stagger-1">
                Welcome back, {user.name.split(' ')[0]}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {[
                  "Explain React Concurrent Mode architecture.",
                  "Audit these smart contracts for vulnerabilities.",
                  "Design a high-availability Kafka cluster.",
                  "Optimize a PostgreSQL query for 10M rows."
                ].map((text, idx) => (
                  <button 
                    key={idx}
                    onClick={() => {
                      setInput(text);
                      inputRef.current?.focus();
                    }}
                    className={`p-6 text-left border border-[#282829] bg-[#0d0d0e] rounded-2xl hover:bg-[#1a1a1b] hover:border-[#383839] transition-all duration-500 text-sm font-medium text-[#9ca3af] flex justify-between items-center group animate-soft-in stagger-${idx + 2} hover:translate-y-[-2px] hover:shadow-2xl hover:shadow-white/[0.02]`}
                  >
                    <span className="max-w-[85%]">{text}</span>
                    <ChevronRight size={16} className="text-[#9ca3af] opacity-[0.6] group-hover:opacity-100 group-hover:text-[#e3e3e3] group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="pb-44">
              {currentSession.messages.map((msg, idx) => (
                <ChatMessage 
                  key={msg.id} 
                  message={msg} 
                  isStreaming={isLoading && idx === currentSession.messages.length - 1 && msg.role === Role.ASSISTANT}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {error && (
          <div className="absolute bottom-40 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-30 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-rose-950/20 border border-rose-500/20 text-rose-300 px-6 py-4 rounded-2xl flex items-center gap-5 shadow-2xl backdrop-blur-2xl">
              <AlertCircle className="flex-shrink-0 opacity-[0.6]" size={20} />
              <div className="flex-grow">
                <p className="font-bold text-[10px] uppercase tracking-[0.2em]">System Congestion</p>
                <p className="text-xs opacity-80 mt-1">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-rose-500/20 transition-all text-rose-300 opacity-[0.6] hover:opacity-100">×</button>
            </div>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#000000] via-[#000000]/95 to-transparent pt-20 pb-8 px-6 z-20">
          <div className="max-w-3xl mx-auto">
            <div className="relative bg-[#131314] border border-[#282829] rounded-[1.75rem] shadow-2xl focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-rose-500/50 transition-all duration-500 p-2">
              <form onSubmit={handleSendMessage} className="flex flex-col">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isImageMode ? "Describe the image you want to create..." : "Consult lumiera AI..."}
                  rows={1}
                  className="w-full px-5 py-3 focus:outline-none resize-none min-h-[48px] max-h-56 text-[16px] text-[#e3e3e3] leading-relaxed placeholder:text-[#9ca3af] bg-transparent transition-all duration-500"
                  style={{ height: 'auto' }}
                />
                
                <div className="flex items-center justify-between px-3 pt-2 pb-1 border-t border-[#282829] mt-2">
                  <div className="flex items-center gap-2">
                    <div className="relative" ref={dropdownRef}>
                      <button
                        type="button"
                        onClick={() => setShowModelDropdown(!showModelDropdown)}
                        disabled={isImageMode} // Disable dropdown in image mode
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#1a1a1b] transition-all duration-300 text-[#9ca3af] hover:text-[#e3e3e3] group ${isImageMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {getModelIcon(selectedModel)}
                        <span className="text-[10px] font-bold uppercase tracking-[0.15em]">
                          {getModelLabel(selectedModel).split(' ')[0]}
                        </span>
                        <ChevronDown size={14} className={`opacity-[0.6] group-hover:opacity-100 transition-transform duration-500 ${showModelDropdown && !isImageMode ? 'rotate-180' : ''}`} />
                      </button>

                      {showModelDropdown && !isImageMode && (
                        <div className="absolute bottom-full left-0 mb-4 w-60 bg-[#0d0d0e] border border-[#282829] rounded-2xl shadow-3xl p-1.5 animate-in slide-in-from-bottom-2 fade-in duration-500 backdrop-blur-3xl">
                          {[
                            { id: ModelTypeValues.PRO, label: 'Pro Intelligence', icon: <Cpu size={14}/> },
                            { id: ModelTypeValues.FLASH, label: 'Flash Response', icon: <Zap size={14}/> },
                            { id: ModelTypeValues.LITE, label: 'Lite Efficiency', icon: <Box size={14}/> }
                          ].map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                setSelectedModel(m.id);
                                setShowModelDropdown(false);
                              }}
                              className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl transition-all duration-300 ${
                                selectedModel === m.id ? 'bg-[#1a1a1b] text-[#e3e3e3] shadow-lg' : 'hover:bg-[#1a1a1b] text-[#9ca3af]'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {React.cloneElement(m.icon, {className: 'opacity-[0.6] group-hover:opacity-100'})}
                                <span className="text-xs font-semibold">{m.label}</span>
                              </div>
                              {selectedModel === m.id && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleEnhancePrompt}
                      disabled={!input.trim() || isEnhancing || isLoading || isImageMode} // Disable in image mode
                      className="p-2.5 text-[#9ca3af] hover:text-[#e3e3e3] transition-all duration-300 rounded-xl hover:bg-[#1a1a1b] disabled:opacity-10 group"
                      title="Refine prompt"
                    >
                      {isEnhancing ? (
                        <div className="w-4 h-4 border border-white/20 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <Wand2 size={18} className="opacity-[0.6] group-hover:opacity-100" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={toggleImageMode}
                      disabled={isLoading}
                      className={`p-2.5 transition-all duration-300 rounded-xl disabled:opacity-10 group 
                        ${isImageMode 
                          ? 'bg-[#6366f1]/20 text-[#6366f1] border border-[#6366f1]/40' 
                          : 'text-[#9ca3af] hover:text-[#e3e3e3] hover:bg-[#1a1a1b]'
                        }`}
                      title="Toggle Image Generation"
                    >
                      <ImageIcon size={18} className="opacity-[0.6] group-hover:opacity-100" />
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className={`h-11 w-11 rounded-[1.25rem] transition-all duration-500 flex items-center justify-center ${
                      input.trim() && !isLoading
                        ? 'bg-[#e3e3e3] text-black hover:scale-105 active:scale-95 shadow-xl shadow-white/5'
                        : 'bg-[#1a1a1b] text-[#9ca3af] cursor-not-allowed'
                    }`}
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </div>
              </form>
            </div>
            <p className="text-[10px] text-center mt-5 text-[#9ca3af] font-bold uppercase tracking-[0.25em] select-none opacity-50">
              lumiera AI • Advanced Technical Protocols
            </p>
          </div>
        </div>
      </main>

      <ProfileModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onSave={handleUpdateUser}
      />
    </div>
  );
};

export default App;