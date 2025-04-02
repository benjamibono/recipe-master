import OpenAI from "openai";

export interface GeneratedRecipe {
  name: string;
  time: number;
  servings: number;
  ingredients: { name: string; amount: number; unit: "g" | "ml" | "u" }[];
  instructions: string[];
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateRecipeFromName(
  recipeName: string
): Promise<GeneratedRecipe> {
  try {
    const prompt = `Create a detailed recipe for "${recipeName}". 
    The recipe should be practical and use common ingredients. 
    You must respond with ONLY a valid JSON object, no other text.
    
    The JSON must follow this exact structure:
    {
      "name": "Recipe name",
      "time": number (preparation time in minutes),
      "servings": number (number of servings),
      "ingredients": [
        {
          "name": "ingredient name",
          "amount": number,
          "unit": "g" or "ml" or "u" (must be exactly one of these three values)
        }
      ],
      "instructions": [
        "step 1",
        "step 2",
        ...
      ]
    }

    Important rules:
    1. The unit field must be exactly one of: "g", "ml", or "u"
    2. All numbers must be valid numbers (not strings)
    3. The response must be valid JSON that can be parsed
    4. Do not include any text before or after the JSON object
    5. Spices and herbs unit fields must be "g"`;

    const response = await openai.responses.create({
      model: process.env.NEXT_PUBLIC_OPENAI_MODEL || "gpt-4o-mini-2024-07-18",
      input: prompt,
    });

    // Debug logging
    console.log("Raw response:", response.output_text);

    // Try to clean the response text before parsing
    const cleanedText = response.output_text.trim();
    console.log("Cleaned response:", cleanedText);

    let recipeData;
    try {
      recipeData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Failed to parse text:", cleanedText);
      throw new Error("Failed to parse recipe data");
    }

    // Validate the structure
    if (
      !recipeData.name ||
      !recipeData.time ||
      !recipeData.servings ||
      !Array.isArray(recipeData.ingredients) ||
      !Array.isArray(recipeData.instructions)
    ) {
      throw new Error("Invalid recipe structure");
    }

    // Validate and ensure unit types are correct
    recipeData.ingredients = recipeData.ingredients.map(
      (ing: { name: string; amount: number; unit: string }) => ({
        ...ing,
        unit:
          ing.unit === "g" || ing.unit === "ml" || ing.unit === "u"
            ? ing.unit
            : "u",
      })
    );

    return recipeData;
  } catch (error) {
    console.error("Error generating recipe:", error);
    throw error;
  }
}
