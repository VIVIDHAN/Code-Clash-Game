// quiz.js (UPDATED)

document.addEventListener('DOMContentLoaded', () => {

  // --- Socket.io Connection ---
  // const socket = io('http://localhost:3000'); // DELETE THIS
  const socket = io(); // ADD THIS
  // This tells Socket.io to connect to the *same server*
  // that sent the index.html file. It works for
  // localhost AND your public website automatically!

  // ... (All your other quiz.js code is THE SAME) ...

});