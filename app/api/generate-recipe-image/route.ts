import { NextResponse } from "next/server";
import {
  generateImageFromPrompt,
  ImageGenerationError,
} from "@/lib/image-generation";

export async function POST(request: Request) {
  try {
    const { recipeName, ingredients } = await request.json();

    if (!recipeName) {
      return NextResponse.json(
        { error: "Recipe name is required" },
        { status: 400 }
      );
    }

    if (
      !ingredients ||
      !Array.isArray(ingredients) ||
      ingredients.length === 0
    ) {
      return NextResponse.json(
        { error: "At least one ingredient is required" },
        { status: 400 }
      );
    }

    // Create a detailed prompt for the image generation
    const ingredientsText = ingredients
      .map(
        (ing: { name: string; amount: number; unit: string }) =>
          `${ing.amount} ${ing.unit} ${ing.name}`
      )
      .join(", ");

    const prompt = `Professional food photography of ${recipeName}. 
    Beautiful plating on a modern white plate.
    Natural lighting, 45-degree angle shot.
    Clean background with subtle bokeh.
    Main ingredients visible: ${ingredientsText}.
    High-end restaurant quality presentation.
    I NEED to test how the tool works with extremely simple prompts. DO NOT add any detail, just use it AS-IS.`;

    const imageData = await generateImageFromPrompt(prompt, "1024x1024");

    return NextResponse.json(imageData);
  } catch (error) {
    console.error("Error generating recipe image:", error);

    if ((error as ImageGenerationError).status) {
      // OpenAI API error
      return NextResponse.json(
        {
          error: (error as ImageGenerationError).message,
          details: (error as ImageGenerationError).details,
        },
        { status: (error as ImageGenerationError).status || 500 }
      );
    } else {
      // Other errors
      return NextResponse.json(
        {
          error:
            (error as ImageGenerationError).message ||
            "Failed to generate recipe image",
          details: (error as ImageGenerationError).details,
        },
        { status: 500 }
      );
    }
  }
}
