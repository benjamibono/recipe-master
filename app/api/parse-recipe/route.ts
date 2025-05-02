import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { transcription, language } = await request.json();
    const detectedLanguage = language || "en";

    if (!transcription) {
      return NextResponse.json(
        { error: "No transcription provided" },
        { status: 400 }
      );
    }

    // Limitar longitud del texto para evitar tiempos de procesamiento excesivos
    const limitedTranscription = transcription.slice(0, 3000);

    // Prompt optimizado que funciona bien en ambos idiomas
    const prompt = `
    ${
      detectedLanguage === "es"
        ? "Analiza esta transcripción de receta en español"
        : "Analyze this recipe transcription in English"
    }.
    
    Transcripción:
    ${limitedTranscription}
    
    Extrae y devuelve SOLO un objeto JSON con la siguiente estructura:
    {
      "name": "nombre de la receta",
      "time": número de minutos de preparación (o 0 si no se menciona),
      "servings": número de porciones (o 1 si no se menciona),
      "ingredients": [
        {"name": "nombre del ingrediente", "amount": cantidad numérica, "unit": "g"/"ml"/"u"}
      ],
      "instructions": ["paso 1", "paso 2", ...]
    }
    
    Reglas importantes:
    1. La unidad debe ser exactamente "g" (gramos), "ml" (mililitros) o "u" (unidades/piezas)
    2. Detecta cantidades y conviértelas a números (ej. "dos tazas" → 2)
    3. La respuesta debe estar en el idioma original (${
      detectedLanguage === "es" ? "español" : "inglés"
    })
    4. Si no puedes determinar algún valor, usa valores por defecto (nombre vacío, 0 minutos, 1 porción)
    5. Devuelve SOLO el JSON, sin explicaciones ni texto adicional`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1500,
    });

    const content = response.choices[0].message.content?.trim();
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    let recipeData;
    try {
      recipeData = JSON.parse(content);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return NextResponse.json({
        name: "",
        time: 0,
        servings: 1,
        ingredients: [],
        instructions: [],
        error: "Failed to parse response",
      });
    }

    // Asegurar valores por defecto para evitar nulos
    recipeData.name = recipeData.name || "";
    recipeData.time = recipeData.time || 0;
    recipeData.servings = recipeData.servings || 1;
    recipeData.ingredients = Array.isArray(recipeData.ingredients)
      ? recipeData.ingredients
      : [];
    recipeData.instructions = Array.isArray(recipeData.instructions)
      ? recipeData.instructions
      : [];

    // Verificar y corregir ingredientes
    recipeData.ingredients = recipeData.ingredients.map(
      (ing: { name?: string; amount?: number | string; unit?: string }) => ({
        name: ing.name || "",
        amount: typeof ing.amount === "number" ? ing.amount : 0,
        unit: ["g", "ml", "u"].includes(ing.unit as string) ? ing.unit : "u",
      })
    );

    recipeData.original_language = detectedLanguage;

    return NextResponse.json(recipeData);
  } catch (error) {
    console.error("Error parsing recipe:", error);
    // Devolver datos por defecto en caso de error
    return NextResponse.json({
      name: "",
      time: 0,
      servings: 1,
      ingredients: [],
      instructions: [],
      error: "Failed to process recipe",
    });
  }
}
