/*
# Seed question bank

Populates the `questions` table with 40 starter questions across Math,
Logic, Words, Science, Trivia, and Patterns categories at easy/medium/hard
difficulty. This is reference content (not user data), so a one-time insert
is appropriate. Uses ON CONFLICT DO NOTHING so re-running is safe.
*/

INSERT INTO questions (question, options, correct_answer, category, difficulty) VALUES
  ('What is 7 × 8?', ARRAY['54','56','64','48'], 1, 'Math', 'easy'),
  ('What is 15% of 200?', ARRAY['30','25','35','20'], 0, 'Math', 'medium'),
  ('Solve: 144 ÷ 12', ARRAY['10','11','12','14'], 2, 'Math', 'easy'),
  ('What is 9²?', ARRAY['72','81','99','108'], 1, 'Math', 'medium'),
  ('What is the square root of 169?', ARRAY['11','12','13','14'], 2, 'Math', 'medium'),
  ('What is 25 + 38?', ARRAY['53','63','73','58'], 1, 'Math', 'easy'),
  ('If x + 7 = 15, x = ?', ARRAY['6','7','8','9'], 2, 'Math', 'easy'),
  ('What is 3/4 as a decimal?', ARRAY['0.25','0.5','0.75','0.8'], 2, 'Math', 'medium'),
  ('What comes next: 2, 4, 8, 16, ?', ARRAY['20','24','32','36'], 2, 'Patterns', 'easy'),
  ('Find the next: 1, 1, 2, 3, 5, 8, ?', ARRAY['11','13','15','16'], 1, 'Patterns', 'medium'),
  ('Next in series: 3, 6, 12, 24, ?', ARRAY['36','48','60','30'], 1, 'Patterns', 'easy'),
  ('Complete: 100, 95, 85, 70, ?', ARRAY['55','50','60','45'], 1, 'Patterns', 'hard'),
  ('Which word is a synonym for "happy"?', ARRAY['Sad','Joyful','Angry','Tired'], 1, 'Words', 'easy'),
  ('What is the antonym of "ancient"?', ARRAY['Old','Historic','Modern','Classic'], 2, 'Words', 'easy'),
  ('Which is a palindrome?', ARRAY['Racecar','Apple','Window','Planet'], 0, 'Words', 'medium'),
  ('How many letters in "encyclopedia"?', ARRAY['10','11','12','13'], 2, 'Words', 'medium'),
  ('What is the chemical symbol for water?', ARRAY['O2','H2O','CO2','NaCl'], 1, 'Science', 'easy'),
  ('What planet is known as the Red Planet?', ARRAY['Venus','Jupiter','Mars','Saturn'], 2, 'Science', 'easy'),
  ('What gas do plants absorb from the air?', ARRAY['Oxygen','Nitrogen','Carbon Dioxide','Hydrogen'], 2, 'Science', 'medium'),
  ('How many bones are in the adult human body?', ARRAY['186','206','226','246'], 1, 'Science', 'hard'),
  ('What is the speed of light (approx)?', ARRAY['300,000 km/s','150,000 km/s','500,000 km/s','1,000 km/s'], 0, 'Science', 'hard'),
  ('If all cats are animals, and some animals are pets, then...', ARRAY['All cats are pets','Some cats may be pets','No cats are pets','All pets are cats'], 1, 'Logic', 'medium'),
  ('Which number is odd one out: 4, 9, 16, 25, 30?', ARRAY['4','9','16','30'], 3, 'Logic', 'medium'),
  ('A is taller than B. B is taller than C. Who is shortest?', ARRAY['A','B','C','Cannot tell'], 2, 'Logic', 'easy'),
  ('If today is Monday, what day is in 3 days?', ARRAY['Wednesday','Thursday','Friday','Saturday'], 1, 'Logic', 'easy'),
  ('Which is heavier: 1kg of feathers or 1kg of iron?', ARRAY['Feathers','Iron','Same','Depends'], 2, 'Logic', 'easy'),
  ('What is the capital of France?', ARRAY['Berlin','Madrid','Paris','Rome'], 2, 'Trivia', 'easy'),
  ('How many continents are there?', ARRAY['5','6','7','8'], 2, 'Trivia', 'easy'),
  ('Which ocean is the largest?', ARRAY['Atlantic','Indian','Arctic','Pacific'], 3, 'Trivia', 'medium'),
  ('Who painted the Mona Lisa?', ARRAY['Van Gogh','Picasso','Da Vinci','Monet'], 2, 'Trivia', 'medium'),
  ('What is the largest mammal?', ARRAY['Elephant','Blue Whale','Giraffe','Hippo'], 1, 'Trivia', 'easy'),
  ('How many sides does a hexagon have?', ARRAY['5','6','7','8'], 1, 'Math', 'easy'),
  ('What is 11 × 11?', ARRAY['111','121','131','101'], 1, 'Math', 'easy'),
  ('Next in pattern: A, C, E, G, ?', ARRAY['H','I','J','K'], 1, 'Patterns', 'medium'),
  ('What is the boiling point of water in °C?', ARRAY['90','100','110','80'], 1, 'Science', 'easy'),
  ('Which shape has 3 sides?', ARRAY['Square','Circle','Triangle','Pentagon'], 2, 'Math', 'easy'),
  ('What is 50 - 17?', ARRAY['27','33','43','37'], 1, 'Math', 'easy'),
  ('How many minutes in 2 hours?', ARRAY['60','100','120','150'], 2, 'Math', 'easy'),
  ('Which is a prime number?', ARRAY['9','15','17','21'], 2, 'Math', 'medium'),
  ('What color do you get mixing blue and yellow?', ARRAY['Green','Orange','Purple','Brown'], 0, 'Trivia', 'easy')
ON CONFLICT DO NOTHING;