import { useState, useEffect } from "react";
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
import { Plus, Wand2, Loader2, Bot, Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { ImageUpload } from "@/components/ImageUpload";
import { RecipeFormIngredients } from "./RecipeFormIngredients";
import { RecipeFormInstructions } from "./RecipeFormInstructions";
import { useRecipeForm } from "@/lib/hooks/useRecipeForm";
import { useAudioRecorder } from "@/lib/hooks/useAudioRecorder";
import { uploadFile } from "@/lib/storage-utils";

interface CreateRecipeDialogProps {
  type?: "cooking" | "cleaning";
  onSuccess?: () => void;
}

const MAX_LAZY_TEXT_LENGTH = 4000;

export function CreateRecipeDialog({
  type = "cooking",
  onSuccess,
}: CreateRecipeDialogProps) {
  // Dialog state
  const [open, setOpen] = useState(false);
  const [lazyDialogOpen, setLazyDialogOpen] = useState(false);
  const [lazyText, setLazyText] = useState("");
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [isTextTooLong, setIsTextTooLong] = useState(false);

  // UI state
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);

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
  } = useRecipeForm();

  // Audio recording state using custom hook
  const { isRecording, startRecording, stopRecording } = useAudioRecorder();

  // Current user state
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  // Fetch current username
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Skip validation as it's handled by the form hook
    if (!formData.isValid) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Please log in to create a recipe");
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
        })
        .select("id")
        .single();

      if (error) throw error;

      // Show success message and close dialog
      toast.success("Recipe created successfully");
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
      toast.error("Failed to create recipe");
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
        .update({ macros_data: data.macros })
        .eq("id", recipeId);

      if (updateError) {
        console.error("Error storing macros:", updateError);
      }
    } catch (error) {
      console.error("Error analyzing macros in background:", error);
    }
  };

  // Handle image upload
  const handleImageSelect = async (file: File) => {
    try {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("Please select an image file");
      }

      const imageUrl = await uploadFile(file);

      if (imageUrl) {
        setImage(imageUrl);
        toast.success("Image uploaded successfully");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload image"
      );
    }
  };

  // Generate recipe using AI
  const handleGenerateRecipe = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a recipe name first");
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
        throw new Error("Failed to generate recipe");
      }

      const recipe = await response.json();
      mergeRecipe(recipe);
      toast.success("Recipe generated successfully!");
    } catch (error) {
      console.error("Error generating recipe:", error);
      toast.error("Failed to generate recipe");
    } finally {
      setGenerating(false);
    }
  };

  // Generate recipe image using AI
  const handleGenerateImage = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a recipe name first");
      return;
    }

    if (formData.ingredients.length === 0) {
      toast.error("Please add at least one ingredient first");
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
        throw new Error(errorData.error || "Failed to generate image");
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
        throw new Error("Failed to download generated image");
      }

      const blob = await proxyResponse.blob();

      // Upload to Supabase Storage
      const imageUrl = await uploadFile(blob, {
        contentType: "image/png",
      });

      if (imageUrl) {
        setImage(imageUrl);
        toast.success("Recipe image generated successfully!");
      }
    } catch (error) {
      console.error("Error in handleGenerateImage:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to generate recipe image"
      );
    } finally {
      setGeneratingImage(false);
    }
  };

  // Handle audio recording
  const handleToggleRecording = async () => {
    if (isRecording) {
      setIsProcessingAudio(true);
      try {
        const recipeData = await stopRecording();
        if (recipeData) {
          mergeAudioData(recipeData);
          setLazyDialogOpen(false);
          toast.success("Audio recorded and processed successfully!");
        }
      } catch (error) {
        console.error("Error processing audio:", error);
        toast.error("Failed to process audio");
      } finally {
        setIsProcessingAudio(false);
      }
    } else {
      await startRecording();
      toast.info("Recording started...");
    }
  };

  // Add this function inside CreateRecipeDialog component
  const handleLazyTextSubmit = async () => {
    if (!lazyText.trim()) {
      toast.error("Please enter some text first");
      return;
    }

    if (lazyText.length > MAX_LAZY_TEXT_LENGTH) {
      toast.error(
        `Text exceeds maximum length of ${MAX_LAZY_TEXT_LENGTH} characters`
      );
      return;
    }

    try {
      const response = await fetch("/api/parse-recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcription: lazyText }),
      });

      if (!response.ok) {
        throw new Error("Failed to parse recipe");
      }

      const recipeData = await response.json();

      // Use the existing mergeRecipe function to update the form
      mergeRecipe(recipeData);

      // Close the lazy dialog
      setLazyDialogOpen(false);
      setLazyText("");

      toast.success("Recipe parsed successfully!");
    } catch (error) {
      console.error("Error parsing recipe:", error);
      toast.error("Failed to parse recipe text");
    }
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
          size="lg"
          className="rounded-full fixed bottom-6 right-6 h-14 w-14"
        >
          <Plus className="h-8 w-8" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="sticky top-0 bg-background z-10 pb-4 border-b">
          <DialogTitle>
            Create New {type === "cleaning" ? "Cleaning " : ""}Recipe
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="space-y-2 flex-1">
              <Label htmlFor="name">Recipe Name</Label>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setIsNameFocused(true)}
                    onBlur={() => setIsNameFocused(false)}
                    placeholder="Enter recipe name"
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
                    Clicking the wand icon will generate an AI recipe
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Recipe Image</Label>
            <div className="flex gap-2">
              <ImageUpload
                currentImageUrl={formData.image_url}
                onImageSelect={handleImageSelect}
                onRemoveImage={() => setImage(undefined)}
              />
              {currentUsername === "benjamibono" && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="w-10 flex-shrink-0"
                  onClick={handleGenerateImage}
                  disabled={
                    generatingImage ||
                    !formData.name.trim() ||
                    formData.ingredients.length === 0
                  }
                >
                  {generatingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {type === "cooking" && (
            <div className="space-y-2">
              <Label htmlFor="time">Preparation Time (minutes)</Label>
              <Input
                id="time"
                type="number"
                min="0"
                value={formData.time === 0 ? "" : formData.time}
                onChange={(e) => setTime(parseInt(e.target.value) || 0)}
                className="h-10"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="servings">Number of Servings</Label>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setServings(formData.servings - 1)}
                  disabled={formData.servings <= 1}
                >
                  -
                </Button>
                <span className="w-8 text-center">{formData.servings}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setServings(formData.servings + 1)}
                >
                  +
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLazyDialogOpen(true)}
              >
                Feeling Lazy?
              </Button>
            </div>
          </div>

          <RecipeFormIngredients
            ingredients={formData.ingredients}
            type={type}
            onAddIngredient={addIngredient}
            onRemoveIngredient={removeIngredient}
          />

          <RecipeFormInstructions
            instructions={formData.instructions}
            onAddInstruction={addInstruction}
            onRemoveInstruction={removeInstruction}
          />

          <div className="flex justify-end gap-2 sticky bottom-0 bg-background pt-4 border-t">
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
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.isValid}
              className="h-10"
            >
              {loading ? "Creating..." : "Create Recipe"}
            </Button>
          </div>
        </form>
      </DialogContent>

      <Dialog open={lazyDialogOpen} onOpenChange={setLazyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Recipe Input</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lazy-text">Describe your recipe</Label>
              <Input
                id="lazy-text"
                value={lazyText}
                onChange={(e) => {
                  const newText = e.target.value;
                  setLazyText(newText);
                  setIsTextTooLong(newText.length > MAX_LAZY_TEXT_LENGTH);
                }}
                placeholder="Type or speak your recipe..."
              />
              <div
                className={`text-xs ${
                  isTextTooLong ? "text-red-500" : "text-muted-foreground"
                }`}
              >
                {lazyText.length}/{MAX_LAZY_TEXT_LENGTH} characters
              </div>
            </div>
            <div className="flex justify-between items-center">
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleLazyTextSubmit}
                disabled={isTextTooLong}
              >
                Create
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Or record your recipe with audio
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
    </Dialog>
  );
}
