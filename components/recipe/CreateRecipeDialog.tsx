import { useState } from "react";
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
import { Plus, X, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { ImageUpload } from "@/components/ImageUpload";
import { generateDummyRecipe } from "@/lib/dummyData";

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

      if (!response.ok) throw new Error("Failed to analyze macros");
      const data = await response.json();

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

  const fillDummyData = () => {
    const dummyData = generateDummyRecipe(type);
    setFormData({
      name: dummyData.name,
      time: dummyData.time,
      servings: dummyData.servings,
      ingredients: dummyData.ingredients,
      instructions: dummyData.instructions,
      image_url: dummyData.image_url,
    });
    toast.success("Filled with dummy data");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" className="rounded-full fixed bottom-6 right-6">
          <Plus className="h-6 w-6" />
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
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter recipe name"
                className="h-10"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 sm:ml-4 flex-shrink-0"
              onClick={fillDummyData}
              title="Fill with dummy data"
            >
              <Wand2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Recipe Image</Label>
            <ImageUpload
              currentImageUrl={formData.image_url}
              onImageSelect={handleImageSelect}
              onRemoveImage={() =>
                setFormData((prev) => ({ ...prev, image_url: undefined }))
              }
            />
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
            <Button type="submit" disabled={loading} className="h-10">
              {loading ? "Creating..." : "Create Recipe"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
