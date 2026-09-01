export const MOTIVATIONAL_MESSAGES = [
  'Small progress every day creates big results.',
  'You showed up today. That\'s a win.',
  'Your only competition is yesterday\'s you.',
  'Keep going. Your next level is waiting.',
  'Great job! Keep going.',
  'You are getting better every day!',
  'Tomorrow, beat your score!',
  'Consistency beats intensity. You\'re on track.',
  'Every correct answer is a step forward.',
  'Champions are made one day at a time.',
  'You played. You learned. You grew.',
  'Progress, not perfection. Well done.',
  'A streak is built one day at a time. Nice work.',
  'Your brain just got a little stronger.',
  'Showing up is half the battle. You won today.',
  'Small steps, big journey. Keep walking.',
  'Today\'s effort is tomorrow\'s strength.',
  'You turned minutes into momentum.',
  'Focus for 60 seconds. Mastery for life.',
  'The best time to start was yesterday. You started today.',
  'Discipline today, freedom tomorrow.',
  'You didn\'t skip. That matters.',
  'One more day, one more level.',
  'Your future self thanks you for today.',
  'Every rep counts. You just logged yours.',
  'Slow is smooth. Smooth is fast. Keep going.',
  'You proved you can focus. Use that everywhere.',
  'A minute a day keeps the rust away.',
  'Today you added a brick to the wall.',
  'Momentum is on your side. Ride it tomorrow.',
  'You\'re not lucky. You\'re consistent.',
  'The gap between you and your goal just shrank.',
];

export function getMotivationalMessage(score: number, best: number): string {
  const pool = [...MOTIVATIONAL_MESSAGES];
  let pick: string;
  if (score >= best && score > 0) {
    const high = pool.filter((m) =>
      /better|next level|champion|momentum|stronger|grew|won|mastery/i.test(m)
    );
    pick = high[Math.floor(Math.random() * high.length)] ?? pool[0];
  } else if (score > 0) {
    pick = pool[Math.floor(Math.random() * pool.length)];
  } else {
    const low = pool.filter((m) =>
      /showed up|started|skip|half the battle|one more day/i.test(m)
    );
    pick = low[Math.floor(Math.random() * low.length)] ?? pool[1];
  }
  return pick;
}
