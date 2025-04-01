interface DummyRecipeData {
  name: string;
  time: number;
  servings: number;
  ingredients: {
    name: string;
    amount: number;
    unit: "g" | "ml" | "u";
  }[];
  instructions: string[];
  image_url?: string;
}

const dummyRecipeImages = [
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd",
];

export function generateDummyRecipe(
  type: "cooking" | "cleaning"
): DummyRecipeData {
  if (type === "cleaning") {
    return {
      name: "Quick House Cleaning",
      time: 30,
      servings: 1,
      ingredients: [
        { name: "All-purpose cleaner", amount: 1, unit: "u" },
        { name: "Microfiber cloth", amount: 2, unit: "u" },
        { name: "Vacuum cleaner", amount: 1, unit: "u" },
      ],
      instructions: [
        "Dust all surfaces with microfiber cloth",
        "Spray surfaces with all-purpose cleaner",
        "Wipe clean with fresh microfiber cloth",
        "Vacuum all floors thoroughly",
      ],
      image_url:
        dummyRecipeImages[Math.floor(Math.random() * dummyRecipeImages.length)],
    };
  }

  return {
    name: "Delicious Pasta Dish",
    time: 25,
    servings: 4,
    ingredients: [
      { name: "Pasta", amount: 500, unit: "g" },
      { name: "Olive oil", amount: 30, unit: "ml" },
      { name: "Garlic cloves", amount: 3, unit: "u" },
      { name: "Cherry tomatoes", amount: 200, unit: "g" },
      { name: "Fresh basil", amount: 10, unit: "g" },
    ],
    instructions: [
      "Boil water and cook pasta according to package instructions",
      "Heat olive oil in a pan and sauté minced garlic",
      "Add halved cherry tomatoes and cook until softened",
      "Toss cooked pasta with the sauce",
      "Garnish with fresh basil leaves",
    ],
    image_url:
      dummyRecipeImages[Math.floor(Math.random() * dummyRecipeImages.length)],
  };
}
