"use client";

import { Button } from "@/components/ui/button";
import { Languages, Loader2 } from "lucide-react";
import { useLanguage } from "@/app/contexts/LanguageContext";

interface TranslationIndicatorProps {
  isTranslated: boolean;
  originalLanguage: "en" | "es" | undefined;
  onToggle: () => void;
  isTranslating?: boolean;
}

export function TranslationIndicator({
  isTranslated,
  originalLanguage,
  onToggle,
  isTranslating = false,
}: TranslationIndicatorProps) {
  const { t, language } = useLanguage();

  // No mostrar el indicador si no hay idioma original o es el mismo que el actual
  if (!originalLanguage || originalLanguage === language) {
    return null;
  }

  return (
    <div className="mb-2">
      <Button
        variant="outline"
        size="sm"
        className="text-xs"
        onClick={onToggle}
        disabled={isTranslating}
      >
        {isTranslating ? (
          <>
            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            {t("recipes.translating")}
          </>
        ) : (
          <>
            <Languages className="h-3.5 w-3.5 mr-1" />
            {isTranslated
              ? t("recipes.showOriginal")
              : t("recipes.translate", "Traducir")}
          </>
        )}
      </Button>
    </div>
  );
}
