"use client";

import { useEffect, useState } from "react";
import { CreateRecipeDialog } from "@/components/recipe/CreateRecipeDialog";
import { supabase } from "@/lib/supabase";
import RecipeCard from "@/components/RecipeCard";
import { Recipe } from "@/lib/supabase";
import { toast } from "sonner";

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecipes() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          toast.error("Please log in to view your recipes");
          return;
        }

        const { data, error } = await supabase
          .from("recipes")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setRecipes(data || []);
      } catch (error) {
        console.error("Error loading recipes:", error);
        toast.error("Failed to load recipes");
      } finally {
        setLoading(false);
      }
    }

    loadRecipes();
  }, []);

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Your Recipes</h1>
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
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
      <CreateRecipeDialog />
    </div>
  );
}
