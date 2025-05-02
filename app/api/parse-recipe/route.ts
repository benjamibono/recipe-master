import { NextResponse } from "next/server";
import OpenAI from "openai";

// Mantener Edge Function para límites de tiempo más generosos (hasta 60 segundos)
export const runtime = "edge";
// Configurar para maximizar el tiempo de respuesta permitido
export const maxDuration = 60; // Máximo para Edge Functions en Vercel

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

    // Mantener texto completo sin límites artificiales
    const limitedTranscription = transcription;

    // Prompt completo y detallado para máxima calidad
    const prompt = `
    ${
      detectedLanguage === "es"
        ? "Analiza esta transcripción de receta en español"
        : "Analyze this recipe transcript in English"
    }.
    
    Transcripción:
    ${limitedTranscription}
    
    Extrae la siguiente información y devuelve un objeto JSON:
    1. El nombre de la receta
    2. El tiempo de preparación en minutos (si se menciona)
    3. El número de porciones o personas que sirve (si se menciona)
    4. La lista completa de ingredientes con sus cantidades y unidades
    5. Las instrucciones paso a paso
    
    Formato JSON requerido:
    {
      "name": "nombre completo de la receta",
      "time": número de minutos de preparación,
      "servings": número de porciones,
      "ingredients": [
        {"name": "nombre del ingrediente", "amount": cantidad numérica, "unit": unidad}
      ],
      "instructions": ["paso 1", "paso 2", ...]
    }
    
    Reglas:
    - La unidad de ingredientes debe ser "g" para gramos, "ml" para mililitros, o "u" para unidades/piezas
    - Convierte todas las cantidades a números (ej. "dos tazas" → 2)
    - Si un valor no se menciona explícitamente, usa los valores por defecto (nombre vacío, 0 minutos, 1 porción)
    - La respuesta debe estar en el idioma original de la transcripción (${detectedLanguage})
    - No agregues explicaciones ni comentarios, solo el JSON`;

    const response = await openai.chat.completions.create({
      // Usar modelo potente pero relativamente rápido
      model: "gpt-4o-mini-2024-07-18",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content?.trim();
    if (!content) {
      return NextResponse.json({
        name: "",
        time: 0,
        servings: 1,
        ingredients: [],
        instructions: [],
        original_language: detectedLanguage,
      });
    }

    // Procesar la respuesta
    let recipeData;
    try {
      recipeData = JSON.parse(content);
    } catch (parseError) {
      return NextResponse.json({
        name: "",
        time: 0,
        servings: 1,
        ingredients: [],
        instructions: [],
        original_language: detectedLanguage,
      });
    }

    // Asegurar valores por defecto
    const result = {
      name: recipeData.name || "",
      time: Number(recipeData.time) || 0,
      servings: Number(recipeData.servings) || 1,
      ingredients: Array.isArray(recipeData.ingredients)
        ? recipeData.ingredients.map(
            (ing: {
              name?: string;
              amount?: number | string;
              unit?: string;
            }) => ({
              name: ing?.name || "",
              amount: Number(ing?.amount) || 0,
              unit: ["g", "ml", "u"].includes(String(ing?.unit || ""))
                ? ing.unit
                : "u",
            })
          )
        : [],
      instructions: Array.isArray(recipeData.instructions)
        ? recipeData.instructions.map(String)
        : [],
      original_language: detectedLanguage,
    };

    return NextResponse.json(result);
  } catch (error) {
    // Siempre devolver un objeto válido en caso de error
    return NextResponse.json({
      name: "",
      time: 0,
      servings: 1,
      ingredients: [],
      instructions: [],
      original_language: "en",
    });
  }
}
