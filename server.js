// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
const path = require('path'); // Import the 'path' module

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const activeRooms = {};
const TRIVIA_API_URL = 'https://the-trivia-api.com/api/questions?categories=code&limit=10&difficulty=hard';

// --- THIS IS THE CRITICAL LINE FOR SERVING YOUR HTML ---
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));
// ----------------------------------------------------

// --- Random Name Generator ---
const ADJECTIVES = ['Quick', 'Bright', 'Silent', 'Swift', 'Red', 'Blue', 'Green', 'Ancient', 'Brave', 'Calm'];
const ANIMALS = ['Fox', 'Panda', 'Tiger', 'Lion', 'Wolf', 'Eagle', 'Shark', 'Cat', 'Dog', 'Bear'];

function generateRandomName() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${adj} ${animal}`;
}
// ------------------------------------

io.on('connection', (socket) => {
  socket.username = generateRandomName();
  console.log(`User ${socket.username} (${socket.id}) connected.`);

  // --- HOST: Create a new game room ---
  socket.on('createRoom', () => {
    const roomKey = Math.floor(10000 + Math.random() * 90000).toString();
    activeRooms[roomKey] = {
      host: { id: socket.id, name: socket.username },
      guest: null,
      players: [socket.username],
      scores: {}
    };
    socket.join(roomKey);
    console.log(`Room ${roomKey} created by ${socket.username}`);
    socket.emit('roomCreated', { roomKey, hostName: socket.username });
  });

  // --- GUEST: Join an existing game room ---
  socket.on('joinRoom', (roomKey) => {
    const room = activeRooms[roomKey];
    if (room && room.players.length < 2) {
      room.guest = { id: socket.id, name: socket.username };
      room.players.push(socket.username);
      socket.join(roomKey);

      console.log(`User ${socket.username} joined room ${roomKey}`);
      socket.emit('joinedRoom', {
        roomKey,
        hostName: room.host.name,
        guestName: room.guest.name
      });
      io.to(room.host.id).emit('playerJoined', {
        hostName: room.host.name,
        guestName: room.guest.name
      });
    } else {
      socket.emit('error', 'Room is full or does not exist.');
    }
  });

  // --- START THE GAME ---
  socket.on('startGame', async (roomKey) => {
    const room = activeRooms[roomKey];
    if (room && room.host.id === socket.id) {
      try {
        const response = await axios.get(TRIVIA_API_URL);
        const questions = response.data.map(q => ({
          question: q.question,
          options: [...q.incorrectAnswers, q.correctAnswer],
          correctAnswer: q.correctAnswer
        }));
        io.to(roomKey).emit('gameStarted', questions);
      } catch (error) {
        console.error('Failed to fetch trivia questions:', error.message);
        io.to(roomKey).emit('error', 'Failed to load questions.');
      }
    }
  });

  // --- RECEIVE FINAL SCORE ---
  socket.on('submitScore', ({ roomKey, score }) => {
    const room = activeRooms[roomKey];
    if (room && room.scores) {
      room.scores[socket.username] = score;
      if (Object.keys(room.scores).length === 2) {
        const hostName = room.host.name;
        const guestName = room.guest.name;
        const hostScore = room.scores[hostName] || 0;
        const guestScore = room.scores[guestName] || 0;

        let hostResult, guestResult;
        if (hostScore > guestScore) {
          hostResult = `You won! (${hostScore} vs ${guestScore} for ${guestName})`;
          guestResult = `You lost! (${guestScore} vs ${hostScore} for ${hostName})`;
        } else if (guestScore > hostScore) {
          hostResult = `You lost! (${hostScore} vs ${guestScore} for ${guestName})`;
          guestResult = `You won! (${guestScore} vs ${hostScore} for ${hostName})`;
        } else {
          hostResult = `It's a tie! (${hostScore} vs ${guestScore})`;
          guestResult = `It's a tie! (${guestScore} vs ${hostScore})`;
        }
        io.to(room.host.id).emit('gameResult', hostResult);
        io.to(room.guest.id).emit('gameResult', guestResult);
        delete activeRooms[roomKey];
      }
    }
  });

  // --- Handle disconnection ---
  socket.on('disconnect', () => {
    console.log(`User ${socket.username} (${socket.id}) disconnected.`);
    // Clean up rooms on disconnect
    for (const roomKey in activeRooms) {
      const room = activeRooms[roomKey];
      if (room.host.id === socket.id) {
        io.to(roomKey).emit('error', 'The host has disconnected. Game over.');
        delete activeRooms[roomKey];
      } else if (room.guest && room.guest.id === socket.id) {
        io.to(room.host.id).emit('error', 'The guest has disconnected.');
        // Reset room for new guest
        room.guest = null;
        room.players = [room.host.name];
        room.scores = {};
      }
    }
  });
});

// --- THIS IS THE CRITICAL LINE FOR RENDER ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Game server running on port ${PORT}`);
});
