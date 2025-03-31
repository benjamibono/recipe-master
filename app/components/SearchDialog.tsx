"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useSearchCache } from "@/lib/hooks/useSearchCache";
import { supabase, Recipe } from "@/lib/supabase";
import Fuse from "fuse.js";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const pathname = usePathname();
  const recipeType = pathname === "/cleaning" ? "cleaning" : "cooking";
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recentMatches, setRecentMatches] = useState<Recipe[]>([]);
  const [allMatches, setAllMatches] = useState<Recipe[]>([]);
  const debouncedQuery = useDebounce(query, 300);
  const { cachedRecipes } = useSearchCache();

  // Reset query when dialog opens/closes
  useEffect(() => {
    setQuery("");
  }, [open]);

  // Search in cached recipes (client-side)
  useEffect(() => {
    // Initialize Fuse instance inside the effect
    const typedRecipes = cachedRecipes.filter(
      (recipe): recipe is Recipe => recipe.type === recipeType
    );

    const fuse = new Fuse(typedRecipes, {
      keys: ["name", "ingredients"],
      threshold: 0.8,
      ignoreLocation: true,
      minMatchCharLength: 1,
      shouldSort: true,
      findAllMatches: true,
      distance: 1000,
    });

    if (debouncedQuery.length > 0) {
      const results = fuse.search(debouncedQuery).map((result) => result.item);
      setRecentMatches(results);
    } else {
      setRecentMatches([]);
    }
  }, [debouncedQuery, cachedRecipes, recipeType]);

  // Search all recipes (server-side)
  useEffect(() => {
    const searchAllRecipes = async () => {
      if (debouncedQuery.length === 0) {
        setAllMatches([]);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("recipes")
          .select("*")
          .eq("type", recipeType)
          .ilike("name", `%${debouncedQuery}%`);

        if (error) throw error;
        setAllMatches(data || []);
      } catch (error) {
        console.error("Search error:", error);
        setAllMatches([]);
      } finally {
        setIsLoading(false);
      }
    };

    searchAllRecipes();
  }, [debouncedQuery, recipeType]);

  const handleResultClick = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogTitle className="sr-only">
          Search {recipeType === "cleaning" ? "Cleaning" : ""} Recipes
        </DialogTitle>
        <div className="space-y-4 py-6">
          <Input
            placeholder={`Search ${recipeType} recipes...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full"
            autoFocus
          />

          {query.length > 0 && (
            <div className="space-y-6">
              {/* Recent matches section */}
              {recentMatches.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Recent Matches
                  </h3>
                  <div className="space-y-2">
                    {recentMatches.map((recipe) => (
                      <Link
                        key={`recent-${recipe.id}`}
                        href={`/${
                          recipeType === "cleaning" ? "cleaning" : "recipes"
                        }/${recipe.id}`}
                        className="block p-3 hover:bg-gray-100 rounded-lg"
                        onClick={handleResultClick}
                      >
                        <div className="font-medium">{recipe.name}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* All matches section */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  All Matches
                </h3>
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : allMatches.length > 0 ? (
                  <div className="space-y-2">
                    {allMatches
                      .filter(
                        (recipe) =>
                          !recentMatches.some((r) => r.id === recipe.id)
                      )
                      .map((recipe) => (
                        <Link
                          key={`all-${recipe.id}`}
                          href={`/${
                            recipeType === "cleaning" ? "cleaning" : "recipes"
                          }/${recipe.id}`}
                          className="block p-3 hover:bg-gray-100 rounded-lg"
                          onClick={handleResultClick}
                        >
                          <div className="font-medium">{recipe.name}</div>
                        </Link>
                      ))}
                  </div>
                ) : (
                  <div className="text-gray-500">No matches found.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
