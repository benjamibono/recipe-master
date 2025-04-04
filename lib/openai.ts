import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeRecipeMacros(
  ingredients: { name: string; amount: string; unit: string }[]
) {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      attempts++;
      const ingredientsText = ingredients
        .map((ing) => `${ing.amount} ${ing.unit} ${ing.name}`)
        .join(", ");

      const prompt = `Analyze these recipe ingredients and provide a nutritional summary in the following EXACT format:
Energy value: [number] Cal
Protein: [number] g
Carbs: [number] g
Fats: [number] g

Ingredients: ${ingredientsText}

IMPORTANT: Your response MUST follow this EXACT format with the specified units. Do not include any additional text or explanations.`;

      const response = await openai.responses.create({
        model: process.env.NEXT_PUBLIC_OPENAI_MODEL || "gpt-4o-mini-2024-07-18",
        input: prompt,
      });

      // Debug logging
      console.log(`Attempt ${attempts} - Raw response:`, response.output_text);
      const formattedResponse = response.output_text.trim();
      console.log(`Attempt ${attempts} - Trimmed response:`, formattedResponse);

      // More lenient validation that allows for potential whitespace variations
      const lines = formattedResponse.split("\n").map((line) => line.trim());
      const isValid =
        lines.length === 4 &&
        lines[0].startsWith("Energy value:") &&
        lines[1].startsWith("Protein:") &&
        lines[2].startsWith("Carbs:") &&
        lines[3].startsWith("Fats:");

      if (!isValid) {
        console.error(
          `Attempt ${attempts} - Invalid response format. Lines:`,
          lines
        );

        // If we've reached the maximum attempts, try to fix the format
        if (attempts === maxAttempts) {
          console.log(
            "Maximum attempts reached. Attempting to fix the format..."
          );

          // Try to extract the values from the response even if format is not perfect
          const energyMatch = formattedResponse.match(
            /Energy value:?\s*([\d,.]+)\s*Cal/i
          );
          const proteinMatch = formattedResponse.match(
            /Protein:?\s*([\d,.]+)\s*g/i
          );
          const carbsMatch = formattedResponse.match(
            /Carbs:?\s*([\d,.]+)\s*g/i
          );
          const fatsMatch = formattedResponse.match(/Fats:?\s*([\d,.]+)\s*g/i);

          if (energyMatch && proteinMatch && carbsMatch && fatsMatch) {
            // Return a properly formatted response with the extracted values
            return (
              `Energy value: ${energyMatch[1].trim()}\n` +
              `Protein: ${proteinMatch[1].trim()}\n` +
              `Carbs: ${carbsMatch[1].trim()}\n` +
              `Fats: ${fatsMatch[1].trim()}`
            );
          }

          // If we couldn't extract the values, throw an error
          throw new Error("Response format is invalid after multiple attempts");
        }

        // Continue to the next attempt
        continue;
      }

      // Format the response to ensure exact format
      return (
        `Energy value: ${lines[0].split(":")[1].trim()}\n` +
        `Protein: ${lines[1].split(":")[1].trim()}\n` +
        `Carbs: ${lines[2].split(":")[1].trim()}\n` +
        `Fats: ${lines[3].split(":")[1].trim()}`
      );
    } catch (error) {
      console.error(
        `Attempt ${attempts} - Error analyzing recipe macros:`,
        error
      );

      // If this is the last attempt, throw the error
      if (attempts === maxAttempts) {
        throw error;
      }

      // Otherwise, continue to the next attempt
      continue;
    }
  }

  // This should never be reached due to the throw in the last attempt
  throw new Error("Failed to analyze recipe macros after multiple attempts");
}
