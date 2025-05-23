"use client";

import { useState, useEffect, useRef } from "react";
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
import {
  Wand2,
  Loader2,
  Mic,
  MicOff,
  ImageIcon,
  Globe,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { RecipeFormIngredients } from "./RecipeFormIngredients";
import { RecipeFormInstructions } from "./RecipeFormInstructions";
import { useRecipeForm } from "@/lib/hooks/useRecipeForm";
import { useAudioRecorder } from "@/lib/hooks/useAudioRecorder";
import { uploadFile } from "@/lib/storage-utils";
import { PexelsImageDialog } from "./PexelsImageDialog";
import { useLanguage } from "@/app/contexts/LanguageContext";

interface CreateRecipeDialogProps {
  type?: "cooking" | "cleaning";
  onSuccess?: () => void;
}

const MAX_LAZY_TEXT_LENGTH = 4000;

export function CreateRecipeDialog({
  type = "cooking",
  onSuccess,
}: CreateRecipeDialogProps) {
  const { t, language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Dialog state
  const [open, setOpen] = useState(false);
  const [lazyDialogOpen, setLazyDialogOpen] = useState(false);
  const [lazyText, setLazyText] = useState("");
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [isTextTooLong, setIsTextTooLong] = useState(false);
  const [isProcessingText, setIsProcessingText] = useState(false);
  const [pexelsDialogOpen, setPexelsDialogOpen] = useState(false);

  // UI state
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Form state using custom hook
  const {
    state: formData,
    setName,
    setTime,
    setServings,
    addIngredient,
    removeIngredient,
    addInstruction,
    removeInstruction,
    setImage,
    mergeRecipe,
    mergeAudioData,
    reset,
    setInstructions,
    setIngredients,
  } = useRecipeForm();

  // Audio recording state using custom hook
  const { isRecording, startRecording, stopRecording } = useAudioRecorder();

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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Skip validation as it's handled by the form hook
    if (!formData.isValid) {
      toast.error(t("recipes.fill_all_fields"));
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error(t("recipes.login_required"));
        return;
      }

      // Create recipe
      const { data: recipe, error } = await supabase
        .from("recipes")
        .insert({
          name: formData.name,
          time: formData.time,
          servings: formData.servings,
          ingredients: formData.ingredients,
          instructions: formData.instructions,
          image_url: formData.image_url,
          type,
          user_id: user.id,
          macros_data: null,
          original_language: language,
        })
        .select("id")
        .single();

      if (error) throw error;

      // Show success message and close dialog
      toast.success(t("recipes.recipe_created"));
      setOpen(false);
      reset(); // Reset form state

      // Call onSuccess callback
      onSuccess?.();

      // Analyze macros in background for cooking recipes
      if (type === "cooking" && formData.ingredients.length > 0 && recipe?.id) {
        fetchNutritionalInfoInBackground(formData.ingredients, recipe.id);
      }
    } catch (error) {
      console.error("Error creating recipe:", error);
      toast.error(t("recipes.creation_failed"));
    } finally {
      setLoading(false);
    }
  };

  // Analyze macros in background
  const fetchNutritionalInfoInBackground = async (
    ingredients: typeof formData.ingredients,
    recipeId: number
  ) => {
    try {
      const response = await fetch("/api/analyze-macros", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ingredients }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          toast.error(
            `${data.error} The nutritional information will be analyzed automatically once the cooldown period is over.`
          );
        } else {
          throw new Error(data.error || "Failed to analyze macros");
        }
        return;
      }

      // Update the recipe with the macros data
      const { error: updateError } = await supabase
        .from("recipes")
        .update({
          macros_data: data.macros,
        })
        .eq("id", recipeId);

      if (updateError) {
        console.error("Error storing macros:", updateError);
      }
    } catch (error) {
      console.error("Error analyzing macros in background:", error);
    }
  };

  // Handle image upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          throw new Error(t("recipes.select_image_file"));
        }

        const imageUrl = await uploadFile(file);

        if (imageUrl) {
          setImage(imageUrl);
          toast.success(t("recipes.image_uploaded"));
        }
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(
          error instanceof Error ? error.message : t("recipes.upload_failed")
        );
      }
    }
  };

  // Generate recipe using AI
  const handleGenerateRecipe = async () => {
    if (!formData.name.trim()) {
      toast.error(t("recipes.enter_name_first"));
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch("/api/recipes/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: formData.name }),
      });

      if (!response.ok) {
        throw new Error(t("recipes.generation_failed"));
      }

      const recipe = await response.json();
      mergeRecipe(recipe);
      toast.success(t("recipes.recipe_generated"));
    } catch (error) {
      console.error("Error generating recipe:", error);
      toast.error(t("recipes.generation_failed"));
    } finally {
      setGenerating(false);
    }
  };

  // Handle audio recording
  const handleToggleRecording = async () => {
    if (isRecording) {
      setIsProcessingAudio(true);
      try {
        const recipeData = await stopRecording(language);
        if (recipeData) {
          mergeAudioData(recipeData);
          setLazyDialogOpen(false);
          toast.success(t("recipes.audio_recorded_success"));
        }
      } catch (error) {
        console.error("Error processing audio:", error);
        toast.error(t("recipes.audio_process_failed"));
      } finally {
        setIsProcessingAudio(false);
      }
    } else {
      await startRecording();
      toast.info(t("recipes.recording_started"));
    }
  };

  // Add this function inside CreateRecipeDialog component
  const handleLazyTextSubmit = async () => {
    if (!lazyText.trim()) {
      toast.error(t("recipes.enter_text_first"));
      return;
    }

    if (lazyText.length > MAX_LAZY_TEXT_LENGTH) {
      toast.error(t("recipes.text_too_long", { max: MAX_LAZY_TEXT_LENGTH }));
      return;
    }

    setIsProcessingText(true);
    try {
      const response = await fetch("/api/parse-recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcription: lazyText,
          language: language,
        }),
      });

      if (!response.ok) {
        throw new Error(t("recipes.parse_failed"));
      }

      const recipeData = await response.json();

      // Use the existing mergeRecipe function to update the form
      mergeRecipe(recipeData);

      // Close the lazy dialog
      setLazyDialogOpen(false);
      setLazyText("");

      toast.success(t("recipes.recipe_parsed"));
    } catch (error) {
      console.error("Error parsing recipe:", error);
      toast.error(t("recipes.parse_failed"));
    } finally {
      setIsProcessingText(false);
    }
  };

  // Add this new handler
  const handlePexelsImageSelect = (imageUrl: string) => {
    setImage(imageUrl);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-14 w-14 rounded-full fixed bottom-8 right-8 shadow-xl bg-primary hover:bg-primary/90 z-50"
        >
          <Plus className="h-8 w-8 text-white" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl overflow-y-auto max-h-screen">
        <DialogHeader>
          <DialogTitle>
            {type === "cleaning" ? t("cleaning.add_new") : t("recipes.add_new")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="space-y-2 flex-1">
              <Label htmlFor="name">{t("recipes.name")}</Label>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setIsNameFocused(true)}
                    onBlur={() => setIsNameFocused(false)}
                    placeholder={t("recipes.enter_recipe_name")}
                    className="h-10"
                    autoComplete="off"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 flex-shrink-0"
                    onClick={handleGenerateRecipe}
                    disabled={generating || !formData.name.trim()}
                  >
                    {generating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {isNameFocused && (
                  <p className="text-sm text-muted-foreground animate-in fade-in slide-in-from-top-2">
                    {t("recipes.wand_explanation")}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between gap-4">
            {type === "cooking" && (
              <div>
                <Label htmlFor="time">{t("recipes.prep_time")}</Label>
                <div className="h-10 mt-2">
                  <Input
                    id="time"
                    type="number"
                    min="0"
                    value={formData.time}
                    onChange={(e) => setTime(parseInt(e.target.value) || 0)}
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
                    setServings(Math.max(1, formData.servings - 1))
                  }
                >
                  -
                </Button>
                <span className="w-8 text-center">{formData.servings}</span>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 w-10"
                  onClick={() => setServings(formData.servings + 1)}
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
                      onClick={() => setImage(undefined)}
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
              </div>
            </div>
          </div>

          <RecipeFormIngredients
            ingredients={formData.ingredients}
            type={type}
            onAddIngredient={addIngredient}
            onRemoveIngredient={removeIngredient}
            onReorderIngredients={setIngredients}
          />

          <RecipeFormInstructions
            instructions={formData.instructions}
            onAddInstruction={addInstruction}
            onRemoveInstruction={removeInstruction}
            onReorderInstructions={setInstructions}
          />

          <div className="flex justify-between gap-2 sticky bottom-0 bg-background pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLazyDialogOpen(true)}
              className="h-10"
            >
              {t("recipes.lazy")}
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  setOpen(false);
                }}
                disabled={loading}
                className="h-10"
              >
                {t("recipes.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.isValid}
                className="h-10"
              >
                {loading ? t("recipes.creating") : t("recipes.create_recipe")}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>

      <Dialog open={lazyDialogOpen} onOpenChange={setLazyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("recipes.quick_recipe_input")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lazy-text">{t("recipes.describe_recipe")}</Label>
              <Input
                id="lazy-text"
                value={lazyText}
                onChange={(e) => {
                  const newText = e.target.value;
                  setLazyText(newText);
                  setIsTextTooLong(newText.length > MAX_LAZY_TEXT_LENGTH);
                }}
                placeholder={t("recipes.type_paste_recipe")}
              />
              <div
                className={`text-xs ${
                  isTextTooLong ? "text-red-500" : "text-muted-foreground"
                }`}
              >
                {lazyText.length}/{MAX_LAZY_TEXT_LENGTH}{" "}
                {t("recipes.characters")}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleLazyTextSubmit}
                disabled={isTextTooLong || isProcessingText}
              >
                {isProcessingText ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {t("recipes.create")}
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground text-center leading-tight">
                  {t("recipes.record_recipe")}
                  <br />
                  {t("recipes.transcribe_automatically")}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleToggleRecording}
                  disabled={isProcessingAudio}
                >
                  {isProcessingAudio ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isRecording ? (
                    <MicOff className="h-4 w-4 text-red-500" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PexelsImageDialog
        open={pexelsDialogOpen}
        onOpenChange={setPexelsDialogOpen}
        onSelectImage={handlePexelsImageSelect}
      />
    </Dialog>
  );
}
