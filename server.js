// server.js (UPDATED)
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

// --- NEW: SERVE THE CLIENT FILES ---
// This tells Express to serve your index.html, style.css, etc.
// from the 'public' folder.
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));
// ------------------------------------

// --- Random Name Generator (Unchanged) ---
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

  // ... (All your other socket.on events are THE SAME) ...
  // 'createRoom', 'joinRoom', 'startGame', 'submitScore', 'disconnect'
  // NO CHANGES NEEDED for them.
});

const PORT = process.env.PORT || 3000; // Use port from environment or 3000
server.listen(PORT, () => {
  console.log(`Game server running on port ${PORT}`);
});