import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as Blob;
    const language = (formData.get("language") as string) || "auto"; // Permite especificar un idioma o auto-detectar

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Create a more specific file name with the correct extension based on the mime type
    const fileExtension = audioFile.type.split("/")[1] || "webm";
    const fileName = `audio.${fileExtension}`;

    // Crear un prompt que funcione bien para español e inglés
    const multilingualPrompt = `You are a multilingual recipe assistant. Please transcribe the following audio with a focus on recipe-related information.
    If the audio is in Spanish, transcribe it in Spanish. If it's in English, transcribe it in English.
    ${language !== "auto" ? `The audio is likely in ${language}.` : ""}
    
    Pay special attention to:
    1. Recipe name (Nombre de la receta)
    2. Preparation time in minutes (Tiempo de preparación en minutos)
    3. Number of servings (Número de porciones/raciones)
    4. Ingredient names and their amounts (Nombres de ingredientes y cantidades)
    5. Cooking instructions and steps (Instrucciones de cocción y pasos)
    6. Units of measurement (Unidades de medida):
       - grams/gramos (g)
       - milliliters/mililitros (ml)
       - units/unidades (u)
    
    Format the transcription in a clear, structured way that emphasizes these recipe elements.
    If you hear any numbers that could be servings or prep time, make sure to include them in the transcription.
    For units, standardize to: grams/gramos (g), milliliters/mililitros (ml), or units/unidades (u).`;

    const response = await openai.audio.transcriptions.create({
      file: new File([audioFile], fileName, { type: audioFile.type }),
      model: "whisper-1",
      language: language !== "auto" ? language : undefined, // Pasar el código de idioma si se especifica
      prompt: multilingualPrompt,
    });

    // Detectar el idioma del texto transcrito (simple heurística)
    const detectedLanguage = detectLanguage(response.text);

    return NextResponse.json({
      text: response.text,
      detected_language: detectedLanguage,
    });
  } catch (error) {
    console.error("Error transcribing audio:", error);
    return NextResponse.json(
      { error: "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}

// Función simple para detectar el idioma basada en palabras comunes
function detectLanguage(text: string): "en" | "es" {
  const lowerText = text.toLowerCase();

  // Palabras comunes en español
  const spanishWords = [
    "la",
    "el",
    "de",
    "con",
    "para",
    "por",
    "una",
    "un",
    "y",
    "minutos",
    "gramos",
    "cucharada",
    "poner",
    "mezclar",
    "añadir",
  ];

  // Contar ocurrencias de palabras en español
  const spanishCount = spanishWords.reduce((count, word) => {
    const regex = new RegExp(`\\b${word}\\b`, "g");
    const matches = lowerText.match(regex);
    return count + (matches ? matches.length : 0);
  }, 0);

  // Si hay varias palabras en español, probablemente es español
  return spanishCount >= 3 ? "es" : "en";
}
