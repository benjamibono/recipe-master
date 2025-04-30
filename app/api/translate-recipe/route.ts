import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { content, targetLanguage, contentType } = await request.json();

    if (!content || !targetLanguage || !contentType) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Validar que el idioma objetivo es soportado
    if (targetLanguage !== "es" && targetLanguage !== "en") {
      return NextResponse.json(
        { error: "Unsupported target language" },
        { status: 400 }
      );
    }

    // Estructura la petición según el tipo de contenido
    let translationPrompt;
    if (contentType === "ingredients") {
      translationPrompt = `Translate the following ingredients from ${
        targetLanguage === "es" ? "English to Spanish" : "Spanish to English"
      }. Maintain the structure and do not change numbers or measurements.
      
      ${
        targetLanguage === "es"
          ? "IMPORTANTE: Usa español de España (castellano peninsular), NO español latinoamericano. Por ejemplo, traduce 'pancakes' como 'tortitas' (no 'panqueques'), 'cookie' como 'galleta' (no 'galleta'), 'corn' como 'maíz' (no 'choclo'), 'avocado' como 'aguacate' (no 'palta'), etc. Utiliza términos culinarios propios de España."
          : ""
      }
      
      Ingredients:
      ${JSON.stringify(content)}
      
      Return only the translated ingredients in a valid JSON array that matches the exact same structure. DO NOT include any markdown formatting, code blocks, or backticks. Just return the raw JSON array.`;
    } else if (contentType === "instructions") {
      translationPrompt = `Translate the following cooking instructions from ${
        targetLanguage === "es" ? "English to Spanish" : "Spanish to English"
      }. Maintain the meaning and steps.
      
      ${
        targetLanguage === "es"
          ? "IMPORTANTE: Usa español de España (castellano peninsular), NO español latinoamericano. Utiliza términos culinarios, verbos y expresiones propias de la cocina española. Por ejemplo, utiliza términos como 'sartén', 'fuego', 'remover', 'mezclar bien', etc. propios de España."
          : ""
      }
      
      Instructions:
      ${JSON.stringify(content)}
      
      Return only the translated instructions in a valid JSON array. DO NOT include any markdown formatting, code blocks, or backticks. Just return the raw JSON array.`;
    } else if (contentType === "name") {
      translationPrompt = `Translate the following recipe name from ${
        targetLanguage === "es" ? "English to Spanish" : "Spanish to English"
      }:
      
      ${
        targetLanguage === "es"
          ? "IMPORTANTE: Usa español de España (castellano peninsular), NO español latinoamericano. Utiliza el nombre que sería común en España para este plato. Por ejemplo, traduce 'pancakes' como 'tortitas', 'cookie' como 'galleta', 'pie' como 'tarta', etc."
          : ""
      }
      
      "${content}"
      
      Return only the translated name as plain text.`;
    } else {
      return NextResponse.json(
        { error: "Unsupported content type" },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: process.env.NEXT_PUBLIC_OPENAI_MODEL || "gpt-4o-mini-2024-07-18",
      messages: [
        {
          role: "system",
          content:
            targetLanguage === "es"
              ? "Eres un experto traductor culinario especializado en español de España (castellano peninsular). Traduces nombres de recetas, ingredientes e instrucciones utilizando específicamente la terminología gastronómica usada en España, evitando términos latinoamericanos."
              : "You are an expert culinary translator specialized in English translation.",
        },
        { role: "user", content: translationPrompt },
      ],
    });

    const translatedContent = response.choices[0].message.content?.trim();
    if (!translatedContent) {
      throw new Error("Empty translation response from OpenAI");
    }

    // Parsear el resultado según el tipo de contenido
    let parsedContent;
    if (contentType === "name") {
      // Para nombres, simplemente usamos el texto devuelto
      parsedContent = translatedContent;
    } else {
      // Para ingredientes e instrucciones, limpiar marcadores de formato Markdown y parsear el JSON
      try {
        // Eliminar marcadores de formato Markdown (```json, ```, etc.)
        const cleanedContent = translatedContent
          .replace(/^```json\s*/, "")
          .replace(/^```\s*/, "")
          .replace(/\s*```$/, "")
          .trim();

        parsedContent = JSON.parse(cleanedContent);
      } catch (error) {
        console.error("Error parsing translated content:", error);
        console.error("Raw content:", translatedContent);
        return NextResponse.json(
          { error: "Failed to parse translated content" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ translated: parsedContent });
  } catch (error) {
    console.error("Error translating content:", error);
    return NextResponse.json(
      { error: "Failed to translate content" },
      { status: 500 }
    );
  }
}
