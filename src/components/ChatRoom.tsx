import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "motion/react";
import { Send, X, RefreshCw, AlertCircle, User, ShieldAlert, Zap, Settings, Hash, Tag, Check } from "lucide-react";
import { cn } from "../lib/utils";

interface Message {
  text: string;
  senderId: string;
  timestamp: number;
}

interface ChatRoomProps {
  userProfile: { name: string; age: string; gender: string; interests: string };
  onStop: () => void;
}

export default function ChatRoom({ userProfile, onStop }: ChatRoomProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [myProfile, setMyProfile] = useState(userProfile);
  const [partnerProfile, setPartnerProfile] = useState<any>(null);
  const [inputText, setInputText] = useState("");
  const [status, setStatus] = useState<"searching" | "connected" | "partner_disconnected" | "stopped">("searching");
  const [isTyping, setIsTyping] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [reported, setReported] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [tempProfile, setTempProfile] = useState(userProfile);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isPartnerTyping]);

  useEffect(() => {
    const newSocket = io({
      transports: ["websocket"],
    });
    setSocket(newSocket);

    newSocket.emit("start_search", userProfile);

    newSocket.on("waiting", () => {
      setStatus("searching");
    });

    newSocket.on("matched", ({ partnerProfile }: any) => {
      setStatus("connected");
      setPartnerProfile(partnerProfile);
      setMessages([]);
      setReported(false);
    });

    newSocket.on("partner_profile_updated", (newProfile: any) => {
      setPartnerProfile(newProfile);
    });

    newSocket.on("receive_message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on("partner_typing", (typing: boolean) => {
      setIsPartnerTyping(typing);
    });

    newSocket.on("partner_disconnected", () => {
      setStatus("partner_disconnected");
      setIsPartnerTyping(false);
    });

    newSocket.on("stopped", () => {
      setStatus("stopped");
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (status === "connected") {
      inputRef.current?.focus();
    }
  }, [status]);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputText(value);
    
    if (status !== "connected" || !socket) return;

    // Send typing status if we weren't already typing
    if (!isTyping && value.length > 0) {
      handleTyping(true);
    }

    // Reset timeout to stop typing after 2 seconds of inactivity
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      handleTyping(false);
    }, 2000);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || status !== "connected" || !socket) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    handleTyping(false);

    socket.emit("send_message", inputText);
    setMessages((prev) => [
      ...prev,
      { text: inputText, senderId: socket.id || "", timestamp: Date.now() },
    ]);
    setInputText("");
    handleTyping(false);
  };

  const handleTyping = (typing: boolean) => {
    if (status !== "connected" || !socket) return;
    setIsTyping(typing);
    socket.emit("typing", typing);
  };

  const handleNext = () => {
    if (!socket) return;
    setMessages([]);
    setPartnerProfile(null);
    setStatus("searching");
    socket.emit("next");
  };

  const handleStop = () => {
    if (!socket) return;
    socket.emit("stop");
    onStop();
  };

  const handleReport = () => {
    setReported(true);
    // In a real app, send report to backend
    setTimeout(() => {
      handleNext();
    }, 1500);
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setMyProfile(tempProfile);
    setShowEditProfile(false);
    if (socket) {
      socket.emit("update_profile", tempProfile);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-bg-dark text-text-primary font-sans relative overflow-hidden">
      {/* Profile Edit Overlay */}
      <AnimatePresence>
        {showEditProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-bg-dark/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-surface-dark border border-border-dark p-6 rounded-2xl w-full max-w-sm shadow-2xl relative"
            >
              <button
                onClick={() => setShowEditProfile(false)}
                className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
                id="close-profile-btn"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-xl font-black mb-1 uppercase tracking-tight">Edit Profile</h2>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-6">
                Updated for next matching
              </p>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-widest font-black text-text-muted ml-1 flex items-center gap-1.5">
                    <User className="w-3 h-3" /> Name
                  </label>
                  <input
                    type="text"
                    required
                    value={tempProfile.name}
                    onChange={(e) => setTempProfile({ ...tempProfile, name: e.target.value })}
                    className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-widest font-black text-text-muted ml-1 flex items-center gap-1.5">
                      <Hash className="w-3 h-3" /> Age
                    </label>
                    <input
                      type="number"
                      max="120"
                      value={tempProfile.age}
                      onChange={(e) => setTempProfile({ ...tempProfile, age: e.target.value })}
                      className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase tracking-widest font-black text-text-muted ml-1 flex items-center gap-1.5">
                      <User className="w-3 h-3" /> Gender
                    </label>
                    <select
                      value={tempProfile.gender}
                      onChange={(e) => setTempProfile({ ...tempProfile, gender: e.target.value })}
                      className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-all appearance-none"
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-widest font-black text-text-muted ml-1 flex items-center gap-1.5">
                    <Tag className="w-3 h-3" /> Interests
                  </label>
                  <input
                    type="text"
                    value={tempProfile.interests}
                    onChange={(e) => setTempProfile({ ...tempProfile, interests: e.target.value })}
                    className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-all"
                    placeholder="E.g. Music, Travel"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
                  id="save-profile-btn"
                >
                  <Check className="w-4 h-4" /> Save Changes
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Condensed Header */}
      <header className="px-4 py-3 bg-surface-dark border-b border-border-dark flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className={cn("w-2 h-2 rounded-full shrink-0", status === "connected" ? "bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]" : "bg-text-muted")} />
          <div className="truncate">
            <h1 className="text-lg font-bold tracking-tight leading-none truncate">
              {status === "connected" && partnerProfile ? (
                <span className="flex items-center gap-2">
                  <span className="truncate">{partnerProfile.name || "Stranger"}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {partnerProfile.age && <span className="text-text-muted font-mono text-[10px]">{partnerProfile.age}y</span>}
                    {partnerProfile.gender && (
                      <span className="text-blue-400 font-bold text-[9px] uppercase tracking-tighter px-1 border border-blue-400/20 rounded">
                        {partnerProfile.gender}
                      </span>
                    )}
                  </div>
                </span>
              ) : (
                <>Anywhere<span className="text-blue-500">Chat</span></>
              )}
            </h1>
            {status === "connected" && partnerProfile?.interests && (
              <p className="text-[9px] text-text-muted truncate uppercase font-black tracking-widest mt-1">
                Interests: {partnerProfile.interests}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowEditProfile(true)}
            className="p-2 bg-surface-hover hover:bg-border-dark border border-border-dark rounded-lg text-text-muted hover:text-text-primary transition-all active:scale-90"
            title="Edit Profile"
            id="open-profile-btn"
          >
            <Settings className="w-4 h-4" />
          </button>
          <div className="text-[10px] uppercase tracking-widest text-text-secondary font-bold shrink-0 ml-2">
            {status === "connected" ? "Live Pairing" : status === "searching" ? "Searching" : "Idle"}
          </div>
        </div>
      </header>

      {/* Main Chat Flow */}
      <main className="flex-1 flex flex-col relative min-h-0">
        {status === "connected" && (
          <div className="absolute top-2 left-0 right-0 flex justify-center z-10 px-4">
            <div className="bg-surface-dark/90 backdrop-blur-sm border border-border-dark px-3 py-1 rounded-full text-[10px] text-blue-400 font-bold uppercase tracking-widest shadow-sm">
              Stranger Connected
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-hide">
          {status === "searching" && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 border-2 border-blue-600/10 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-text-secondary text-sm font-bold uppercase tracking-widest animate-pulse">Matching...</p>
            </div>
          )}

          {status === "partner_disconnected" && (
            <div className="flex justify-center py-8">
              <div className="bg-surface-dark border border-border-dark p-6 rounded-xl text-center max-w-xs shadow-xl">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
                <p className="text-text-primary font-bold text-sm mb-4">Stranger disconnected</p>
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm w-full transition-all"
                >
                  Find Next
                </button>
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg, index) => {
              const isMe = socket && msg.senderId === socket.id;
              return (
                <motion.div
                  key={`${msg.timestamp}-${index}`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex flex-col", isMe ? "items-end" : "items-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] px-4 py-2 rounded-2xl text-[14px] leading-relaxed shadow-sm font-medium",
                      isMe
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-surface-dark border border-border-dark text-text-primary rounded-tl-none"
                    )}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          <AnimatePresence>
            {isPartnerTyping && (
              <motion.div
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center space-x-2 ml-1"
              >
                <div className="flex space-x-1">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                </div>
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
                  {partnerProfile?.name || "Stranger"} is typing...
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Action Controls and Input Bar */}
        <div className="bg-surface-dark border-t border-border-dark p-4 space-y-3">
          {/* Quick Actions Bar */}
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 border-b border-border-dark/50 pb-3">
            <div className="flex items-center gap-2 flex-grow">
              <button
                onClick={handleStop}
                className="flex-1 md:flex-none px-6 py-2.5 bg-bg-dark hover:bg-surface-hover border border-border-dark rounded-xl text-xs font-black text-red-500 uppercase tracking-widest transition-all active:scale-95"
              >
                Stop
              </button>
              <button
                onClick={handleNext}
                className="flex-[2] md:flex-none px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-600/10 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3 h-3" /> Next
              </button>
            </div>
            
            <button
              onClick={handleReport}
              disabled={status !== "connected" || reported}
              className="p-2.5 text-text-muted hover:text-red-500 transition-colors bg-bg-dark border border-border-dark rounded-xl"
              title="Report User"
            >
              <ShieldAlert className="w-4 h-4" />
            </button>
          </div>

          {/* Typing Area */}
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={handleInputChange}
              onBlur={() => handleTyping(false)}
              disabled={status !== "connected"}
              placeholder={status === "connected" ? `Message ${partnerProfile?.name || 'Stranger'}...` : "Message..."}
              className="flex-1 bg-bg-dark border border-border-dark rounded-xl px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-blue-500/50 transition-all text-[15px]"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || status !== "connected"}
              className="aspect-square bg-blue-600 hover:bg-blue-500 disabled:bg-bg-dark disabled:text-text-muted text-white p-3 rounded-xl font-bold transition-all shadow-md active:scale-95 flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          
          <div className="flex justify-center items-center max-w-4xl mx-auto mt-2">
            <p className="text-[9px] text-text-muted font-bold uppercase tracking-[0.2em] italic">Encrypted Anonymity Engine</p>
          </div>
        </div>
      </main>
    </div>
  );
}
