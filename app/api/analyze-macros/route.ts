import { NextResponse } from "next/server";
import { analyzeRecipeMacros } from "@/lib/openai";
import { RateLimiter } from "limiter";

// Create a rate limiter that allows 10 requests per minute
const limiter = new RateLimiter({
  tokensPerInterval: 10,
  interval: "minute",
});

// Default fallback macros when analysis fails
const DEFAULT_MACROS = `Energy value: 0 Cal
Protein: 0 g
Carbs: 0 g
Fats: 0 g`;

export async function POST(request: Request) {
  try {
    // Check rate limit
    const hasToken = await limiter.tryRemoveTokens(1);
    if (!hasToken) {
      return NextResponse.json(
        {
          error:
            "You've reached the rate limit. Please wait 5 minutes before trying again.",
          cooldown: 300000, // 5 minutes in milliseconds
        },
        { status: 429 }
      );
    }

    const { ingredients } = await request.json();

    if (!ingredients || !Array.isArray(ingredients)) {
      return NextResponse.json(
        { error: "Invalid ingredients data" },
        { status: 400 }
      );
    }

    try {
      const macros = await analyzeRecipeMacros(ingredients);
      return NextResponse.json({ macros });
    } catch (analysisError) {
      console.error("Error analyzing macros:", analysisError);

      // Return default macros instead of failing the request
      console.log("Using default macros as fallback");
      return NextResponse.json({
        macros: DEFAULT_MACROS,
        isDefault: true,
      });
    }
  } catch (error) {
    console.error("Error in analyze-macros API:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
