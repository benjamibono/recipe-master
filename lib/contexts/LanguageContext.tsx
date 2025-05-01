"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import esTranslations from "../../app/translations/es.json";
import enTranslations from "../../app/translations/en.json";

type Language = "es" | "en";
type Translations = typeof enTranslations;

// Tipo para la función t() que permite usar rutas anidadas con . (ej: "home.welcome")
type TranslationKey = string;

interface LanguageContextType {
  language: Language;
  translations: Translations;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (
    key: TranslationKey,
    interpolations?: Record<string, string | number> | string,
    fallback?: string
  ) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
}) => {
  const [language, setLanguage] = useState<Language>("en");
  const [translations, setTranslations] =
    useState<Translations>(enTranslations);

  useEffect(() => {
    // Intentar cargar el idioma guardado en localStorage
    const savedLanguage = localStorage.getItem("language") as Language | null;

    if (savedLanguage && (savedLanguage === "es" || savedLanguage === "en")) {
      setLanguage(savedLanguage);
    } else {
      // Detectar el idioma del navegador
      const browserLanguage = navigator.language.split("-")[0];
      setLanguage(browserLanguage === "es" ? "es" : "en");
    }
  }, []);

  useEffect(() => {
    // Actualizar traducciones cuando cambia el idioma
    setTranslations(language === "es" ? esTranslations : enTranslations);

    // Guardar preferencia en localStorage
    localStorage.setItem("language", language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "es" ? "en" : "es"));
  };

  // Función t para acceder a traducciones usando notación de punto
  const t = (
    key: TranslationKey,
    interpolationsOrFallback?: Record<string, string | number> | string,
    fallbackParam?: string
  ): string => {
    // Handle the case where second parameter is a string (fallback)
    let interpolations: Record<string, string | number> | undefined;
    let fallback: string | undefined;

    if (typeof interpolationsOrFallback === "string") {
      fallback = interpolationsOrFallback;
    } else {
      interpolations = interpolationsOrFallback;
      fallback = fallbackParam;
    }

    try {
      const keys = key.split(".");
      let current = translations as Record<string, unknown>;

      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        const value = current[k];

        if (i === keys.length - 1) {
          // Último nivel, esperamos un string
          let translatedText =
            typeof value === "string" ? value : fallback || key;

          // Apply interpolations if provided
          if (interpolations && typeof translatedText === "string") {
            Object.entries(interpolations).forEach(([name, value]) => {
              translatedText = translatedText.replace(
                new RegExp(`{{${name}}}`, "g"),
                String(value)
              );
            });
          }

          return translatedText;
        } else if (value && typeof value === "object") {
          // Seguimos navegando
          current = value as Record<string, unknown>;
        } else {
          // No se puede seguir navegando
          return fallback || key;
        }
      }

      return fallback || key;
    } catch (error) {
      console.warn(`Translation key not found: ${key}`);
      return fallback || key;
    }
  };

  return (
    <LanguageContext.Provider
      value={{ language, translations, setLanguage, toggleLanguage, t }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
