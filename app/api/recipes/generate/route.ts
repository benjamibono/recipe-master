import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Definir una interfaz para la receta al principio del archivo
interface GeneratedRecipe {
  name: string;
  time: number;
  servings: number;
  ingredients: {
    name: string;
    amount: number;
    unit: "g" | "ml" | "u";
  }[];
  instructions: string[];
  original_language?: "es" | "en";
  macros_data?: string;
  creator_name?: string;
}

export async function POST(request: Request) {
  try {
    const { name, language = "en", appLanguage } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Recipe name is required" },
        { status: 400 }
      );
    }

    // Determinar el idioma a usar (preferencia del usuario o idioma de la app)
    const targetLanguage = language !== "auto" ? language : appLanguage || "en";

    // Validar que el idioma es soportado
    if (targetLanguage !== "es" && targetLanguage !== "en") {
      return NextResponse.json(
        { error: "Unsupported language (only 'en' or 'es' are supported)" },
        { status: 400 }
      );
    }

    // Configurar el prompt según el idioma
    const systemPrompt =
      targetLanguage === "es"
        ? `Eres un chef profesional y creador de recetas. Crea una receta detallada basada en el nombre dado.
        IMPORTANTE: Esta receta DEBE estar COMPLETAMENTE en ESPAÑOL. Todos los nombres de ingredientes, instrucciones y la receta completa DEBEN estar en español.
        
        La receta debe incluir:
        1. Una lista de ingredientes con medidas precisas
        2. Instrucciones paso a paso
        3. Tiempo de preparación
        4. Número de porciones
        
        Formatea la respuesta como un objeto JSON con la siguiente estructura:
        {
          "name": "string (en ESPAÑOL)",
          "time": number,
          "servings": number,
          "ingredients": [
            {
              "name": "string (en ESPAÑOL)",
              "amount": number,
              "unit": "g" | "ml" | "u"
            }
          ],
          "instructions": ["string (en ESPAÑOL)"],
          "original_language": "es"
        }
        
        IMPORTANTE: Todos los textos DEBEN estar en español. Responde SOLAMENTE con un objeto JSON válido. No incluyas ningún texto antes o después del JSON.`
        : `You are a professional chef and recipe creator. Create a detailed recipe based on the given name. 
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
          "instructions": string[],
          "original_language": "en"
        }
        
        Respond ONLY with a valid JSON object. Do not include any text before or after the JSON.`;

    const userPrompt =
      targetLanguage === "es"
        ? `Crea una receta para: "${name}". IMPORTANTE: La receta DEBE estar completamente en ESPAÑOL.`
        : `Create a recipe for: ${name}`;

    const completion = await openai.chat.completions.create({
      model: process.env.NEXT_PUBLIC_OPENAI_MODEL || "gpt-4o-mini-2024-07-18",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    try {
      // Limpiar posibles marcadores de formato Markdown
      const cleanedContent = content
        .replace(/^```json\s*/g, "")
        .replace(/^```\s*/g, "")
        .replace(/\s*```$/g, "")
        .trim();

      const recipe = JSON.parse(cleanedContent);

      // Asegurarse de que el idioma original está establecido
      if (!recipe.original_language) {
        recipe.original_language = targetLanguage;
      }

      // Verificar el idioma del contenido usando IA para asegurar consistencia
      if (targetLanguage === "es" || targetLanguage === "en") {
        await verifyAndFixLanguage(recipe, targetLanguage);
      }

      return NextResponse.json(recipe);
    } catch (error) {
      console.error("Error parsing recipe JSON:", error);
      console.error("Raw content:", content);
      return NextResponse.json(
        { error: "Failed to parse generated recipe" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error generating recipe:", error);
    return NextResponse.json(
      { error: "Failed to generate recipe" },
      { status: 500 }
    );
  }
}

/**
 * Verifica y corrige el idioma del contenido de la receta usando IA
 * @param recipe La receta a verificar
 * @param targetLanguage El idioma objetivo ("es" o "en")
 */
async function verifyAndFixLanguage(
  recipe: GeneratedRecipe,
  targetLanguage: "es" | "en"
): Promise<void> {
  // Extraer muestras de texto para verificar el idioma
  const textSamples = [
    recipe.name || "",
    ...(recipe.instructions || []).slice(0, 2), // Tomar solo las primeras instrucciones como muestra
    ...(recipe.ingredients || []).slice(0, 3).map((ing) => ing.name || ""),
  ].filter((text) => text.length > 0);

  if (textSamples.length === 0) return;

  // Usar IA para detectar el idioma
  const detectionPrompt = `
  Analiza el siguiente contenido y determina si está en español o inglés.
  No expliques tu razonamiento, simplemente responde "es" si está en español o "en" si está en inglés.
  
  Contenido a analizar:
  ${textSamples.join("\n")}
  `;

  try {
    const detectionResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: detectionPrompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 10,
    });

    const detectedLanguage = detectionResponse.choices[0].message.content
      ?.trim()
      .toLowerCase();

    // Si el idioma detectado no coincide con el objetivo, traducir la receta
    if (
      (detectedLanguage === "en" && targetLanguage === "es") ||
      (detectedLanguage === "es" && targetLanguage === "en")
    ) {
      console.warn(
        `Detected ${detectedLanguage} content but ${targetLanguage} was requested. Translating...`
      );

      const translationPrompt =
        targetLanguage === "es"
          ? `Traduce la siguiente receta completa de inglés a español. Asegúrate de que todos los textos estén en español.
           Devuelve SOLO un objeto JSON válido con toda la información traducida al español:
           ${JSON.stringify(recipe, null, 2)}`
          : `Translate this recipe completely from Spanish to English. Make sure all text is in English.
           Return ONLY a valid JSON object with all information translated to English:
           ${JSON.stringify(recipe, null, 2)}`;

      const translationResponse = await openai.chat.completions.create({
        model: process.env.NEXT_PUBLIC_OPENAI_MODEL || "gpt-4o-mini-2024-07-18",
        messages: [
          {
            role: "user",
            content: translationPrompt,
          },
        ],
        temperature: 0.3,
      });

      const translatedContent =
        translationResponse.choices[0].message.content?.trim();
      if (translatedContent) {
        try {
          // Limpiar y parsear el JSON traducido
          const cleanedTranslation = translatedContent
            .replace(/^```json\s*/g, "")
            .replace(/^```\s*/g, "")
            .replace(/\s*```$/g, "")
            .trim();

          const translatedRecipe = JSON.parse(cleanedTranslation);

          // Actualizar la receta con los valores traducidos
          Object.assign(recipe, translatedRecipe);
          recipe.original_language = targetLanguage;
        } catch (parseError) {
          console.error("Error parsing translated recipe:", parseError);
        }
      }
    } else {
      console.log(
        `Content confirmed to be in ${detectedLanguage} as requested.`
      );
    }
  } catch (error) {
    console.error("Error in language verification:", error);
  }
}
