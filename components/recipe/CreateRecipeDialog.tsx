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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, Wand2, Loader2, Bot, Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { ImageUpload } from "@/components/ImageUpload";
import { generateTextFromAudio } from "@/lib/audio-text";

const UNITS = [
  { value: "g", label: "grams" },
  { value: "ml", label: "milliliters" },
  { value: "u", label: "units" },
] as const;

interface Ingredient {
  name: string;
  amount: number;
  unit: (typeof UNITS)[number]["value"];
}

interface RecipeFormData {
  name: string;
  time: number;
  servings: number;
  ingredients: Ingredient[];
  instructions: string[];
  image_url?: string;
}

interface CreateRecipeDialogProps {
  type?: "cooking" | "cleaning";
  onSuccess?: () => void;
}

export function CreateRecipeDialog({
  type = "cooking",
  onSuccess,
}: CreateRecipeDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [formData, setFormData] = useState<RecipeFormData>({
    name: "",
    time: 0,
    servings: 1,
    ingredients: [],
    instructions: [],
  });
  const [newIngredient, setNewIngredient] = useState<Ingredient>({
    name: "",
    amount: 0,
    unit: "g",
  });
  const [newInstruction, setNewInstruction] = useState("");
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

  const handleAddIngredient = () => {
    if (newIngredient.name && newIngredient.amount > 0) {
      setFormData((prev) => ({
        ...prev,
        ingredients: [...prev.ingredients, newIngredient],
      }));
      setNewIngredient({ name: "", amount: 0, unit: "g" });
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const handleAddInstruction = () => {
    if (newInstruction.trim()) {
      setFormData((prev) => ({
        ...prev,
        instructions: [...prev.instructions, newInstruction],
      }));
      setNewInstruction("");
    }
  };

  const handleRemoveInstruction = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Add validation
    if (!formData.name.trim()) {
      toast.error("Please enter a recipe name");
      return;
    }

    if (formData.ingredients.length === 0) {
      toast.error("Please add at least one ingredient");
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

      // Create recipe immediately without waiting for macros analysis
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
          // Initially save without macros data
          macros_data: null,
        })
        .select("id")
        .single();

      if (error) throw error;

      // Show success message and close dialog
      toast.success("Recipe created successfully");
      setOpen(false);
      setFormData({
        name: "",
        time: 0,
        servings: 1,
        ingredients: [],
        instructions: [],
      });

      // Call onSuccess callback to navigate away immediately
      onSuccess?.();

      // Perform AI analysis in the background for cooking recipes with ingredients
      if (type === "cooking" && formData.ingredients.length > 0 && recipe?.id) {
        // No need to await this - it happens in the background
        fetchNutritionalInfoInBackground(formData.ingredients, recipe.id);
      }
    } catch (error) {
      console.error("Error creating recipe:", error);
      toast.error("Failed to create recipe");
    } finally {
      setLoading(false);
    }
  };

  // Separate function to fetch nutritional information in the background
  const fetchNutritionalInfoInBackground = async (
    ingredients: Ingredient[],
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

      // Update the recipe with the macros data once available
      const { error: updateError } = await supabase
        .from("recipes")
        .update({ macros_data: data.macros })
        .eq("id", recipeId);

      if (updateError) {
        console.error("Error storing macros:", updateError);
      }
    } catch (error) {
      console.error("Error analyzing macros in background:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to analyze nutritional information"
      );
    }
  };

  const handleImageSelect = async (file: File) => {
    try {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("Please select an image file");
      }

      // Generate a unique file name with timestamp
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;
      const filePath = `recipe-images/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("recipes")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("recipes").getPublicUrl(filePath);

      // Ensure the URL is properly formatted
      const imageUrl = new URL(publicUrl).toString();

      setFormData((prev) => ({
        ...prev,
        image_url: imageUrl,
      }));
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload image"
      );
    }
  };

  const handleGenerateRecipe = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a recipe name first");
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch("/api/generate-recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipeName: formData.name }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate recipe");
      }

      const generatedRecipe = await response.json();

      // Update form data with generated recipe
      setFormData((prev) => ({
        ...prev,
        name: generatedRecipe.name,
        time: generatedRecipe.time,
        servings: generatedRecipe.servings,
        ingredients: generatedRecipe.ingredients,
        instructions: generatedRecipe.instructions,
      }));

      toast.success("Recipe generated successfully!");
    } catch (error) {
      console.error("Error generating recipe:", error);
      toast.error("Failed to generate recipe");
    } finally {
      setGenerating(false);
    }
  };

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
      console.log("Calling generate-recipe-image API...");
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

      console.log("API response received, parsing JSON...");
      const imageData = await response.json();
      console.log("Generated image URL:", imageData.url);

      // Generate a unique file name with timestamp
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2);
      const fileName = `recipe-images/${timestamp}-${randomString}.jpg`;
      const filePath = fileName;

      console.log("Downloading image through proxy...");
      // Download the image through our proxy
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
        console.error(
          "Proxy download failed:",
          proxyResponse.status,
          proxyResponse.statusText
        );
        throw new Error("Failed to download generated image");
      }

      console.log("Converting image to blob...");
      const blob = await proxyResponse.blob();
      console.log("Blob created:", blob.size, "bytes");

      console.log("Uploading to Supabase storage...");
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("recipes")
        .upload(filePath, blob, {
          cacheControl: "3600",
          upsert: false,
          contentType: "image/png",
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error("Failed to upload image to storage");
      }

      console.log("Getting public URL...");
      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("recipes").getPublicUrl(filePath);

      console.log("Setting image URL in form:", publicUrl);
      // Update form data with the new image URL
      setFormData((prev) => ({
        ...prev,
        image_url: publicUrl,
      }));

      toast.success("Recipe image generated successfully!");
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Specify the MIME type explicitly, with fallbacks for different browsers
      let mimeType = "audio/webm";
      const types = ["audio/webm", "audio/mp4", "audio/ogg", "audio/wav"];

      // Find the first supported MIME type
      for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      // Configure the MediaRecorder with the supported format
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        audioBitsPerSecond: 128000,
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType, // Use the same MIME type we recorded with
        });

        try {
          const { recipeData } = await generateTextFromAudio(audioBlob);

          if (recipeData) {
            // Update form data with the parsed recipe information
            setFormData((prev) => ({
              ...prev,
              // Only update name if it exists and current name is empty
              name: recipeData.name && !prev.name ? recipeData.name : prev.name,
              // Only update time if it exists and is a valid number
              time:
                recipeData.time && recipeData.time > 0
                  ? recipeData.time
                  : prev.time,
              // Only update servings if it exists and is a valid number
              servings:
                recipeData.servings && recipeData.servings > 0
                  ? recipeData.servings
                  : prev.servings,
              // Add new ingredients to existing ones
              ingredients: [
                ...prev.ingredients,
                ...(recipeData.ingredients || [])
                  .filter(
                    (ing) =>
                      // Only add ingredients that don't already exist
                      !prev.ingredients.some(
                        (existing) =>
                          existing.name.toLowerCase() === ing.name.toLowerCase()
                      )
                  )
                  .map((ing) => ({
                    name: ing.name,
                    amount: ing.amount,
                    unit: (ing.unit === "g" ||
                    ing.unit === "ml" ||
                    ing.unit === "u"
                      ? ing.unit
                      : "u") as "g" | "ml" | "u",
                  })),
              ],
              // Add new instructions to existing ones
              instructions: [
                ...prev.instructions,
                ...(recipeData.instructions || []).filter(
                  (instruction) =>
                    // Only add instructions that don't already exist
                    !prev.instructions.some(
                      (existing) =>
                        existing.toLowerCase() === instruction.toLowerCase()
                    )
                ),
              ],
            }));

            toast.success("Recipe information updated from audio");
          } else {
            toast.warning(
              "No recipe information could be extracted from the audio"
            );
          }
        } catch (error) {
          console.error("Error processing audio:", error);
          toast.error("Failed to process audio input");
        }
      };

      mediaRecorder.start(1000); // Record in 1-second chunks
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      if ((error as Error).name === "NotAllowedError") {
        toast.error(
          "Microphone permission was denied. Please enable it in your browser settings."
        );
      } else if ((error as Error).name === "NotFoundError") {
        toast.error("No microphone found on your device.");
      } else {
        toast.error("Failed to access microphone");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((track) => {
          track.stop();
        });
      } catch (error) {
        console.error("Error stopping recording:", error);
      } finally {
        setIsRecording(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
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
                onRemoveImage={() =>
                  setFormData((prev) => ({ ...prev, image_url: undefined }))
                }
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
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    time: parseInt(e.target.value) || 0,
                  }))
                }
                className="h-10"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="servings">Number of Servings</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
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
                size="sm"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    servings: prev.servings + 1,
                  }))
                }
              >
                +
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={isRecording ? stopRecording : startRecording}
              >
                {isRecording ? (
                  <MicOff className="h-4 w-4 text-red-500" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{type === "cleaning" ? "Materials" : "Ingredients"}</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Ingredient name"
                  value={newIngredient.name}
                  onChange={(e) =>
                    setNewIngredient((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="flex-1 h-10"
                />
                <Button
                  type="button"
                  onClick={handleAddIngredient}
                  className="h-10"
                >
                  Add
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="0"
                  placeholder="Amount"
                  className="w-32 h-10"
                  value={newIngredient.amount || ""}
                  onChange={(e) =>
                    setNewIngredient((prev) => ({
                      ...prev,
                      amount: parseInt(e.target.value) || 0,
                    }))
                  }
                />
                <Select
                  value={newIngredient.unit}
                  onValueChange={(value: (typeof UNITS)[number]["value"]) =>
                    setNewIngredient((prev) => ({ ...prev, unit: value }))
                  }
                >
                  <SelectTrigger className="w-24 h-10 flex items-center justify-between">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              {formData.ingredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-secondary p-3 rounded-md"
                >
                  <span className="flex-1">
                    {ingredient.name} - {ingredient.amount}{" "}
                    {UNITS.find((u) => u.value === ingredient.unit)?.label}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveIngredient(index)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Instructions</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add instruction step"
                value={newInstruction}
                onChange={(e) => setNewInstruction(e.target.value)}
                className="h-10"
              />
              <Button
                type="button"
                onClick={handleAddInstruction}
                className="h-10"
              >
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {formData.instructions.map((instruction, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-secondary p-3 rounded-md"
                >
                  <span className="flex-1">
                    {index + 1}. {instruction}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveInstruction(index)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 sticky bottom-0 bg-background pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="h-10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                !formData.name.trim() ||
                formData.ingredients.length === 0
              }
              className="h-10"
            >
              {loading ? "Creating..." : "Create Recipe"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
