import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Recipe name is required" },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a professional chef and recipe creator. Create a detailed recipe based on the given name. 
          The recipe should include:
          1. A list of ingredients with precise measurements
          2. Step-by-step instructions
          3. Preparation time
          4. Number of servings
          
          Format the response as a JSON object with the following structure:
          {
            "name": "string",
            "time": number,
            "servings": number,
            "ingredients": [
              {
                "name": "string",
                "amount": number,
                "unit": "g" | "ml" | "u"
              }
            ],
            "instructions": string[]
          }`,
        },
        {
          role: "user",
          content: `Create a recipe for: ${name}`,
        },
      ],
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    const recipe = JSON.parse(content);
    return NextResponse.json(recipe);
  } catch (error) {
    console.error("Error generating recipe:", error);
    return NextResponse.json(
      { error: "Failed to generate recipe" },
      { status: 500 }
    );
  }
}
