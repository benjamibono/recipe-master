"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Recipe } from "@/lib/supabase";
import RecipeCard from "@/components/RecipeCard";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { SearchDialog } from "../components/SearchDialog";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ExplorePage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
    <div className="container py-8">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Explore Recipes</h1>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>
      </div>
      {recipes.length === 0 ? (
        <div className="text-center text-gray-500">
          No recipes available to explore.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {recipes
            .filter((recipe) => recipe.creator_name !== currentUsername)
            .map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                currentUsername={currentUsername}
              />
            ))}
        </div>
      )}

      <SearchDialog
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        currentPageRecipes={recipes}
      />
    </div>
  );
}
