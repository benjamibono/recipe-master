"use client";

import React from "react";
import { useLanguage } from "@/app/contexts/LanguageContext";

export const LanguageSelector: React.FC = () => {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center justify-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label={
        language === "es"
          ? t("common.switch_to_english")
          : t("common.switch_to_spanish")
      }
    >
      <span className="text-sm font-medium">
        {language === "es" ? "EN" : "ES"}
      </span>
    </button>
  );
};
