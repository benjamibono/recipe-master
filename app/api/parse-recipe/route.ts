import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Función para parsear recetas en un solo paso, reduciendo el número de llamadas a OpenAI
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

    // Realizar todo el procesamiento en una sola llamada a la API
    const combinedPrompt = `
    Analiza esta transcripción de una receta y extrae la información estructurada.
    La transcripción está en ${
      detectedLanguage === "es" ? "español" : "inglés"
    }.

    Transcripción:
    ${transcription}

    Responde solo con un JSON válido que contenga los siguientes campos:
    - name: nombre de la receta (string o vacío)
    - time: tiempo de preparación en minutos (número entero o 0)
    - servings: número de porciones/personas (número entero o 1)
    - ingredients: array de ingredientes, cada uno con {name, amount, unit} donde unit debe ser exactamente "g", "ml" o "u"
    - instructions: array de pasos/instrucciones

    Asegúrate de que:
    1. Si un valor no se puede determinar, usa valores por defecto
    2. Las unidades deben normalizarse a "g" (gramos), "ml" (mililitros) o "u" (unidades)
    3. Evita valores null en la respuesta
    4. La respuesta debe estar en el idioma original (${detectedLanguage})

    Importante: Solo devuelve JSON válido sin explicaciones ni markdown.
    `;

    const response = await openai.chat.completions.create({
      model: process.env.NEXT_PUBLIC_OPENAI_MODEL || "gpt-4o-mini-2024-07-18",
      messages: [{ role: "user", content: combinedPrompt }],
      response_format: { type: "json_object" }, // Forzar formato JSON
    });

    const content = response.choices[0].message.content?.trim();
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    let recipeData;
    try {
      // Limpiar posibles marcas de Markdown si las hubiera a pesar de forzar json_object
      let cleanedContent = content;
      if (cleanedContent.startsWith("```")) {
        cleanedContent = cleanedContent
          .replace(/^```(json)?\n/, "")
          .replace(/\n```$/, "");
      }

      recipeData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Failed to parse text:", content);
      throw new Error("Failed to parse recipe data");
    }

    // Convertir valores null o undefined a valores por defecto
    recipeData.name = recipeData.name || "";
    recipeData.time = recipeData.time || 0;
    recipeData.servings = recipeData.servings || 1;
    recipeData.ingredients = recipeData.ingredients || [];
    recipeData.instructions = recipeData.instructions || [];

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
