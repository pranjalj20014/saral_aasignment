// import type { Core } from '@strapi/strapi';

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  bootstrap({ strapi }) {
    const { Server } = require('socket.io');

    // Create Socket.IO server and attach to Strapi's HTTP server
    const io = new Server(strapi.server.httpServer, {
      cors: {
        origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      },
      transports: ['websocket', 'polling'],
      pingInterval: 25000,
      pingTimeout: 60000,
      allowEIO3: true,
      serveClient: true,
    });

    const activeUsersByRoom = new Map();

    io.on('connection', (socket) => {
      // Basic authentication check (simplified for assignment)
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
      const room = socket.handshake.query?.room || 'general';
      const username = socket.handshake.query?.username || 'Anonymous';
      
      console.log(`User connected: ${username} to room: ${room}`);
      
      socket.join(room);

      // Track active users
      if (!activeUsersByRoom.has(room)) {
        activeUsersByRoom.set(room, new Set());
      }
      activeUsersByRoom.get(room).add(username);

      // Broadcast active users map
      io.to(room).emit('activeUsers', Array.from(activeUsersByRoom.get(room)));

      // Send recent chat history (optional feature requested)
      strapi.entityService.findMany('api::message.message', {
        filters: { room },
        sort: { createdAt: 'desc' },
        limit: 50
      }).then(messages => {
        socket.emit('chatHistory', messages.reverse());
      }).catch(err => console.error("Error fetching history", err));

      // Handle new messages
      socket.on('sendMessage', async (data) => {
        try {
          // Input validation (QA focus)
          if (!data.text || data.text.trim().length === 0) return;
          if (data.text.length > 500) return; // Prevent massive messages

          // Create message in DB
          const savedMessage = await strapi.entityService.create('api::message.message', {
            data: {
              text: data.text,
              sender: username,
              room: room,
              publishedAt: new Date(),
            }
          });

          // Broadcast to everyone in room
          io.to(room).emit('message', savedMessage);
          
        } catch (err) {
          console.error('Error saving message:', err);
        }
      });

      socket.on('disconnect', () => {
        console.log(`User disconnected: ${username}`);
        if (activeUsersByRoom.has(room)) {
           activeUsersByRoom.get(room).delete(username);
           io.to(room).emit('activeUsers', Array.from(activeUsersByRoom.get(room)));
        }
      });
    });

    // Make io instance globally accessible if needed
    strapi.io = io;
  },
};
