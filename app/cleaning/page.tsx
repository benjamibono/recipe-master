"use client";

import { useEffect, useState } from "react";
import { CreateRecipeDialog } from "@/components/recipe/CreateRecipeDialog";
import { supabase } from "@/lib/supabase";
import RecipeCard from "@/components/RecipeCard";
import { Recipe } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Utensils } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CleaningPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadRecipes() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please log in to view your cleaning recipes");
        return;
      }

      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "cleaning")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRecipes(data || []);
    } catch (error) {
      console.error("Error loading cleaning recipes:", error);
      toast.error("Failed to load cleaning recipes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecipes();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("cleaning_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "recipes",
          filter: `type=eq.cleaning`,
        },
        () => {
          loadRecipes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-4 mb-6">
        <h1 className="text-3xl font-bold">Your Cleaning Recipes</h1>
        <Button
          variant="outline"
          className="flex items-center gap-2 sm:self-start"
          onClick={() => router.push("/recipes")}
        >
          <Utensils className="h-4 w-4" />
          Go to Cooking Recipes
        </Button>
      </div>
      {loading ? (
        <div className="text-center">Loading your cleaning recipes...</div>
      ) : recipes.length === 0 ? (
        <div className="text-center text-gray-500">
          You haven&apos;t created any cleaning recipes yet. Click the + button
          to get started!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
      <CreateRecipeDialog type="cleaning" />
    </div>
  );
}
