import { NextResponse } from "next/server";
import { analyzeRecipeMacros } from "@/lib/openai";

export async function POST(request: Request) {
  try {
    const { ingredients } = await request.json();

    if (!ingredients || !Array.isArray(ingredients)) {
      return NextResponse.json(
        { error: "Invalid ingredients data" },
        { status: 400 }
      );
    }

    const macros = await analyzeRecipeMacros(ingredients);
    return NextResponse.json({ macros });
  } catch (error) {
    console.error("Error in analyze-macros route:", error);
    return NextResponse.json(
      { error: "Failed to analyze macros" },
      { status: 500 }
    );
  }
}
