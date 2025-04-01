import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeRecipeMacros(
  ingredients: { name: string; amount: string; unit: string }[]
) {
  try {
    const ingredientsText = ingredients
      .map((ing) => `${ing.amount} ${ing.unit} ${ing.name}`)
      .join(", ");

    const prompt = `Analyze these recipe ingredients and provide a brief nutritional summary including calories, protein, carbs, and fats. Keep it concise and professional. Ingredients: ${ingredientsText}`;

    const response = await openai.responses.create({
      model: process.env.NEXT_PUBLIC_OPENAI_MODEL || "gpt-4o-mini-2024-07-18",
      input: prompt,
    });

    return response.output_text;
  } catch (error) {
    console.error("Error analyzing recipe macros:", error);
    throw error;
  }
}
