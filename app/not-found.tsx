"use client";

import Link from "next/link";
import { useLanguage } from "./contexts/LanguageContext";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="mb-8 relative">
        <div className="text-9xl font-bold text-gray-200">404</div>
      </div>

      <h1 className="text-3xl font-bold mb-4 text-gray-800">
        {t("errors.not_found_title", "¡Ups! Esta receta no existe")}
      </h1>

      <p className="text-gray-600 mb-8 max-w-md">
        {t(
          "errors.not_found_message",
          "Parece que el ingrediente que buscas no está en nuestra cocina. Vuelve a la página principal o prueba a buscar otra receta."
        )}
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/"
          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
        >
          <Home className="h-5 w-5" />
          {t("common.back_home", "Volver al inicio")}
        </Link>

        <Link
          href="/explore"
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
        >
          <Search className="h-5 w-5" />
          {t("common.explore_recipes", "Explorar recetas")}
        </Link>
      </div>

      <div className="mt-12 animate-bounce">
        <span className="text-2xl text-gray-500">🍽️</span>
      </div>
    </div>
  );
}
