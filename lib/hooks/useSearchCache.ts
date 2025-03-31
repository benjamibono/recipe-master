import { useState, useEffect } from "react";
import { Recipe } from "@/lib/supabase";

const CACHE_KEY = "recent_recipes_cache";
const MAX_CACHE_ITEMS = 30;

export function useSearchCache() {
  const [cachedRecipes, setCachedRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    // Load cache from localStorage on mount
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      setCachedRecipes(JSON.parse(cached));
    }
  }, []);

  const addToCache = (recipe: Recipe) => {
    setCachedRecipes((prev) => {
      const filtered = prev.filter((r) => r.id !== recipe.id);
      const newCache = [recipe, ...filtered].slice(0, MAX_CACHE_ITEMS);
      localStorage.setItem(CACHE_KEY, JSON.stringify(newCache));
      return newCache;
    });
  };

  const clearCache = () => {
    localStorage.removeItem(CACHE_KEY);
    setCachedRecipes([]);
  };

  return {
    cachedRecipes,
    addToCache,
    clearCache,
  };
}
