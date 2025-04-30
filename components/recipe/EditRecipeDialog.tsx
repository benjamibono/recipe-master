"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, ImageIcon, Bot, Loader2, Globe } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Recipe } from "@/lib/supabase";
import {
  RecipeFormIngredients,
  Ingredient,
  UNITS,
} from "./RecipeFormIngredients";
import { RecipeFormInstructions } from "./RecipeFormInstructions";
import Image from "next/image";
import { uploadFile } from "@/lib/storage-utils";
import { PexelsImageDialog } from "./PexelsImageDialog";
import { useLanguage } from "@/app/contexts/LanguageContext";

interface EditRecipeDialogProps {
  recipe: Recipe;
}

export function EditRecipeDialog({ recipe }: EditRecipeDialogProps) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // State management for dialog and form
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [pexelsDialogOpen, setPexelsDialogOpen] = useState(false);

  // Initialize form data with current recipe values and ensure ingredients have valid units
  const [formData, setFormData] = useState({
    name: recipe.name,
    time: recipe.time,
    servings: recipe.servings,
    ingredients: recipe.ingredients.map((ing) => ({
      ...ing,
      unit: ing.unit as (typeof UNITS)[number]["value"],
    })) as Ingredient[],
    instructions: recipe.instructions,
    image_url: recipe.image_url,
    macros_data: recipe.macros_data,
  });

  // Fetch current user
  useEffect(() => {
    async function getCurrentUsername() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();
      }
    }
    getCurrentUsername();
  }, []);

  // Handle image upload to Supabase storage
  const handleImageSelect = async (file: File) => {
    try {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error(t("recipes.select_image_file"));
      }

      const imageUrl = await uploadFile(file);

      if (imageUrl) {
        setFormData((prev) => ({
          ...prev,
          image_url: imageUrl,
        }));
        toast.success(t("recipes.image_uploaded"));
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error ? error.message : t("recipes.upload_failed")
      );
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  // Generate recipe image using AI
  const handleGenerateImage = async () => {
    if (!formData.name.trim()) {
      toast.error(t("recipes.enter_name_first"));
      return;
    }

    if (formData.ingredients.length === 0) {
      toast.error(t("recipes.add_ingredient_first"));
      return;
    }

    setGeneratingImage(true);
    try {
      const response = await fetch("/api/generate-recipe-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipeName: formData.name,
          ingredients: formData.ingredients,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || t("recipes.image_generation_failed")
        );
      }

      const imageData = await response.json();

      // Download image through proxy
      const proxyResponse = await fetch("/api/proxy-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: imageData.url,
        }),
      });

      if (!proxyResponse.ok) {
        throw new Error(t("recipes.download_failed"));
      }

      const blob = await proxyResponse.blob();

      // Upload to Supabase Storage
      const imageUrl = await uploadFile(blob, {
        contentType: "image/png",
      });

      if (imageUrl) {
        setFormData((prev) => ({
          ...prev,
          image_url: imageUrl,
        }));
        toast.success(t("recipes.image_generated"));
      }
    } catch (error) {
      console.error("Error in handleGenerateImage:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : t("recipes.image_generation_failed")
      );
    } finally {
      setGeneratingImage(false);
    }
  };

  // Add this new handler
  const handlePexelsImageSelect = (imageUrl: string) => {
    setFormData((prev) => ({
      ...prev,
      image_url: imageUrl,
    }));
  };

  // Handle form submission and recipe update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if user is authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error(t("recipes.login_required"));
        return;
      }

      // Get user's username for creator_name
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      if (!profile) {
        throw new Error(t("recipes.profile_not_found"));
      }

      // Get macros analysis for cooking recipes
      let macros_data = recipe.macros_data;

      // Check if ingredients have changed by comparing their string representations
      const originalIngredients = JSON.stringify(recipe.ingredients);
      const newIngredients = JSON.stringify(formData.ingredients);
      const ingredientsChanged = originalIngredients !== newIngredients;

      if (
        recipe.type === "cooking" &&
        formData.ingredients.length > 0 &&
        ingredientsChanged
      ) {
        try {
          const response = await fetch("/api/analyze-macros", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ ingredients: formData.ingredients }),
          });

          if (!response.ok)
            throw new Error(t("recipes.macros_analysis_failed"));
          const data = await response.json();
          macros_data = data.macros;

          console.log("Updated macros data for recipe");
        } catch (error) {
          console.error("Error analyzing macros:", error);
          toast.error(t("recipes.nutritional_info_failed"));
        }
      }

      // Check if significant changes were made
      const hasSignificantChanges =
        formData.name !== recipe.name ||
        JSON.stringify(formData.ingredients) !==
          JSON.stringify(recipe.ingredients) ||
        formData.image_url !== recipe.image_url;

      // Update recipe in Supabase database
      const { error } = await supabase
        .from("recipes")
        .update({
          name: formData.name,
          time: formData.time,
          servings: formData.servings,
          ingredients: formData.ingredients,
          instructions: formData.instructions,
          image_url: formData.image_url,
          macros_data,
          // Only update creator_name if significant changes were made
          ...(hasSignificantChanges && { creator_name: profile.username }),
        })
        .eq("id", recipe.id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success(t("recipes.recipe_updated"));
      setOpen(false);
      window.location.reload();
    } catch (error) {
      console.error("Error updating recipe:", error);
      toast.error(t("recipes.update_failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-10 w-10">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{recipe.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">{t("recipes.name")}</Label>
              <div className="h-10 mt-2">
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="h-10"
                />
              </div>
            </div>

            <div className="flex justify-between gap-4">
              {recipe.type === "cooking" && (
                <div>
                  <Label htmlFor="time">{t("recipes.prep_time")}</Label>
                  <div className="h-10 mt-2">
                    <Input
                      id="time"
                      type="number"
                      min="0"
                      value={formData.time === 0 ? "" : formData.time}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          time: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="h-10 w-24"
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="servings">{t("recipes.servings")}</Label>
                <div className="h-10 mt-2 flex items-center">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-10"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        servings: Math.max(1, prev.servings - 1),
                      }))
                    }
                  >
                    -
                  </Button>
                  <span className="w-8 text-center">{formData.servings}</span>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-10"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        servings: prev.servings + 1,
                      }))
                    }
                  >
                    +
                  </Button>
                </div>
              </div>

              <div>
                <Label>{t("recipes.image")}</Label>
                <div className="h-10 mt-2 flex gap-2">
                  {formData.image_url ? (
                    <div className="relative w-10 h-10">
                      <Image
                        src={formData.image_url}
                        alt={t("recipes.recipe_image")}
                        fill
                        className="object-cover rounded-md"
                        sizes="40px"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-4 w-4 rounded-full"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            image_url: undefined,
                          }))
                        }
                      >
                        <span className="sr-only">
                          {t("recipes.remove_image")}
                        </span>
                        ×
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => setPexelsDialogOpen(true)}
                  >
                    <Globe className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    onClick={handleGenerateImage}
                    disabled={generatingImage}
                  >
                    {generatingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label>
              {recipe.type === "cleaning"
                ? t("cleaning.materials")
                : t("recipes.ingredients")}
            </Label>
            <RecipeFormIngredients
              ingredients={formData.ingredients}
              type={recipe.type === "shopping" ? "cooking" : recipe.type}
              onAddIngredient={(ingredient) =>
                setFormData((prev) => ({
                  ...prev,
                  ingredients: [...prev.ingredients, ingredient],
                }))
              }
              onRemoveIngredient={(index) =>
                setFormData((prev) => ({
                  ...prev,
                  ingredients: prev.ingredients.filter((_, i) => i !== index),
                }))
              }
              onReorderIngredients={(newIngredients) =>
                setFormData((prev) => ({
                  ...prev,
                  ingredients: newIngredients,
                }))
              }
            />
          </div>

          <div className="space-y-4">
            <Label>{t("recipes.instructions")}</Label>
            <RecipeFormInstructions
              instructions={formData.instructions}
              onAddInstruction={(instruction) =>
                setFormData((prev) => ({
                  ...prev,
                  instructions: [...prev.instructions, instruction],
                }))
              }
              onRemoveInstruction={(index) =>
                setFormData((prev) => ({
                  ...prev,
                  instructions: prev.instructions.filter((_, i) => i !== index),
                }))
              }
              onReorderInstructions={(newInstructions) =>
                setFormData((prev) => ({
                  ...prev,
                  instructions: newInstructions,
                }))
              }
            />
          </div>

          <Button type="submit" className="w-full h-10" disabled={loading}>
            {loading ? t("recipes.saving") : t("recipes.save_changes")}
          </Button>
        </form>
      </DialogContent>

      <PexelsImageDialog
        open={pexelsDialogOpen}
        onOpenChange={setPexelsDialogOpen}
        onSelectImage={handlePexelsImageSelect}
      />
    </Dialog>
  );
}
