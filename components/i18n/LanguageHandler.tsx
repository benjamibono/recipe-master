"use client";

import { useEffect } from "react";
import { useLanguage } from "@/app/contexts/LanguageContext";

export function LanguageHandler() {
  const { language } = useLanguage();

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return null;
}
