// questions.js

// By moving this to its own file, your main quiz.js file
// becomes cleaner and focused only on logic.
// You could easily swap this file for another set of questions.

const quesJSON = [
  {
    correctAnswer: 'Blue Whale',
    options: ['Elephant', 'Blue Whale', 'Giraffe', 'Hippopotamus'],
    question: 'What is the largest animal on Earth?',
  },
  {
    correctAnswer: 'Albert Einstein',
    options: [
      'Isaac Newton',
      'Albert Einstein',
      'Nikola Tesla',
      'Stephen Hawking',
    ],
    question: 'Who developed the theory of relativity?',
  },
  {
    correctAnswer: 'Pacific Ocean',
    options: [
      'Atlantic Ocean',
      'Indian Ocean',
      'Arctic Ocean',
      'Pacific Ocean',
    ],
    question: 'Which is the largest ocean in the world?',
  },
  {
    correctAnswer: 'Mars',
    options: ['Venus', 'Jupiter', 'Saturn', 'Mars'],
    question: 'Which planet is known as the Red Planet?',
  },
  {
    correctAnswer: 'William Shakespeare',
    options: [
      'William Wordsworth',
      'Charles Dickens',
      'William Shakespeare',
      'George Orwell',
    ],
    question: "Who wrote the play 'Romeo and Juliet'?",
  },
];