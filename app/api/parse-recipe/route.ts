import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { transcription, language } = await request.json();
    const detectedLanguage = language || "en"; // Default a inglés si no se proporciona

    if (!transcription) {
      return NextResponse.json(
        { error: "No transcription provided" },
        { status: 400 }
      );
    }

    // Si el texto está en español, traducirlo a inglés para procesarlo
    let translatedText = transcription;
    if (detectedLanguage === "es") {
      const translationPrompt = `Translate the following recipe transcription from Spanish to English. 
      Keep any numbers and units as they are.
      
      Text to translate:
      ${transcription}`;

      const translationResponse = await openai.chat.completions.create({
        model: process.env.NEXT_PUBLIC_OPENAI_MODEL || "gpt-4o-mini-2024-07-18",
        messages: [{ role: "user", content: translationPrompt }],
      });

      translatedText =
        translationResponse.choices[0].message.content?.trim() || transcription;
    }

    // Analizar en inglés para obtener la estructura en formato JSON
    const parsePrompt = `Parse the following recipe transcription into structured data. 
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
      messages: [{ role: "user", content: parsePrompt }],
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

    // Convertir valores null a valores por defecto adecuados para React
    recipeData.name = recipeData.name || "";
    recipeData.time = recipeData.time || 0;
    recipeData.servings = recipeData.servings || 1;
    recipeData.ingredients = recipeData.ingredients || [];
    recipeData.instructions = recipeData.instructions || [];

    // Si el idioma original era español, traducir de nuevo los datos textuales a español
    if (detectedLanguage === "es") {
      const fieldsToTranslate = [
        { field: "name", type: "string" },
        { field: "ingredients", type: "array", subfield: "name" },
        { field: "instructions", type: "array" },
      ];

      for (const item of fieldsToTranslate) {
        if (item.type === "string" && recipeData[item.field]) {
          const translationPrompt = `Translate the following recipe ${
            item.field
          } from English to Spanish:
          
          "${recipeData[item.field]}"
          
          Reply with ONLY the translated text, without quotes or any other formatting.`;

          const translationResponse = await openai.chat.completions.create({
            model:
              process.env.NEXT_PUBLIC_OPENAI_MODEL || "gpt-4o-mini-2024-07-18",
            messages: [{ role: "user", content: translationPrompt }],
          });

          recipeData[item.field] =
            translationResponse.choices[0].message.content?.trim() ||
            recipeData[item.field];
        } else if (
          item.type === "array" &&
          recipeData[item.field] &&
          recipeData[item.field].length > 0
        ) {
          // Para arrays, preparamos un prompt con todos los elementos para evitar múltiples llamadas a la API
          const arrayContent = item.subfield
            ? recipeData[item.field].map(
                (element: { [key: string]: string | number }) =>
                  element[item.subfield as string]
              )
            : recipeData[item.field];

          const translationPrompt = `Translate the following ${
            item.field
          } from English to Spanish. 
          Return a JSON array with only the translated texts in the same order.
          IMPORTANT: Do not include any markdown formatting, code blocks, or backticks in your response.
          Return ONLY the raw JSON array without any decoration or explanation.
          
          ${JSON.stringify(arrayContent, null, 2)}`;

          const translationResponse = await openai.chat.completions.create({
            model:
              process.env.NEXT_PUBLIC_OPENAI_MODEL || "gpt-4o-mini-2024-07-18",
            messages: [{ role: "user", content: translationPrompt }],
          });

          const translatedContent =
            translationResponse.choices[0].message.content?.trim();
          if (translatedContent) {
            try {
              // Limpiar posibles marcas de Markdown
              let cleanedContent = translatedContent;

              // Eliminar backticks y etiquetas de formato markdown si existen
              if (cleanedContent.startsWith("```")) {
                cleanedContent = cleanedContent
                  .replace(/^```(json)?\n/, "") // Eliminar apertura de bloque de código
                  .replace(/\n```$/, ""); // Eliminar cierre de bloque de código
              }

              // Asegurar que el contenido comienza con "[" y termina con "]"
              if (
                !cleanedContent.trim().startsWith("[") ||
                !cleanedContent.trim().endsWith("]")
              ) {
                console.error(`Invalid JSON array format: ${cleanedContent}`);
                throw new Error("Invalid JSON array format");
              }

              const translatedArray = JSON.parse(cleanedContent);

              // Verificar que es un array
              if (!Array.isArray(translatedArray)) {
                throw new Error("Parsed result is not an array");
              }

              // Actualizar los elementos con las traducciones
              if (item.subfield) {
                recipeData[item.field].forEach(
                  (
                    element: { [key: string]: string | number },
                    index: number
                  ) => {
                    if (index < translatedArray.length) {
                      element[item.subfield as string] = translatedArray[index];
                    }
                  }
                );
              } else {
                recipeData[item.field] = translatedArray;
              }
            } catch (translationError) {
              console.error(
                `Error parsing ${item.field} translation:`,
                translationError
              );
              console.error("Content that failed to parse:", translatedContent);

              // Intento de recuperación para arrays simples con formato incorrecto
              try {
                if (item.field === "instructions") {
                  // Intento de recuperación para instrucciones: dividir por líneas y limpiar
                  const fallbackArray = translatedContent
                    .replace(/^```(json)?\n/, "") // Quitar inicio de bloque código
                    .replace(/\n```$/, "") // Quitar final de bloque código
                    .replace(/\[\n/, "") // Quitar apertura de array
                    .replace(/\n\]$/, "") // Quitar cierre de array
                    .split("\n") // Dividir por líneas
                    .map((line) => line.trim()) // Limpiar espacios
                    .filter((line) => line) // Eliminar líneas vacías
                    .map((line) => {
                      // Limpiar comillas y comas
                      return line
                        .replace(/^"/, "") // Quitar comillas de apertura
                        .replace(/",$/, "") // Quitar comillas de cierre con coma
                        .replace(/"$/, "") // Quitar comillas de cierre sin coma
                        .trim(); // Limpiar espacios
                    })
                    .filter((line) => line); // Filtrar líneas vacías otra vez

                  if (fallbackArray.length > 0) {
                    console.log(
                      "Recovered instructions using fallback method:",
                      fallbackArray
                    );
                    recipeData[item.field] = fallbackArray;
                  }
                }
              } catch (fallbackError) {
                console.error("Fallback parsing also failed:", fallbackError);
              }
            }
          }
        }
      }
    }

    // Añadir el idioma original a los datos
    recipeData.original_language = detectedLanguage;

    return NextResponse.json(recipeData);
  } catch (error) {
    console.error("Error parsing recipe:", error);
    return NextResponse.json(
      { error: "Failed to parse recipe" },
      { status: 500 }
    );
  }
}
