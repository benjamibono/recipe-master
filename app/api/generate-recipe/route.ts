import { NextResponse } from "next/server";
import { generateRecipeFromName } from "@/lib/recipe-generation";

export async function POST(request: Request) {
  try {
    const { recipeName } = await request.json();

    if (!recipeName) {
      return NextResponse.json(
        { error: "Recipe name is required" },
        { status: 400 }
      );
    }

    const recipe = await generateRecipeFromName(recipeName);
    return NextResponse.json(recipe);
  } catch (error) {
    console.error("Error generating recipe:", error);
    return NextResponse.json(
      { error: "Failed to generate recipe" },
      { status: 500 }
    );
  }
}
