module.exports = (io) => {
  const users = {}; // Room state

  io.on('connection', (socket) => {
    socket.on('join-room', (roomId, userId, name) => {
      socket.join(roomId);
      
      if (!users[roomId]) users[roomId] = [];
      users[roomId].push({ id: socket.id, userId, name });

      socket.to(roomId).emit('user-connected', socket.id, name);

      // Handle signal (WebRTC)
      socket.on('signal', (to, data) => {
        io.to(to).emit('signal', socket.id, data, name);
      });

      // Handle chat message
      socket.on('message', (message) => {
        io.to(roomId).emit('createMessage', message, name);
      });

      // Handle emoji reactions
      socket.on('emoji', (emoji) => {
        io.to(roomId).emit('receiveEmoji', emoji, name);
      });

      // Handle whiteboard drawings
      socket.on('draw', (drawData) => {
        socket.to(roomId).emit('onDraw', drawData);
      });
      
      // Clear whiteboard
      socket.on('clear-board', () => {
        io.to(roomId).emit('clear-board');
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        users[roomId] = users[roomId].filter((u) => u.id !== socket.id);
        socket.to(roomId).emit('user-disconnected', socket.id);
      });
    });
  });
};
