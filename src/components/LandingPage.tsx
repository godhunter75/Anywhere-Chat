import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, Zap, Globe, Shield, User, Hash, Tag } from "lucide-react";

interface LandingPageProps {
  onStart: (profile: { name: string; age: string; gender: string; interests: string }) => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  const [profile, setProfile] = useState({
    name: "",
    age: "",
    gender: "",
    interests: "",
  });
  const [showProfile, setShowProfile] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(profile as { name: string; age: string; gender: string; interests: string });
  };

  return (
    <div className="min-h-screen bg-bg-dark text-text-primary flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden relative font-sans">
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-900/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-cyan-900/5 rounded-full blur-[80px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl w-full text-center z-10"
      >
        {!showProfile ? (
          <div className="space-y-12">
            <div className="flex flex-col items-center gap-3">
              <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                Anywhere<span className="text-blue-500">Chat</span>
              </h1>
              <p className="text-lg md:text-xl text-text-secondary font-medium tracking-wide">
                Instant 1-on-1 anonymous connections.
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowProfile(true)}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg md:text-xl transition-all shadow-xl shadow-blue-600/10 flex items-center gap-2 mx-auto"
            >
              <Zap className="w-5 h-5 fill-current" />
              Chat Now
            </motion.button>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <FeatureCard
                title="Global"
                description="Match with people worldwide."
              />
              <FeatureCard
                title="Private"
                description="No logs, no accounts, no trace."
              />
              <FeatureCard
                title="Fast"
                description="WebSocket optimized messaging."
              />
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto bg-surface-dark border border-border-dark p-8 rounded-3xl shadow-2xl"
          >
            <h2 className="text-2xl font-black mb-2 uppercase tracking-tight">Your Profile</h2>
            <p className="text-text-secondary text-sm mb-8 font-medium italic">Shared only with your match</p>

            <form onSubmit={handleSubmit} className="space-y-5 text-left">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-text-muted ml-1 flex items-center gap-2">
                  <User className="w-3 h-3" /> Display Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Lone Wolf"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-black text-text-muted ml-1 flex items-center gap-2">
                    <Hash className="w-3 h-3" /> Age
                  </label>
                  <input
                    type="number"
                    max="120"
                    placeholder="25"
                    value={profile.age}
                    onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                    className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-black text-text-muted ml-1 flex items-center gap-2">
                    <User className="w-3 h-3" /> Gender
                  </label>
                  <select
                    value={profile.gender}
                    onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                    className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all appearance-none"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-text-muted ml-1 flex items-center gap-2">
                  <Tag className="w-3 h-3" /> Interests
                </label>
                <input
                  type="text"
                  placeholder="E.g. Gaming, Art"
                  value={profile.interests}
                  onChange={(e) => setProfile({ ...profile, interests: e.target.value })}
                  className="w-full bg-bg-dark border border-border-dark rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button
                  type="submit"
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
                >
                  ENTER
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </motion.div>

      <footer className="absolute bottom-6 text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold">
        Secure & Encrypted • AnywhereChat
      </footer>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 bg-surface-dark/50 border border-border-dark rounded-xl">
      <h3 className="text-sm font-bold mb-1 text-text-primary uppercase tracking-wider">{title}</h3>
      <p className="text-text-secondary text-xs leading-relaxed">{description}</p>
    </div>
  );
}
