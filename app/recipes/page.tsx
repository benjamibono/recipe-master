"use client";

import { useEffect, useState, useCallback } from "react";
import { CreateRecipeDialog } from "@/components/recipe/CreateRecipeDialog";
import { supabase } from "@/lib/supabase";
import RecipeCard from "@/components/RecipeCard";
import { Recipe } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  SortControls,
  type SortOption,
} from "@/components/recipe/SortControls";

export default function RecipesPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [usernameLoading, setUsernameLoading] = useState(true);
  const [sortOption, setSortOption] = useState<SortOption>({
    field: "created_at",
    ascending: false,
  });

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
      let query = supabase
        .from("recipes")
        .select("*")
        .eq("type", "cooking")
        .eq("user_id", user.id);

      // Apply sorting
      if (sortOption.field === "name") {
        console.log(
          "Applying name sort:",
          sortOption.ascending ? "ascending" : "descending"
        );
        query = query.order("name", {
          ascending: sortOption.ascending,
          nullsFirst: false,
          foreignTable: undefined,
        });
      } else {
        console.log(
          "Applying date sort:",
          sortOption.ascending ? "ascending" : "descending"
        );
        query = query.order("created_at", {
          ascending: sortOption.ascending,
          nullsFirst: false,
          foreignTable: undefined,
        });
      }

      console.log("Executing query...");
      const { data, error } = await query;

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
  }, [sortOption, router]);

  // Load recipes when sort option changes
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
          filter: `type=eq.cooking`,
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

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          {!usernameLoading && currentUsername && (
            <h1 className="text-base font-bold">
              {currentUsername}&apos;s Recipes
            </h1>
          )}
          <SortControls value={sortOption} onChange={setSortOption} />
        </div>
        <Button
          variant="outline"
          className="flex items-center gap-2 sm:self-start"
          onClick={() => router.push("/cleaning")}
        >
          <Sparkles className="h-4 w-4" />
          Go to Cleaning Recipes
        </Button>
      </div>
      {loading ? (
        <div className="text-center">Loading your recipes...</div>
      ) : recipes.length === 0 ? (
        <div className="text-center text-gray-500">
          You haven&apos;t created any recipes yet. Click the + button to get
          started!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              currentUsername={currentUsername}
            />
          ))}
        </div>
      )}
      <CreateRecipeDialog onSuccess={loadRecipes} />
    </div>
  );
}
