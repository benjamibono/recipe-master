"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import RecipeCard from "@/components/RecipeCard";
import { Recipe } from "@/lib/supabase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckSquare, Square, Copy } from "lucide-react";
import { useLanguage } from "@/app/contexts/LanguageContext";

export default function ShoppingPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [usernameLoading, setUsernameLoading] = useState(true);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(
    new Set()
  );
  const [showCopyTooltip, setShowCopyTooltip] = useState(false);

  useEffect(() => {
    async function getCurrentUsername() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();

        if (profile) {
          setCurrentUsername(profile.username);
        }
      }
      setUsernameLoading(false);
    }
    getCurrentUsername();
  }, []);

  const loadRecipes = useCallback(async () => {
    try {
      console.log("Starting to load recipes...");

      const authResponse = await supabase.auth.getUser();
      console.log("Auth response:", {
        user: authResponse.data.user ? "exists" : "null",
        error: authResponse.error,
      });

      const {
        data: { user },
      } = authResponse;

      if (!user) {
        console.log("No authenticated user found");
        router.push("/auth/login");
        return;
      }

      console.log("Building query for user:", user.id);
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase query error:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: JSON.stringify(error, null, 2),
        });
        toast.error(
          `Failed to load recipes: ${error.message || "Unknown error"}`
        );
        return;
      }

      console.log(`Query successful, found ${data?.length || 0} recipes`);
      setRecipes(data || []);
    } catch (error) {
      console.error(
        "Unexpected error in loadRecipes:",
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error
      );
      toast.error("Failed to load recipes. Please try refreshing the page.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Load recipes on mount
  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  // Realtime subscription effect
  useEffect(() => {
    const channel = supabase
      .channel("recipe_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "recipes",
        },
        () => {
          loadRecipes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadRecipes]);

  // Add this effect to handle the copy button tooltip
  useEffect(() => {
    if (selectedRecipes.size > 0) {
      setShowCopyTooltip(true);
      const timer = setTimeout(() => setShowCopyTooltip(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [selectedRecipes.size]);

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (!isSelectionMode) {
      setSelectedRecipes(new Set());
    }
  };

  const toggleRecipeSelection = (recipeId: string) => {
    if (!isSelectionMode) return;

    setSelectedRecipes((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(recipeId)) {
        newSelection.delete(recipeId);
      } else {
        newSelection.add(recipeId);
      }
      return newSelection;
    });
  };

  const copySelectedIngredients = () => {
    const selectedRecipesList = recipes.filter((recipe) =>
      selectedRecipes.has(recipe.id)
    );

    // Create a map to store combined ingredients
    const combinedIngredients = new Map<
      string,
      { amount: number; unit: string }
    >();

    // Process all ingredients from selected recipes
    selectedRecipesList.forEach((recipe) => {
      recipe.ingredients.forEach((ing) => {
        if (ing.amount) {
          const key = `${ing.name} (${ing.unit})`;
          const current = combinedIngredients.get(key) || {
            amount: 0,
            unit: ing.unit,
          };
          combinedIngredients.set(key, {
            amount: current.amount + ing.amount,
            unit: ing.unit,
          });
        }
      });
    });

    // Create the summary text
    const summaryText = Array.from(combinedIngredients.entries())
      .map(([name, { amount, unit }]) => `${name}: ${amount} ${unit}`)
      .join("\n");

    // Create the detailed recipe text
    const recipeDetails = selectedRecipesList
      .map((recipe) => {
        const ingredientsList = recipe.ingredients
          .map(
            (ing) =>
              `${ing.name}${ing.amount ? ` - ${ing.amount} ${ing.unit}` : ""}`
          )
          .join("\n");
        return `${recipe.name}:\n${ingredientsList}`;
      })
      .join("\n\n");

    // Combine summary and details
    const fullText = summaryText
      ? `${t("shopping.shopping_list_summary")}:\n${summaryText}\n\n${t(
          "shopping.detailed_recipes"
        )}:\n${recipeDetails}`
      : recipeDetails;

    navigator.clipboard
      .writeText(fullText)
      .then(() => {
        toast.success(t("shopping.ingredients_copied"));
      })
      .catch(() => {
        toast.error(t("shopping.failed_to_copy"));
      });
  };

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          {!usernameLoading && currentUsername && (
            <h1 className="text-xl font-bold">{t("shopping.shopping_list")}</h1>
          )}
          <div className="flex items-center gap-2">
            {selectedRecipes.size > 0 && (
              <div className="relative">
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={copySelectedIngredients}
                >
                  <Copy className="h-4 w-4" />
                  {t("shopping.copy")}
                </Button>
                {showCopyTooltip && (
                  <p className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm text-muted-foreground animate-in fade-in slide-in-from-top-2 whitespace-nowrap">
                    {t("shopping.click_to_copy")}
                  </p>
                )}
              </div>
            )}
            <Button
              variant={isSelectionMode ? "default" : "outline"}
              onClick={toggleSelectionMode}
              className="flex items-center gap-2"
            >
              {isSelectionMode ? (
                <>
                  <CheckSquare className="h-4 w-4" />({selectedRecipes.size})
                </>
              ) : (
                <>
                  <Square className="h-4 w-4" />
                  {t("common.select")}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      {loading ? (
        <div className="text-center">{t("shopping.loading")}</div>
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
              currentUsername={currentUsername}
              isSelectionMode={isSelectionMode}
              isSelected={selectedRecipes.has(recipe.id)}
              onSelect={toggleRecipeSelection}
            />
          ))}
        </div>
      )}
    </div>
  );
}
