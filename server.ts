import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { Filter } from "bad-words";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const filter = new Filter();
  const PORT = 3000;

  // Matchmaking Queue
  let waitingUsers: string[] = [];
  // Map to track pairs: socketId -> partnerSocketId
  const pairs = new Map<string, string>();
  // Track users currently in chat
  const inChatUsers = new Set<string>();
  // Store user profiles
  const profiles = new Map<string, any>();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    const matchUser = (profile: any) => {
      // Remove from any existing states
      removeFromQueue(socket.id);
      disconnectFromPartner(socket.id);
      profiles.set(socket.id, profile);

      if (waitingUsers.length > 0) {
        const partnerId = waitingUsers.shift()!;
        
        // Final sanity check that partner is still connected
        if (io.sockets.sockets.has(partnerId)) {
          const roomId = `${socket.id}#${partnerId}`;
          
          socket.join(roomId);
          const partnerSocket = io.sockets.sockets.get(partnerId);
          partnerSocket?.join(roomId);

          pairs.set(socket.id, partnerId);
          pairs.set(partnerId, socket.id);
          inChatUsers.add(socket.id);
          inChatUsers.add(partnerId);

          const myProfile = profiles.get(socket.id);
          const partnerProfile = profiles.get(partnerId);

          socket.emit("matched", { partnerId, partnerProfile });
          io.to(partnerId).emit("matched", { partnerId: socket.id, partnerProfile: myProfile });
          console.log(`Matched ${socket.id} with ${partnerId}`);
        } else {
          // Partner disconnected while waiting, try matching again
          matchUser(profile);
        }
      } else {
        waitingUsers.push(socket.id);
        socket.emit("waiting");
      }
    };

    const removeFromQueue = (id: string) => {
      waitingUsers = waitingUsers.filter((uid) => uid !== id);
    };

    const disconnectFromPartner = (id: string) => {
      const partnerId = pairs.get(id);
      if (partnerId) {
        const partnerSocket = io.sockets.sockets.get(partnerId);
        if (partnerSocket) {
          partnerSocket.emit("partner_disconnected");
          const roomId = id < partnerId ? `${id}#${partnerId}` : `${partnerId}#${id}`;
          partnerSocket.leave(roomId);
        }
        pairs.delete(id);
        pairs.delete(partnerId);
        inChatUsers.delete(id);
        inChatUsers.delete(partnerId);
      }
    };

    socket.on("start_search", (profile: any) => {
      matchUser(profile);
    });

    socket.on("send_message", (message: string) => {
      const partnerId = pairs.get(socket.id);
      if (partnerId) {
        // Simple profanity filter
        const cleanMessage = filter.isProfane(message) ? filter.clean(message) : message;
        io.to(partnerId).emit("receive_message", {
          text: cleanMessage,
          senderId: socket.id,
          timestamp: Date.now(),
        });
      }
    });

    socket.on("typing", (isTyping: boolean) => {
      const partnerId = pairs.get(socket.id);
      if (partnerId) {
        io.to(partnerId).emit("partner_typing", isTyping);
      }
    });

    socket.on("update_profile", (newProfile: any) => {
      profiles.set(socket.id, newProfile);
      const partnerId = pairs.get(socket.id);
      if (partnerId) {
        io.to(partnerId).emit("partner_profile_updated", newProfile);
      }
    });

    socket.on("next", () => {
      disconnectFromPartner(socket.id);
      matchUser(profiles.get(socket.id));
    });

    socket.on("stop", () => {
      removeFromQueue(socket.id);
      disconnectFromPartner(socket.id);
      socket.emit("stopped");
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      removeFromQueue(socket.id);
      disconnectFromPartner(socket.id);
      profiles.delete(socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
