import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as Blob;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    const response = await openai.audio.transcriptions.create({
      file: new File([audioFile], "audio.webm", { type: "audio/webm" }),
      model: "whisper-1",
      prompt: `You are a recipe assistant. Please transcribe the following audio with a focus on recipe-related information. 
      Pay special attention to:
      1. Recipe name
      2. Preparation time (in minutes)
      3. Number of servings
      4. Ingredient names and their amounts
      5. Cooking instructions and steps
      6. Units of measurement (grams, milliliters, units)
      
      Format the transcription in a clear, structured way that emphasizes these recipe elements.
      If you hear any numbers that could be servings or prep time, make sure to include them in the transcription.
      For units, only use: grams (g), milliliters (ml), or units (u).`,
    });

    return NextResponse.json({ text: response.text });
  } catch (error) {
    console.error("Error transcribing audio:", error);
    return NextResponse.json(
      { error: "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}
