// utils/socket.js
let io = null;

function initSocket(server) {
  const socketIo = require('socket.io')(server, {
    cors: {
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });

  socketIo.on('connection', (socket) => {
    console.log(`✅ Socket connected: ${socket.id}`);

    // Join room by role (frontend sends user role)
    socket.on('joinRole', (role) => {
      socket.join(role);
      console.log(`👥 ${socket.id} joined role room: ${role}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });

  io = socketIo;
  return io;
}

module.exports = { initSocket, io };
