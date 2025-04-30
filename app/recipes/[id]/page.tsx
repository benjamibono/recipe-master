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
import NutritionPieChart from "@/components/recipe/NutritionPieChart";
import { useLanguage } from "@/app/contexts/LanguageContext";

// Helper function to normalize nutrition terms
const getNormalizedNutritionKey = (term: string): string => {
  // Convert to lowercase for case-insensitive comparison
  const lowerTerm = term.toLowerCase();

  // Map variant terms to their standardized keys
  if (lowerTerm === "carbs") return "carbohydrates";
  if (lowerTerm === "fats") return "fat";

  // Default case: return the term as is
  return lowerTerm;
};

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
  const [currentServings, setCurrentServings] = useState<number>(1);
  const [originalServings, setOriginalServings] = useState<number>(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showCopyHelper, setShowCopyHelper] = useState(false);
  const { t } = useLanguage();

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
    async function getCurrentUserId() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    }
    getCurrentUserId();
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

        // Load macros separately in the background if this is a cooking recipe
        if (data.type === "cooking" && data.ingredients.length > 0) {
          // If macros are already stored and valid, use them immediately
          if (data.macros_data && data.macros_data.includes(":")) {
            setMacros(data.macros_data);
          } else {
            // Set loading state and fetch macros in the background
            setLoadingMacros(true);
            fetchNutritionalInfo(data);
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

  // Add effect to show copy helper when recipe is loaded
  useEffect(() => {
    if (recipe && currentUsername && recipe.creator_name !== currentUsername) {
      const showTimer = setTimeout(() => setShowCopyHelper(true), 500);
      const hideTimer = setTimeout(() => setShowCopyHelper(false), 7000);
      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [recipe, currentUsername]);

  // Separate function to fetch nutritional information asynchronously
  const fetchNutritionalInfo = async (recipeData: Recipe) => {
    try {
      const response = await fetch("/api/analyze-macros", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ingredients: recipeData.ingredients }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch macros: ${response.statusText}`);
      }

      const { macros } = await response.json();

      // Validate the macros data format
      if (!macros || typeof macros !== "string" || !macros.includes(":")) {
        throw new Error("Invalid macros data format");
      }

      setMacros(macros);

      // Store the macros in the database as JSONB
      const { error: updateError } = await supabase
        .from("recipes")
        .update({
          macros_data: macros,
        })
        .eq("id", recipeData.id);

      if (updateError) {
        console.error("Error storing macros:", updateError);
        // Don't show error toast here as the user can still see the macros
      }
    } catch (error) {
      console.error("Error fetching macros:", error);
      // Only show error toast if we don't have any macros data
      if (!recipeData.macros_data) {
        toast.error("Failed to load nutritional information");
      }
    } finally {
      setLoadingMacros(false);
    }
  };

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
    return Math.round((original * currentServings) / originalServings);
  };

  if (loading) {
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
              {t("common.back")}
            </Button>
          </div>
          <div className="animate-pulse">
            <div className="h-[200px] md:h-[400px] bg-gray-200 rounded-lg w-full mb-8"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="space-y-2 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
              ))}
            </div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
              ))}
            </div>
          </div>
        </div>
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
            {t("common.back")}
          </Button>
          <div className="flex items-center gap-2">
            <ShareRecipeDialog recipe={recipe} />
            {recipe.user_id === currentUserId ? (
              <>
                <EditRecipeDialog recipe={recipe} />
                <Dialog
                  open={deleteDialogOpen}
                  onOpenChange={setDeleteDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-10 w-10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("recipes.deleteRecipe")}</DialogTitle>
                      <DialogDescription>
                        {t("recipes.deleteConfirmation")}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setDeleteDialogOpen(false)}
                        disabled={deleting}
                      >
                        {t("common.cancel")}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleting}
                      >
                        {deleting ? t("common.deleting") : t("common.delete")}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <div className="relative">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                  onClick={async () => {
                    try {
                      const {
                        data: { user },
                      } = await supabase.auth.getUser();

                      if (!user) {
                        toast.error(t("auth.loginRequired"));
                        router.push("/auth/login");
                        return;
                      }

                      // Create a new recipe for the current user
                      const { data: newRecipe, error } = await supabase
                        .from("recipes")
                        .insert({
                          name: recipe.name,
                          type: recipe.type,
                          time: recipe.time,
                          servings: recipe.servings,
                          ingredients: recipe.ingredients,
                          instructions: recipe.instructions,
                          image_url: recipe.image_url,
                          user_id: user.id,
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString(),
                          creator_name: recipe.creator_name,
                          macros_data: recipe.macros_data,
                        })
                        .select()
                        .single();

                      if (error) throw error;

                      toast.success(t("recipes.copiedSuccess"));
                      router.push(`/recipes/${newRecipe.id}`);
                    } catch (error) {
                      console.error("Error copying recipe:", error);
                      toast.error(t("recipes.copyFailed"));
                    }
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="9"
                      y="9"
                      width="13"
                      height="13"
                      rx="2"
                      ry="2"
                    ></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </Button>
                {showCopyHelper && (
                  <p className="absolute -top-6 right-0 pr-4 text-sm text-muted-foreground animate-in fade-in slide-in-from-top-2 whitespace-nowrap transition-opacity duration-300">
                    {t("recipes.clickToCopy")}
                  </p>
                )}
              </div>
            )}
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
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-4">{recipe.name}</h1>
              {recipe.creator_name &&
                recipe.creator_name !== currentUsername && (
                  <p className="text-gray-600 mb-2">
                    {t("recipes.by")} {recipe.creator_name}
                  </p>
                )}
              {recipe.type === "cooking" && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-5 w-5" />
                  <span>
                    {recipe.time} {t("recipes.minutes")}
                  </span>
                </div>
              )}
            </div>
            {recipe.type !== "shopping" && (
              <div className="flex flex-col items-center gap-2">
                <span className="text-sm text-gray-600">
                  {t("recipes.servings")}
                </span>
                <div className="flex items-center gap-1 md:gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 md:h-9 md:w-9"
                    onClick={() =>
                      setCurrentServings((prev) => Math.max(1, prev - 1))
                    }
                  >
                    -
                  </Button>
                  <span className="min-w-[1.5rem] md:min-w-[2rem] text-center">
                    {currentServings}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 md:h-9 md:w-9"
                    onClick={() => setCurrentServings((prev) => prev + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <Collapsible
          open={isIngredientsOpen}
          onOpenChange={setIsIngredientsOpen}
          className="space-y-2"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">
              {recipe.type === "cleaning"
                ? t("recipes.materials")
                : recipe.type === "shopping"
                ? t("recipes.items")
                : t("recipes.ingredients")}
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
                {recipe.type !== "shopping" && (
                  <span>
                    {calculateAdjustedQuantity(ingredient.amount)}{" "}
                    {ingredient.unit}
                  </span>
                )}
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
            <h2 className="text-2xl font-semibold">
              {recipe.type === "shopping"
                ? t("recipes.notes")
                : t("recipes.instructions")}
            </h2>
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
                <p className="text-gray-500">
                  {recipe.type === "shopping"
                    ? t("recipes.noNotesAvailable")
                    : t("recipes.noInstructionsAvailable")}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {t("recipes.clickToAdd", {
                    type:
                      recipe.type === "shopping"
                        ? t("recipes.notes")
                        : t("recipes.instructions"),
                  })}
                </p>
              </div>
            ) : (
              recipe.instructions.map((instruction, index) => (
                <div key={index} className="flex gap-4">
                  {recipe.type !== "shopping" && (
                    <span className="font-bold">{index + 1}.</span>
                  )}
                  <p>{instruction}</p>
                </div>
              ))
            )}
          </CollapsibleContent>
        </Collapsible>

        {recipe.type === "cooking" && (
          <Collapsible
            open={isMacrosOpen}
            onOpenChange={setIsMacrosOpen}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">
                {t("recipes.nutritionalInfo")}
              </h2>
              <div className="flex items-center gap-2">
                {recipe.type === "cooking" && !loadingMacros && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (recipe) {
                        setLoadingMacros(true);
                        fetchNutritionalInfo(recipe);
                      }
                    }}
                  >
                    {t("common.refresh")}
                  </Button>
                )}
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
            </div>
            <CollapsibleContent className="space-y-4">
              {loadingMacros ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">
                    {t("recipes.analyzingNutrition")}
                  </p>
                  <div className="mt-2 flex justify-center">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600"></div>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    {t("recipes.nutritionAnalysisTime")}
                  </p>
                </div>
              ) : macros && macros.includes(":") ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">
                      {t("recipes.perServing")}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {macros.split("\n").map((line, index) => {
                        const [label, value] = line
                          .split(":")
                          .map((part) => part.trim());
                        const numericValue = parseFloat(
                          value.replace(/,/g, "")
                        );
                        const perServingValue =
                          (numericValue / originalServings) * currentServings;
                        return (
                          <div
                            key={index}
                            className="bg-gray-50 rounded-lg p-4 text-center"
                          >
                            <div className="text-sm text-gray-600 mb-1">
                              {t(
                                `nutrition.${getNormalizedNutritionKey(
                                  label
                                ).replace(/ /g, "_")}`,
                                label
                              )}
                            </div>
                            <div className="text-xl font-semibold text-gray-900">
                              {label === "Energy value"
                                ? Math.round(perServingValue).toLocaleString()
                                : perServingValue.toFixed(1)}{" "}
                              {value.split(" ")[1]}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-8">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">
                      {t("recipes.nutritionalDistribution")}
                    </h3>
                    <NutritionPieChart macros={macros} />
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">
                      {t("recipes.recipeTotal")} • {recipe.servings}{" "}
                      {t("recipes.servings").toLowerCase()}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {macros.split("\n").map((line, index) => {
                        const [label, value] = line
                          .split(":")
                          .map((part) => part.trim());
                        return (
                          <div
                            key={index}
                            className="bg-gray-50 rounded-lg p-4 text-center"
                          >
                            <div className="text-sm text-gray-600 mb-1">
                              {t(
                                `nutrition.${getNormalizedNutritionKey(
                                  label
                                ).replace(/ /g, "_")}`,
                                label
                              )}
                            </div>
                            <div className="text-xl font-semibold text-gray-900">
                              {value}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">
                    {t("recipes.noNutritionAvailable")}
                  </p>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  );
}
