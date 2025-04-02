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
}

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    const formData = new FormData();
    formData.append("audio", audioBlob);

    const response = await fetch("/api/transcribe", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to transcribe audio");
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw error;
  }
}

export async function parseTranscribedRecipe(
  transcription: string
): Promise<RecipeAudioData> {
  try {
    const response = await fetch("/api/parse-recipe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transcription }),
    });

    if (!response.ok) {
      throw new Error("Failed to parse recipe");
    }

    const recipeData = await response.json();
    return recipeData;
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
    const transcription = await transcribeAudio(audioBlob);
    const recipeData = await parseTranscribedRecipe(transcription);

    return {
      text: transcription,
      confidence: 0.95,
      recipeData,
    };
  } catch (error) {
    console.error("Error generating text from audio:", error);
    throw error;
  }
}
