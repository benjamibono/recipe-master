"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Clock, ArrowLeft, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { Recipe } from "@/lib/supabase";
import { toast } from "sonner";
import { EditRecipeDialog } from "@/components/recipe/EditRecipeDialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ShareRecipeDialog } from "@/components/recipe/ShareRecipeDialog";

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isIngredientsOpen, setIsIngredientsOpen] = useState(true);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(true);
  const [isMacrosOpen, setIsMacrosOpen] = useState(true);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [macros, setMacros] = useState<string | null>(null);
  const [loadingMacros, setLoadingMacros] = useState(false);
  const [currentServings, setCurrentServings] = useState<number>(0);
  const [originalServings, setOriginalServings] = useState<number>(0);

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
    }
    getCurrentUsername();
  }, []);

  useEffect(() => {
    async function loadRecipe() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          toast.error("Please log in to view this recipe");
          router.push("/auth/login");
          return;
        }

        const { data, error } = await supabase
          .from("recipes")
          .select("*")
          .eq("id", params.id)
          .eq("user_id", user.id)
          .single();

        if (error) throw error;
        if (!data) {
          toast.error("Recipe not found");
          router.push("/recipes");
          return;
        }

        setRecipe(data);
        setCurrentServings(data.servings);
        setOriginalServings(data.servings);

        // Use stored macros if available
        if (data.type === "cooking" && data.ingredients.length > 0) {
          if (data.macros_data) {
            setMacros(data.macros_data);
          } else {
            // Only fetch macros if they don't exist in the database
            setLoadingMacros(true);
            try {
              const response = await fetch("/api/analyze-macros", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ ingredients: data.ingredients }),
              });

              if (!response.ok) throw new Error("Failed to fetch macros");

              const { macros } = await response.json();
              setMacros(macros);

              // Store the macros in the database as JSONB
              const { error: updateError } = await supabase
                .from("recipes")
                .update({ macros_data: macros })
                .eq("id", data.id);

              if (updateError) {
                console.error("Error storing macros:", updateError);
                toast.error("Failed to store nutritional information");
              }
            } catch (error) {
              console.error("Error fetching macros:", error);
              toast.error("Failed to load nutritional information");
            } finally {
              setLoadingMacros(false);
            }
          }
        }
      } catch (error) {
        console.error("Error loading recipe:", error);
        toast.error("Failed to load recipe");
      } finally {
        setLoading(false);
      }
    }

    loadRecipe();
  }, [params.id, router]);

  const handleDelete = async () => {
    if (!recipe) return;
    setDeleting(true);

    try {
      const { error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", recipe.id);

      if (error) throw error;

      toast.success("Recipe deleted successfully");
      router.push("/recipes");
    } catch (error) {
      console.error("Error deleting recipe:", error);
      toast.error("Failed to delete recipe");
      setDeleteDialogOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const calculateAdjustedQuantity = (original: number) => {
    if (!originalServings) return original;
    return (original * currentServings) / originalServings;
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="text-center">Loading recipe...</div>
      </div>
    );
  }

  if (!recipe) {
    return null;
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="flex items-center gap-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <ShareRecipeDialog recipe={recipe} />
            <EditRecipeDialog recipe={recipe} />
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="icon" className="h-10 w-10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Recipe</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this recipe? This action
                    cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteDialogOpen(false)}
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {recipe.image_url && (
          <div className="relative w-full h-[200px] md:h-[400px] rounded-lg overflow-hidden">
            <Image
              src={recipe.image_url}
              alt={recipe.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
            />
          </div>
        )}

        <div>
          <h1 className="text-3xl font-bold mb-4">{recipe.name}</h1>
          {recipe.creator_name && recipe.creator_name !== currentUsername && (
            <p className="text-gray-600 mb-2">by {recipe.creator_name}</p>
          )}
          {recipe.type === "cooking" && (
            <div className="flex items-center gap-2 text-gray-600 mb-6">
              <Clock className="h-5 w-5" />
              <span>{recipe.time} minutes</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 mb-4">
          <span>Servings:</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentServings((prev) => Math.max(1, prev - 1))
              }
            >
              -
            </Button>
            <span>{currentServings}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentServings((prev) => prev + 1)}
            >
              +
            </Button>
          </div>
        </div>

        <Collapsible
          open={isIngredientsOpen}
          onOpenChange={setIsIngredientsOpen}
          className="space-y-2"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">
              {recipe.type === "cleaning" ? "Materials" : "Ingredients"}
            </h2>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-9 p-0">
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isIngredientsOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="space-y-2">
            {recipe.ingredients.map((ingredient, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b last:border-b-0"
              >
                <span className="font-medium">{ingredient.name}</span>
                <span>
                  {calculateAdjustedQuantity(ingredient.amount)}{" "}
                  {ingredient.unit}
                </span>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        <Collapsible
          open={isInstructionsOpen}
          onOpenChange={setIsInstructionsOpen}
          className="space-y-2"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Instructions</h2>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-9 p-0">
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isInstructionsOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="space-y-4">
            {recipe.instructions.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500">No instructions available</p>
                <p className="text-sm text-gray-400 mt-1">
                  Click the edit button to add instructions
                </p>
              </div>
            ) : (
              recipe.instructions.map((instruction, index) => (
                <div key={index} className="flex gap-4">
                  <span className="font-bold">{index + 1}.</span>
                  <p>{instruction}</p>
                </div>
              ))
            )}
          </CollapsibleContent>
        </Collapsible>

        <Collapsible
          open={isMacrosOpen}
          onOpenChange={setIsMacrosOpen}
          className="space-y-2"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Nutritional Information</h2>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-9 p-0">
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isMacrosOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="space-y-4">
            {loadingMacros ? (
              <div className="text-center py-4">
                <p className="text-gray-500">
                  Analyzing nutritional information...
                </p>
              </div>
            ) : macros ? (
              <div className="whitespace-pre-wrap">{macros}</div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">
                  No nutritional information available
                </p>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
