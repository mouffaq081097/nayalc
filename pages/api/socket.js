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

    io.on('connection', (socket) => {
      console.log('A user connected:', socket.id);

      socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room: ${room}`);
      });

      socket.on('send_message', (message) => {
        console.log('Received message via send_message:', message);
        io.to(message.room).emit('receive_message', message);
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });
  }
  res.end();
};

export const getIo = () => global.io; // Export a function to get the global io instance
export default SocketHandler;
