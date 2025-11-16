// public/quiz.js
document.addEventListener('DOMContentLoaded', () => {

  // --- THIS IS THE CRITICAL LINE FOR RENDER ---
  const socket = io();
  // ------------------------------------------

  let currentRoomKey = '';

  // --- DOM Elements ---
  const screens = {
    lobby: document.getElementById('lobby-screen'),
    waiting: document.getElementById('waiting-screen'),
    quiz: document.getElementById('quiz-screen'),
    result: document.getElementById('result-screen'),
  };
  const statusBar = document.getElementById('status-bar');
  const createBtn = document.getElementById('create-btn');
  const roomKeyDisplay = document.getElementById('room-key-display');
  const joinBtn = document.getElementById('join-btn');
  const keyInput = document.getElementById('key-input');
  const waitKeyDisplay = document.getElementById('wait-key-display');
  const waitMessage = document.getElementById('wait-message');
  const startBtn = document.getElementById('start-btn');
  const scoreEl = document.getElementById('score');
  const timerEl = document.getElementById('timer');
  const questionEl = document.getElementById('question');
  const optionsEl = document.getElementById('options');
  const resultMessageEl = document.getElementById('result-message');
  
  // --- UI Navigation ---
  function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.add('hidden'));
    screens[screenName].classList.remove('hidden');
  }

  // --- Quiz Game State ---
  let questions = [];
  let currentQuestionIndex = 0;
  let score = 0;
  let timer;
  const TIME_PER_QUESTION = 15;

  // --- Socket Event Handlers ---
  socket.on('connect', () => {
    statusBar.textContent = 'Status: Connected.';
    statusBar.style.backgroundColor = 'var(--accent-green)';
    statusBar.style.color = 'var(--bg-dark)';
  });

  socket.on('disconnect', () => {
    statusBar.textContent = 'Status: Disconnected. Reconnecting...';
    statusBar.style.backgroundColor = 'var(--accent-red)';
    statusBar.style.color = 'var(--bg-dark)';
  });

  socket.on('roomCreated', ({ roomKey, hostName }) => {
    currentRoomKey = roomKey;
    waitKeyDisplay.textContent = roomKey;
    waitMessage.textContent = `You are ${hostName}. Waiting for Player 2...`;
    showScreen('waiting');
  });

  socket.on('playerJoined', ({ hostName, guestName }) => {
    waitMessage.innerHTML = `You (${hostName}) are in the room.<br/><strong>${guestName}</strong> has joined!`;
    startBtn.classList.remove('hidden');
  });

  socket.on('joinedRoom', ({ roomKey, hostName, guestName }) => {
    currentRoomKey = roomKey;
    waitKeyDisplay.textContent = roomKey;
    waitMessage.innerHTML = `You (${guestName}) joined <strong>${hostName}'s</strong> room.<br/>Waiting for host to start...`;
    showScreen('waiting');
  });

  socket.on('gameStarted', (serverQuestions) => {
    questions = serverQuestions.map(q => ({
        ...q,
        options: shuffleOptions(q.options)
    }));
    currentQuestionIndex = 0;
    score = 0;
    showScreen('quiz');
    startQuiz();
  });

  socket.on('gameResult', (result) => {
    resultMessageEl.textContent = result;
    showScreen('result');
  });

  socket.on('error', (message) => {
    statusBar.textContent = `Error: ${message}`;
    statusBar.style.backgroundColor = 'var(--accent-red)';
    statusBar.style.color = 'var(--bg-dark)';
    // Go back to lobby on error
    setTimeout(() => {
        showScreen('lobby');
        statusBar.textContent = 'Status: Connected.';
        statusBar.style.backgroundColor = 'var(--accent-green)';
        statusBar.style.color = 'var(--bg-dark)';
    }, 3000);
  });

  // --- Lobby Click Handlers ---
  createBtn.addEventListener('click', () => {
    socket.emit('createRoom');
  });
  joinBtn.addEventListener('click', () => {
    const roomKey = keyInput.value;
    if (roomKey) socket.emit('joinRoom', roomKey);
  });
  startBtn.addEventListener('click', () => {
    socket.emit('startGame', currentRoomKey);
  });

  // --- Quiz Game Logic ---
  function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    scoreEl.textContent = `Score: 0`;
    showNextQuestion();
  }

  function showNextQuestion() {
    resetTimer();
    if (currentQuestionIndex >= questions.length) {
      endGame();
      return;
    }
    const q = questions[currentQuestionIndex];
    questionEl.innerHTML = q.question; // Use innerHTML to render entities
    optionsEl.innerHTML = '';
    q.options.forEach(option => {
      const btn = document.createElement('button');
      btn.innerHTML = option; // Use innerHTML
      btn.addEventListener('click', () => selectAnswer(btn, option, q.correctAnswer));
      optionsEl.appendChild(btn);
    });
    startTimer();
  }

  function selectAnswer(btn, selectedOption, correctAnswer) {
    clearInterval(timer);
    const isCorrect = selectedOption === correctAnswer;
    if (isCorrect) {
      score++;
      scoreEl.textContent = `Score: ${score}`;
    }
    
    Array.from(optionsEl.children).forEach(button => {
      button.disabled = true;
      if (button.innerHTML === correctAnswer) {
        button.classList.add('correct');
      } else if (button === btn && !isCorrect) {
        button.classList.add('wrong');
      }
    });
    
    setTimeout(() => {
      currentQuestionIndex++;
      showNextQuestion();
    }, 2000);
  }

  function startTimer() {
    let timeLeft = TIME_PER_QUESTION;
    timerEl.textContent = `Time: ${timeLeft}s`;
    timer = setInterval(() => {
      timeLeft--;
      timerEl.textContent = `Time: ${timeLeft}s`;
      if (timeLeft <= 0) {
        clearInterval(timer);
        handleTimeUp();
      }
    }, 1000);
  }

  function resetTimer() { clearInterval(timer); }

  function handleTimeUp() {
    Array.from(optionsEl.children).forEach(button => {
        button.disabled = true;
        if (button.innerHTML === questions[currentQuestionIndex].correctAnswer) {
            button.classList.add('correct');
        }
    });
    setTimeout(() => {
        currentQuestionIndex++;
        showNextQuestion();
    }, 2000);
  }

  function endGame() {
    questionEl.textContent = 'Quiz finished! Submitting score...';
    optionsEl.innerHTML = '';
    socket.emit('submitScore', { roomKey: currentRoomKey, score: score });
  }

  function shuffleOptions(options) {
    const shuffled = [...options];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  showScreen('lobby');
});
