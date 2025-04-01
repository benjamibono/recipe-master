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

    const prompt = `Analyze these recipe ingredients and provide a nutritional summary in the following exact format:
Energy value: [number] Cal
Protein: [number] g
Carbs: [number] g
Fats: [number] g

Ingredients: ${ingredientsText}

Ensure the output follows this exact format with the specified units.`;

    const response = await openai.responses.create({
      model: process.env.NEXT_PUBLIC_OPENAI_MODEL || "gpt-4o-mini-2024-07-18",
      input: prompt,
    });

    // Debug logging
    console.log("Raw response:", response.output_text);
    const formattedResponse = response.output_text.trim();
    console.log("Trimmed response:", formattedResponse);

    // More lenient validation that allows for potential whitespace variations
    const lines = formattedResponse.split("\n").map((line) => line.trim());
    const isValid =
      lines.length === 4 &&
      lines[0].startsWith("Energy value:") &&
      lines[1].startsWith("Protein:") &&
      lines[2].startsWith("Carbs:") &&
      lines[3].startsWith("Fats:");

    if (!isValid) {
      console.error("Invalid response format. Lines:", lines);
      throw new Error("Response format is invalid");
    }

    // Format the response to ensure exact format
    return (
      `Energy value: ${lines[0].split(":")[1].trim()}\n` +
      `Protein: ${lines[1].split(":")[1].trim()}\n` +
      `Carbs: ${lines[2].split(":")[1].trim()}\n` +
      `Fats: ${lines[3].split(":")[1].trim()}`
    );
  } catch (error) {
    console.error("Error analyzing recipe macros:", error);
    throw error;
  }
}
