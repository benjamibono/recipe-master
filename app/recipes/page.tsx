"use client";

import { useEffect } from "react";
import { CreateRecipeDialog } from "@/components/recipe/CreateRecipeDialog";
import RecipeCard from "@/components/RecipeCard";
import { useRouter } from "next/navigation";
import {
  SortControls,
  type SortOption,
} from "@/components/recipe/SortControls";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { useAuthContext } from "../contexts/AuthContext";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// Definir tipos para mayor seguridad
interface Profile {
  id: string;
  username: string;
}

interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

interface Recipe {
  id: string;
  name: string;
  user_id: string;
  type: string;
  created_at: string;
  updated_at?: string;
  time?: string | number;
  servings?: number;
  ingredients?: Ingredient[];
  instructions?: string;
  profile?: Profile | null;
  [key: string]: any; // Para permitir propiedades adicionales
}

export default function RecipesPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user, isLoading: isLoadingAuth } = useAuthContext();
  const [sortOption, setSortOption] = useState<SortOption>({
    field: "created_at",
    ascending: false,
  });

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!isLoadingAuth && !user) {
      router.push("/auth/login");
    }
  }, [isLoadingAuth, user, router]);

  // Cargar recetas con React Query
  const {
    data: recipes = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "recipes",
      user?.id,
      "cooking",
      sortOption.field,
      sortOption.ascending,
    ],
    queryFn: async () => {
      if (!user?.id) return [];

      try {
        // Paso 1: Obtener recetas
        const { data: recipeData, error: recipeError } = await supabase
          .from("recipes")
          .select("*")
          .eq("user_id", user.id)
          .eq("type", "cooking")
          .order(sortOption.field, { ascending: sortOption.ascending });

        if (recipeError) throw recipeError;

        if (!recipeData || recipeData.length === 0) {
          return [];
        }

        // Paso 2: Obtener perfiles de usuarios
        const userIdMap: { [key: string]: boolean } = {};
        recipeData.forEach((recipe) => {
          userIdMap[recipe.user_id] = true;
        });
        const userIds = Object.keys(userIdMap);

        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", userIds);

        if (profilesError) throw profilesError;

        // Paso 3: Combinar recetas con perfiles
        const recipesWithProfiles: Recipe[] = recipeData.map((recipe) => ({
          ...recipe,
          profile: profiles?.find((p) => p.id === recipe.user_id) || null,
        }));

        return recipesWithProfiles;
      } catch (err) {
        console.error("Error cargando recetas:", err);
        throw err;
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
    refetchOnWindowFocus: false,
  });

  if (isLoadingAuth) {
    return (
      <div className="container py-8 text-center">{t("recipes.loading")}</div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t("recipes.your_recipes")}</h1>
          <SortControls value={sortOption} onChange={setSortOption} />
        </div>

        {error instanceof Error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <h3 className="text-lg font-semibold text-red-700">
              Error cargando recetas
            </h3>
            <pre className="mt-2 text-sm overflow-auto bg-red-100 p-2 rounded">
              {error.message}
            </pre>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-center">{t("recipes.loading")}</div>
      ) : recipes.length === 0 ? (
        <div className="text-center text-gray-500">
          {t("recipes.no_recipes")}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              currentUsername={recipe.profile?.username || null}
            />
          ))}
        </div>
      )}
      <CreateRecipeDialog />
    </div>
  );
}
