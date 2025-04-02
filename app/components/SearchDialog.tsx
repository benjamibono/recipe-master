"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { Recipe } from "@/lib/supabase";
import Fuse from "fuse.js";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPageRecipes?: Recipe[];
}

export function SearchDialog({
  open,
  onOpenChange,
  currentPageRecipes = [],
}: SearchDialogProps) {
  const pathname = usePathname();
  const recipeType = pathname === "/cleaning" ? "cleaning" : "cooking";
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<Recipe[]>([]);
  const debouncedQuery = useDebounce(query, 300);

  // Reset query when dialog opens/closes
  useEffect(() => {
    setQuery("");
  }, [open]);

  // Search in current page recipes (client-side)
  useEffect(() => {
    if (debouncedQuery.length === 0) {
      setMatches([]);
      return;
    }

    // Initialize Fuse instance inside the effect
    const fuse = new Fuse(currentPageRecipes, {
      keys: ["name", "ingredients"],
      threshold: 0.8,
      ignoreLocation: true,
      minMatchCharLength: 1,
      shouldSort: true,
      findAllMatches: true,
      distance: 1000,
    });

    const results = fuse.search(debouncedQuery).map((result) => result.item);
    setMatches(results);
  }, [debouncedQuery, currentPageRecipes]);

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
              {/* Matches section */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Matches
                </h3>
                {matches.length > 0 ? (
                  <div className="space-y-2">
                    {matches.map((recipe) => (
                      <Link
                        key={`match-${recipe.id}`}
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
