
const adjectives = [
  'Giggling', 'Bouncy', 'Wobbly', 'Sparkling', 'Fizzy', 'Bubbly', 'Jiggly', 'Wiggly', 
  'Squeaky', 'Fluffy', 'Goofy', 'Silly', 'Zany', 'Quirky', 'Peppy', 'Snappy',
  'Bumpy', 'Lumpy', 'Jumpy', 'Funky', 'Spunky', 'Chunky', 'Clunky', 'Honky',
  'Wonky', 'Bonkers', 'Loopy', 'Droopy', 'Snoopy', 'Goopy', 'Swoopy', 'Poopy'
];

const nouns = [
  'Pickle', 'Noodle', 'Banana', 'Muffin', 'Waffle', 'Pancake', 'Cupcake', 'Cookie',
  'Pretzel', 'Bagel', 'Donut', 'Taco', 'Burrito', 'Pizza', 'Sandwich', 'Hotdog',
  'Spaghetti', 'Ravioli', 'Dumpling', 'Wontons', 'Sushi', 'Tempura', 'Kimchi', 'Tofu',
  'Cheese', 'Butter', 'Yogurt', 'Pudding', 'Jello', 'Smoothie', 'Milkshake', 'Latte'
];

export const generateFunnyName = (): string => {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 999) + 1;
  return `${adjective} ${noun} ${number}`;
};
