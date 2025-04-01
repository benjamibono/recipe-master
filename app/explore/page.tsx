"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Recipe } from "@/lib/supabase";
import RecipeCard from "@/components/RecipeCard";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ExplorePage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  useEffect(() => {
    async function getCurrentUser() {
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
    }
    getCurrentUser();
  }, []);

  useEffect(() => {
    async function loadRecipes() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          toast.error("Please log in to explore recipes");
          router.push("/auth/login");
          return;
        }

        const { data, error } = await supabase
          .from("recipes")
          .select("*")
          .neq("user_id", user.id)
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
  }, [router]);

  if (loading) {
    return (
      <div className="container py-8">
        <div className="text-center">Loading recipes...</div>
      </div>
    );
  }

  return (
    <div className="container py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold mb-8">Explore Recipes</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
        {recipes.map((recipe) => (
          <div key={recipe.id} className="w-full h-full">
            <RecipeCard recipe={recipe} currentUsername={currentUsername} />
          </div>
        ))}
      </div>
    </div>
  );
}
