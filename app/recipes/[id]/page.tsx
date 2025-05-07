"use client";

import { Recipe } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Clock, ArrowLeft, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { EditRecipeDialog } from "@/components/recipe/EditRecipeDialog";
import { ShareRecipeDialog } from "@/components/recipe/ShareRecipeDialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import NutritionPieChart from "@/components/recipe/NutritionPieChart";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { TranslationIndicator } from "@/components/recipe/TranslationIndicator";
import { useRecipeTranslation } from "@/lib/hooks/useRecipeTranslation";
import { getNormalizedNutritionKey } from "@/lib/string-utils";
import { useAuthContext } from "@/app/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Página de detalle de receta
 */
export default function RecipeDetailPage() {
  const params = useParams();
  const recipeId = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const { t } = useLanguage();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isIngredientsOpen, setIsIngredientsOpen] = useState(true);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(true);
  const [isMacrosOpen, setIsMacrosOpen] = useState(true);
  const [loadingMacros, setLoadingMacros] = useState(false);
  const [currentServings, setCurrentServings] = useState<number>(1);
  const [originalServings, setOriginalServings] = useState<number>(0);

  // Consulta para obtener los datos del perfil
  const { data: profile } = useQuery({
    queryKey: ["auth", "profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 60, // 1 hora
  });

  // Función para inicializar configuración después de cargar la receta
  const onRecipeLoaded = (data: Recipe) => {
    setCurrentServings(data.servings);
    setOriginalServings(data.servings);

    // Si es una receta de cocina y tiene ingredientes, comprobar los macros
    if (
      data.type === "cooking" &&
      data.ingredients.length > 0 &&
      (!data.macros_data || !data.macros_data.includes(":"))
    ) {
      fetchNutritionalInfo(data);
    }
  };

  // Consulta para obtener los datos de la receta
  const { data: recipe, isLoading } = useQuery<Recipe>({
    queryKey: ["recipe", recipeId],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", recipeId)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Recipe not found");

      return data as Recipe;
    },
    enabled: !!user?.id && !!recipeId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Efecto para configurar la receta después de cargarla
  useEffect(() => {
    if (recipe) {
      onRecipeLoaded(recipe);
    }
  }, [recipe]);

  // Manejo de errores de carga
  useEffect(() => {
    if (!user && !isLoading) {
      toast.error("Please log in to view this recipe");
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  // Consulta para obtener macros (solo cuando se necesita)
  const { data: macros } = useQuery({
    queryKey: ["recipe", recipeId, "macros"],
    queryFn: async () => {
      if (!recipe) return null;
      return recipe.macros_data || null;
    },
    enabled:
      !!recipe &&
      recipe.type === "cooking" &&
      !!recipe.macros_data &&
      recipe.macros_data.includes(":"),
  });

  // Hook para gestionar la traducción de la receta
  const {
    displayData,
    isShowingTranslation,
    isTranslating,
    needsTranslation,
    toggleTranslation,
  } = useRecipeTranslation(recipe || null);

  // Separate function to fetch nutritional information asynchronously
  const fetchNutritionalInfo = async (recipeData: Recipe) => {
    try {
      setLoadingMacros(true);

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

      // Actualizar la caché de React Query con los nuevos macros
      queryClient.setQueryData(["recipe", recipeId, "macros"], macros);

      // Store the macros in the database as JSONB
      const { error: updateError } = await supabase
        .from("recipes")
        .update({
          macros_data: macros,
        })
        .eq("id", recipeData.id);

      if (updateError) {
        console.error("Error storing macros:", updateError);
      } else {
        // Actualizar la caché de la receta con los nuevos macros
        queryClient.setQueryData<Recipe | undefined>(
          ["recipe", recipeId],
          (oldData) =>
            oldData ? { ...oldData, macros_data: macros } : undefined
        );
      }
    } catch (error) {
      console.error("Error fetching macros:", error);
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

      // Invalidar la caché después de eliminar
      queryClient.removeQueries({ queryKey: ["recipe", recipeId] });
      queryClient.invalidateQueries({ queryKey: ["recipes"] });

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

  if (isLoading) {
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

  if (!recipe || !displayData) {
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
          <div className="flex items-center gap-3">
            {recipe.user_id === user?.id && (
              <>
                <EditRecipeDialog recipe={recipe} />
                <ShareRecipeDialog recipe={recipe} />
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  {t("common.delete")}
                </Button>
              </>
            )}
          </div>
        </div>

        {recipe.image_url && (
          <div className="relative w-full h-[200px] md:h-[400px] rounded-lg overflow-hidden">
            <Image
              src={recipe.image_url}
              alt={displayData.name}
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
              <h1 className="text-3xl font-bold mb-4">{displayData.name}</h1>

              {/* Indicador de traducción */}
              {needsTranslation && (
                <TranslationIndicator
                  isTranslated={isShowingTranslation}
                  originalLanguage={recipe.original_language}
                  onToggle={toggleTranslation}
                  isTranslating={isTranslating}
                />
              )}

              {recipe.creator_name &&
                recipe.creator_name !== profile?.username && (
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
            {displayData.ingredients.map((ingredient, index) => (
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
            {displayData.instructions.length > 0 ? (
              displayData.instructions.map((instruction, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">{instruction}</div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 italic">
                {t("recipes.noInstructionsAvailable")}
                <br />
                {t("recipes.clickToAdd", { type: t("recipes.instructions") })}
              </p>
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

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("recipes.deleteRecipe")}</DialogTitle>
            <DialogDescription>
              {t("recipes.deleteConfirmation")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t("common.cancel")}</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? t("common.deleting") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
