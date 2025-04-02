import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { transcription } = await request.json();

    if (!transcription) {
      return NextResponse.json(
        { error: "No transcription provided" },
        { status: 400 }
      );
    }

    // First, check if the text is in Spanish and translate if needed
    const translationPrompt = `Translate the following recipe transcription from Spanish to English. 
    If the text is already in English, return it as is. 
    If it's in Spanish, translate it to English.
    Keep any numbers and units as they are.
    
    Text to translate:
    ${transcription}`;

    const translationResponse = await openai.chat.completions.create({
      model: process.env.NEXT_PUBLIC_OPENAI_MODEL || "gpt-4o-mini-2024-07-18",
      messages: [{ role: "user", content: translationPrompt }],
    });

    const translatedText =
      translationResponse.choices[0].message.content?.trim();
    if (!translatedText) {
      throw new Error("Empty translation response from OpenAI");
    }

    const prompt = `Parse the following recipe transcription into structured data. 
    Extract the recipe name, preparation time (in minutes), number of servings, ingredients with amounts and units, and cooking instructions.
    You must respond with ONLY a valid JSON object, no other text.
    
    Transcription:
    ${translatedText}
    
    The JSON must follow this exact structure:
    {
      "name": "Recipe name (if mentioned)",
      "time": number (preparation time in minutes, if mentioned, otherwise null),
      "servings": number (if mentioned, otherwise null),
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
    5. If a field cannot be determined from the transcription, use null
    6. Convert any spoken numbers to digits (e.g., "two cups" -> 2, "ml")
    7. Standardize units (e.g., "cups" -> "ml", "pieces" -> "u")
    8. Extract preparation time if mentioned (e.g., "takes 30 minutes" -> 30)`;

    const response = await openai.chat.completions.create({
      model: process.env.NEXT_PUBLIC_OPENAI_MODEL || "gpt-4o-mini-2024-07-18",
      messages: [{ role: "user", content: prompt }],
    });

    const cleanedText = response.choices[0].message.content?.trim();
    if (!cleanedText) {
      throw new Error("Empty response from OpenAI");
    }

    let recipeData;
    try {
      recipeData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Failed to parse text:", cleanedText);
      throw new Error("Failed to parse recipe data");
    }

    return NextResponse.json(recipeData);
  } catch (error) {
    console.error("Error parsing recipe:", error);
    return NextResponse.json(
      { error: "Failed to parse recipe" },
      { status: 500 }
    );
  }
}
