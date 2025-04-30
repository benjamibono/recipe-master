import { useState, useCallback } from "react";
import { Recipe } from "@/lib/supabase";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { toast } from "sonner";

interface TranslatedRecipeData {
  name: string;
  ingredients: {
    name: string;
    amount: number;
    unit: string;
  }[];
  instructions: string[];
}

// Crear tipo para el contenido traducible
type TranslatableContent =
  | string
  | Array<{ name: string; amount: number; unit: string }>
  | string[];

export function useRecipeTranslation(recipe: Recipe | null) {
  const { language, t } = useLanguage();
  const [translatedData, setTranslatedData] =
    useState<TranslatedRecipeData | null>(null);
  const [isShowingTranslation, setIsShowingTranslation] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  // Determinar si necesitamos traducción
  const needsTranslation =
    recipe?.original_language && recipe.original_language !== language;

  // Determinar qué datos mostrar (originales o traducidos)
  const displayData =
    isShowingTranslation && translatedData ? translatedData : recipe;

  // Función para traducir un elemento específico
  const translateContent = useCallback(
    async (
      content: TranslatableContent,
      contentType: "name" | "ingredients" | "instructions"
    ) => {
      if (!recipe || !needsTranslation) return content;

      try {
        const response = await fetch("/api/translate-recipe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content,
            targetLanguage: language,
            contentType,
          }),
        });

        if (!response.ok) {
          throw new Error("Translation failed");
        }

        const { translated } = await response.json();
        return translated;
      } catch (error) {
        console.error(`Error translating ${contentType}:`, error);
        toast.error(t("recipes.translationFailed"));
        return content;
      }
    },
    [recipe, language, needsTranslation, t]
  );

  // Función para alternar entre mostrar la versión original o traducida
  const toggleTranslation = useCallback(async () => {
    if (!recipe || !needsTranslation) return;

    // Si ya tenemos datos traducidos, simplemente alternar la visualización
    if (translatedData && isShowingTranslation) {
      setIsShowingTranslation(false);
      return;
    }

    // Si ya tenemos datos traducidos pero no los estamos mostrando, mostrarlos
    if (translatedData && !isShowingTranslation) {
      setIsShowingTranslation(true);
      return;
    }

    // Si no tenemos datos traducidos, realizar la traducción
    setIsTranslating(true);
    try {
      // Traducir nombre, ingredientes e instrucciones
      const [translatedName, translatedIngredients, translatedInstructions] =
        await Promise.all([
          translateContent(recipe.name, "name"),
          translateContent(recipe.ingredients, "ingredients"),
          translateContent(recipe.instructions, "instructions"),
        ]);

      setTranslatedData({
        name: translatedName,
        ingredients: translatedIngredients,
        instructions: translatedInstructions,
      });
      setIsShowingTranslation(true);
    } catch (error) {
      console.error("Error translating recipe:", error);
      toast.error(t("recipes.translationFailed"));
    } finally {
      setIsTranslating(false);
    }
  }, [
    recipe,
    needsTranslation,
    translatedData,
    isShowingTranslation,
    translateContent,
    t,
  ]);

  return {
    displayData,
    isShowingTranslation,
    isTranslating,
    needsTranslation,
    toggleTranslation,
  };
}
