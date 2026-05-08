export interface WordCategory {
  id: string;
  label: string;
  words: readonly string[];
}

export const WORD_CATEGORIES: readonly WordCategory[] = [
  {
    id: "everyday",
    label: "Everyday",
    words: [
      "Backpack",
      "Mirror",
      "Calendar",
      "Umbrella",
      "Headphones",
      "Toothbrush",
      "Elevator",
      "Blanket",
      "Notebook",
      "Remote control",
      "Coffee mug",
      "Wallet",
      "Laundry",
      "Window",
      "Keyboard",
      "Sunglasses",
      "Doorbell",
      "Pillow",
      "Receipt",
      "Water bottle"
    ]
  },
  {
    id: "food",
    label: "Food",
    words: [
      "Pizza",
      "Sushi",
      "Pancakes",
      "Taco",
      "Popcorn",
      "Avocado",
      "Chocolate",
      "Pasta",
      "Watermelon",
      "Cinnamon roll",
      "Falafel",
      "Lasagna",
      "Croissant",
      "Burger",
      "Ramen",
      "Ice cream",
      "Dumpling",
      "Nachos",
      "Pineapple",
      "Waffle"
    ]
  },
  {
    id: "places",
    label: "Places",
    words: [
      "Airport",
      "Library",
      "Beach",
      "Cinema",
      "Museum",
      "Hospital",
      "Hotel",
      "Playground",
      "Train station",
      "Restaurant",
      "Gym",
      "School",
      "Supermarket",
      "Theater",
      "Stadium",
      "Camping site",
      "Office",
      "Harbor",
      "Amusement park",
      "City hall"
    ]
  },
  {
    id: "entertainment",
    label: "Entertainment",
    words: [
      "Karaoke",
      "Board game",
      "Magic trick",
      "Concert",
      "Podcast",
      "Video game",
      "Talent show",
      "Stand-up comedy",
      "Documentary",
      "Reality show",
      "Cartoon",
      "Escape room",
      "Dance battle",
      "Movie trailer",
      "Festival",
      "Trivia night",
      "Photo booth",
      "Theme song",
      "Costume party",
      "Live stream"
    ]
  },
  {
    id: "sports",
    label: "Sports",
    words: [
      "Football",
      "Basketball",
      "Tennis",
      "Swimming",
      "Cycling",
      "Skateboarding",
      "Volleyball",
      "Boxing",
      "Skiing",
      "Golf",
      "Table tennis",
      "Hockey",
      "Running",
      "Climbing",
      "Surfing",
      "Baseball",
      "Handball",
      "Rugby",
      "Badminton",
      "Gymnastics"
    ]
  }
];

export function getCategory(categoryId: string): WordCategory | undefined {
  return WORD_CATEGORIES.find((category) => category.id === categoryId);
}
