import { Server } from 'socket.io';

// Declare a global variable to store the Socket.io server instance
// This is to prevent multiple server instances in Next.js HMR
global.io = global.io || null;

const SocketHandler = (req, res) => {
  if (res.socket.server.io) {
    console.log('Socket is already running');
  } else {
    console.log('Socket is initializing');
    const io = new Server(res.socket.server, {
      path: '/api/socket_io', // Specify a path for the socket server
      addTrailingSlash: false,
    });
    res.socket.server.io = io;
    global.io = io; // Store it globally

    // Track online users in memory (userId -> Set of socketIds)
    const onlineUsers = new Map();

    io.on('connection', (socket) => {
      console.log('A user connected:', socket.id);

      socket.on('identify', (userId) => {
        if (!userId) return;
        
        socket.userId = userId;
        if (!onlineUsers.has(userId)) {
          onlineUsers.set(userId, new Set());
          // Notify admin room that user is online
          io.to('admin').emit('user_status_change', { userId, status: 'online' });
        }
        onlineUsers.get(userId).add(socket.id);
        console.log(`User ${userId} identified on socket ${socket.id}`);
      });

      socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room: ${room}`);
      });

      socket.on('send_message', (message) => {
        io.to(message.room).emit('receive_message', message);
      });

      // Typing indicator — broadcast to the conversation room except sender
      socket.on('typing', ({ conversationId, isTyping, senderType }) => {
        const room = `conversation-${conversationId}`;
        const event = senderType === 'admin' ? 'admin_typing' : 'customer_typing';
        socket.to(room).emit(event, { isTyping });
        // Also notify admin room for admin-side indicators
        if (senderType === 'customer') {
          socket.to('admin').emit('customer_typing', { conversationId, isTyping });
        }
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        const userId = socket.userId;
        if (userId && onlineUsers.has(userId)) {
          const userSockets = onlineUsers.get(userId);
          userSockets.delete(socket.id);
          
          if (userSockets.size === 0) {
            onlineUsers.delete(userId);
            // Notify admin room that user is offline
            io.to('admin').emit('user_status_change', { userId, status: 'offline' });
            
            // Optionally update database last_seen_at
            import('@/lib/db').then(dbModule => {
                const db = dbModule.default;
                db.query('UPDATE users SET last_seen_at = CURRENT_TIMESTAMP WHERE id = $1', [userId]).catch(e => console.error('DB update error on disconnect:', e));
            });
          }
        }
      });

      socket.on('get_online_users', (callback) => {
        if (typeof callback === 'function') {
          callback(Array.from(onlineUsers.keys()));
        }
      });
    });
  }
  res.end();
};

export const getIo = () => global.io; // Export a function to get the global io instance
export default SocketHandler;
