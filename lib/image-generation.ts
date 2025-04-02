import OpenAI from "openai";

export interface GeneratedImage {
  url: string;
  prompt: string;
  size: "256x256" | "512x512" | "1024x1024";
}

export interface ImageGenerationError {
  status?: number;
  message: string;
  details?: unknown;
}

interface OpenAIError {
  response?: {
    status: number;
    data: {
      error?: {
        message: string;
      };
    };
  };
  request?: unknown;
  message: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateImageFromPrompt(
  prompt: string,
  size: "256x256" | "512x512" | "1024x1024" = "1024x1024"
): Promise<GeneratedImage> {
  try {
    const response = await openai.images.generate({
      model: "dall-e-2",
      prompt: prompt,
      size: size,
      n: 1,
    });

    if (!response.data || response.data.length === 0) {
      throw new Error("No image was generated");
    }

    const imageData: GeneratedImage = {
      url: response.data[0].url || "",
      prompt: prompt,
      size: size,
    };

    return imageData;
  } catch (error: unknown) {
    console.error("Error generating image:", error);

    const openAIError = error as OpenAIError;

    if (openAIError.response) {
      throw {
        status: openAIError.response.status,
        message:
          openAIError.response.data?.error?.message ||
          "Failed to generate image",
        details: openAIError.response.data,
      } as ImageGenerationError;
    } else if (openAIError.request) {
      throw {
        message: "Network error while generating image",
        details: openAIError.message,
      } as ImageGenerationError;
    } else {
      throw {
        message: openAIError.message || "An unexpected error occurred",
        details: error,
      } as ImageGenerationError;
    }
  }
}
