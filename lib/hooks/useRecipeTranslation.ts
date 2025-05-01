import { useState, useCallback, useEffect } from "react";
import { Recipe } from "@/lib/supabase";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface TranslatedRecipeData {
  name: string;
  ingredients: {
    name: string;
    amount: number;
    unit: string;
  }[];
  instructions: string[];
}

interface TranslationCache {
  ingredients: {
    name: string;
    amount: number;
    unit: string;
  }[];
  instructions: string[];
  translated_at: string;
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
  const [hasCheckedCache, setHasCheckedCache] = useState(false);

  // Determinar si necesitamos traducción
  const needsTranslation =
    recipe?.original_language && recipe.original_language !== language;

  // Verificar si tenemos una traducción almacenada en la base de datos
  useEffect(() => {
    const checkCachedTranslation = async () => {
      if (!recipe || !needsTranslation || hasCheckedCache) return;

      try {
        // Intentar obtener la receta para acceder a las traducciones almacenadas
        const { data, error } = await supabase
          .from("recipes")
          .select("translations")
          .eq("id", recipe.id)
          .single();

        if (error) throw error;

        // Comprobar si existe una traducción para el idioma actual
        const cachedTranslations = data.translations || {};
        const cachedTranslation = cachedTranslations[language] as
          | TranslationCache
          | undefined;

        if (cachedTranslation) {
          console.log(`Using cached translation for ${language}`);
          setTranslatedData({
            name: recipe.name, // Usamos el nombre original, ya que pocos lo traducen
            ingredients: cachedTranslation.ingredients,
            instructions: cachedTranslation.instructions,
          });

          // Mostrar automáticamente la traducción almacenada
          setIsShowingTranslation(true);
        }
      } catch (error) {
        console.error("Error checking cached translation:", error);
      } finally {
        setHasCheckedCache(true);
      }
    };

    checkCachedTranslation();
  }, [recipe, language, needsTranslation, hasCheckedCache]);

  // Determinar qué datos mostrar (originales o traducidos)
  const displayData =
    isShowingTranslation && translatedData ? translatedData : recipe;

  // Función para guardar traducciones en la base de datos
  const saveTranslationToCache = useCallback(
    async (translatedData: TranslatedRecipeData) => {
      if (!recipe?.id) return;

      try {
        // Obtener las traducciones actuales
        const { data, error } = await supabase
          .from("recipes")
          .select("translations")
          .eq("id", recipe.id)
          .single();

        if (error) throw error;

        // Actualizar con la nueva traducción
        const translations = data.translations || {};
        translations[language] = {
          ingredients: translatedData.ingredients,
          instructions: translatedData.instructions,
          translated_at: new Date().toISOString(),
        };

        // Guardar en la base de datos
        const { error: updateError } = await supabase
          .from("recipes")
          .update({ translations })
          .eq("id", recipe.id);

        if (updateError) throw updateError;

        console.log(`Translation cached for language: ${language}`);
      } catch (error) {
        console.error("Error caching translation:", error);
      }
    },
    [recipe, language]
  );

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
            recipeId: recipe.id,
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

      const newTranslatedData = {
        name: translatedName,
        ingredients: translatedIngredients,
        instructions: translatedInstructions,
      };

      setTranslatedData(newTranslatedData);
      setIsShowingTranslation(true);

      // Guardar la traducción en la base de datos para uso futuro
      saveTranslationToCache(newTranslatedData);
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
    saveTranslationToCache,
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
