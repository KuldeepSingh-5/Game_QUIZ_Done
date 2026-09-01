import { connectDB } from '../config/db.js';
import { Question } from '../models/Question.js';

const SEED_QUESTIONS = [
  { question: 'What is 7 × 8?', options: ['54', '56', '64', '48'], correctAnswer: 1, category: 'Math', difficulty: 'easy' },
  { question: 'What is 15% of 200?', options: ['30', '25', '35', '20'], correctAnswer: 0, category: 'Math', difficulty: 'medium' },
  { question: 'Solve: 144 ÷ 12', options: ['10', '11', '12', '14'], correctAnswer: 2, category: 'Math', difficulty: 'easy' },
  { question: 'What is 9²?', options: ['72', '81', '99', '108'], correctAnswer: 1, category: 'Math', difficulty: 'medium' },
  { question: 'What is the square root of 169?', options: ['11', '12', '13', '14'], correctAnswer: 2, category: 'Math', difficulty: 'medium' },
  { question: 'What comes next: 2, 4, 8, 16, ?', options: ['20', '24', '32', '36'], correctAnswer: 2, category: 'Patterns', difficulty: 'easy' },
  { question: 'Find the next: 1, 1, 2, 3, 5, 8, ?', options: ['11', '13', '15', '16'], correctAnswer: 1, category: 'Patterns', difficulty: 'medium' },
  { question: 'Next in series: 3, 6, 12, 24, ?', options: ['36', '48', '60', '30'], correctAnswer: 1, category: 'Patterns', difficulty: 'easy' },
  { question: 'Complete: 100, 95, 85, 70, ?', options: ['55', '50', '60', '45'], correctAnswer: 1, category: 'Patterns', difficulty: 'hard' },
  { question: 'Which word is a synonym for "happy"?', options: ['Sad', 'Joyful', 'Angry', 'Tired'], correctAnswer: 1, category: 'Words', difficulty: 'easy' },
  { question: 'What is the antonym of "ancient"?', options: ['Old', 'Historic', 'Modern', 'Classic'], correctAnswer: 2, category: 'Words', difficulty: 'easy' },
  { question: 'Which is a palindrome?', options: ['Racecar', 'Apple', 'Window', 'Planet'], correctAnswer: 0, category: 'Words', difficulty: 'medium' },
  { question: 'What is the chemical symbol for water?', options: ['O2', 'H2O', 'CO2', 'NaCl'], correctAnswer: 1, category: 'Science', difficulty: 'easy' },
  { question: 'What planet is known as the Red Planet?', options: ['Venus', 'Jupiter', 'Mars', 'Saturn'], correctAnswer: 2, category: 'Science', difficulty: 'easy' },
  { question: 'What gas do plants absorb from the air?', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], correctAnswer: 2, category: 'Science', difficulty: 'medium' },
  { question: 'How many bones are in the adult human body?', options: ['186', '206', '226', '246'], correctAnswer: 1, category: 'Science', difficulty: 'hard' },
  { question: 'A is taller than B. B is taller than C. Who is shortest?', options: ['A', 'B', 'C', 'Cannot tell'], correctAnswer: 2, category: 'Logic', difficulty: 'easy' },
  { question: 'If today is Monday, what day is in 3 days?', options: ['Wednesday', 'Thursday', 'Friday', 'Saturday'], correctAnswer: 1, category: 'Logic', difficulty: 'easy' },
  { question: 'Which is heavier: 1kg of feathers or 1kg of iron?', options: ['Feathers', 'Iron', 'Same', 'Depends'], correctAnswer: 2, category: 'Logic', difficulty: 'easy' },
  { question: 'What is the capital of France?', options: ['Berlin', 'Madrid', 'Paris', 'Rome'], correctAnswer: 2, category: 'Trivia', difficulty: 'easy' },
  { question: 'How many continents are there?', options: ['5', '6', '7', '8'], correctAnswer: 2, category: 'Trivia', difficulty: 'easy' },
  { question: 'Which ocean is the largest?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], correctAnswer: 3, category: 'Trivia', difficulty: 'medium' },
  { question: 'Who painted the Mona Lisa?', options: ['Van Gogh', 'Picasso', 'Da Vinci', 'Monet'], correctAnswer: 2, category: 'Trivia', difficulty: 'medium' },
  { question: 'What is the largest mammal?', options: ['Elephant', 'Blue Whale', 'Giraffe', 'Hippo'], correctAnswer: 1, category: 'Trivia', difficulty: 'easy' },
  { question: 'How many sides does a hexagon have?', options: ['5', '6', '7', '8'], correctAnswer: 1, category: 'Math', difficulty: 'easy' },
  { question: 'What is 11 × 11?', options: ['111', '121', '131', '101'], correctAnswer: 1, category: 'Math', difficulty: 'easy' },
  { question: 'Next in pattern: A, C, E, G, ?', options: ['H', 'I', 'J', 'K'], correctAnswer: 1, category: 'Patterns', difficulty: 'medium' },
  { question: 'What is the boiling point of water in °C?', options: ['90', '100', '110', '80'], correctAnswer: 1, category: 'Science', difficulty: 'easy' },
  { question: 'Which shape has 3 sides?', options: ['Square', 'Circle', 'Triangle', 'Pentagon'], correctAnswer: 2, category: 'Math', difficulty: 'easy' },
  { question: 'Which is a prime number?', options: ['9', '15', '17', '21'], correctAnswer: 2, category: 'Math', difficulty: 'medium' },
  { question: 'What color do you get mixing blue and yellow?', options: ['Green', 'Orange', 'Purple', 'Brown'], correctAnswer: 0, category: 'Trivia', difficulty: 'easy' },
  { question: 'What is the speed of light (approx)?', options: ['300,000 km/s', '150,000 km/s', '500,000 km/s', '1,000 km/s'], correctAnswer: 0, category: 'Science', difficulty: 'hard' },
  { question: 'Which number is the odd one out: 4, 9, 16, 25, 30?', options: ['4', '9', '16', '30'], correctAnswer: 3, category: 'Logic', difficulty: 'medium' },
  { question: 'If all cats are animals, and some animals are pets, then...', options: ['All cats are pets', 'Some cats may be pets', 'No cats are pets', 'All pets are cats'], correctAnswer: 1, category: 'Logic', difficulty: 'medium' },
  { question: 'How many minutes in 2 hours?', options: ['60', '100', '120', '150'], correctAnswer: 2, category: 'Math', difficulty: 'easy' },
  { question: 'What is 50 - 17?', options: ['27', '33', '43', '37'], correctAnswer: 1, category: 'Math', difficulty: 'easy' },
  { question: 'What is 3/4 as a decimal?', options: ['0.25', '0.5', '0.75', '0.8'], correctAnswer: 2, category: 'Math', difficulty: 'medium' },
  { question: 'How many letters in "encyclopedia"?', options: ['10', '11', '12', '13'], correctAnswer: 2, category: 'Words', difficulty: 'medium' },
  { question: 'If x + 7 = 15, x = ?', options: ['6', '7', '8', '9'], correctAnswer: 2, category: 'Math', difficulty: 'easy' },
  { question: 'What is 25 + 38?', options: ['53', '63', '73', '58'], correctAnswer: 1, category: 'Math', difficulty: 'easy' },
];

async function run() {
  await connectDB();
  await Question.deleteMany({});
  await Question.insertMany(SEED_QUESTIONS);
  console.log(`[seed] Inserted ${SEED_QUESTIONS.length} questions`);
  process.exit(0);
}

run().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
