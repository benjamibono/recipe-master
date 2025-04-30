export interface RecipeAudioData {
  name?: string;
  time?: number;
  servings?: number;
  ingredients?: Array<{
    name: string;
    amount: number;
    unit: "g" | "ml" | "u";
  }>;
  instructions?: string[];
  original_language?: "en" | "es";
}

export async function transcribeAudio(
  audioBlob: Blob,
  language: string = "auto"
): Promise<{ text: string; detected_language: "en" | "es" }> {
  try {
    const formData = new FormData();
    formData.append("audio", audioBlob);
    formData.append("language", language);

    const response = await fetch("/api/transcribe", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to transcribe audio");
    }

    const data = await response.json();
    return {
      text: data.text,
      detected_language: data.detected_language || "en",
    };
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw error;
  }
}

export async function parseTranscribedRecipe(
  transcription: string,
  detected_language: "en" | "es" = "en"
): Promise<RecipeAudioData> {
  try {
    const response = await fetch("/api/parse-recipe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transcription,
        language: detected_language,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to parse recipe");
    }

    const recipeData = await response.json();

    // Añadir el idioma detectado a los datos de la receta
    return {
      ...recipeData,
      original_language: detected_language,
    };
  } catch (error) {
    console.error("Error parsing transcribed recipe:", error);
    throw error;
  }
}

export async function generateTextFromAudio(audioBlob: Blob): Promise<{
  text: string;
  confidence: number;
  recipeData?: RecipeAudioData;
}> {
  try {
    const { text, detected_language } = await transcribeAudio(audioBlob);
    const recipeData = await parseTranscribedRecipe(text, detected_language);

    return {
      text: text,
      confidence: 0.95,
      recipeData,
    };
  } catch (error) {
    console.error("Error generating text from audio:", error);
    throw error;
  }
}
