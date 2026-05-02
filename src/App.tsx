/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import LandingPage from "./components/LandingPage";
import ChatRoom from "./components/ChatRoom";

export default function App() {
  const [view, setView] = useState<"landing" | "chat">("landing");
  const [userProfile, setUserProfile] = useState<any>(null);

  const handleStart = (profile: any) => {
    setUserProfile(profile);
    setView("chat");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] selection:bg-blue-500/30">
      {view === "landing" ? (
        <LandingPage onStart={handleStart} />
      ) : (
        <ChatRoom userProfile={userProfile} onStop={() => setView("landing")} />
      )}
    </div>
  );
}

