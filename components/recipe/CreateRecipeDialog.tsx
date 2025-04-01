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
  ingredients: Ingredient[];
  instructions: string[];
  image_url?: string;
}

interface CreateRecipeDialogProps {
  type?: "cooking" | "cleaning";
}

export function CreateRecipeDialog({
  type = "cooking",
}: CreateRecipeDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<RecipeFormData>({
    name: "",
    time: 0,
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
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in to create a recipe");
      }

      // Validate form data
      if (!formData.name.trim()) {
        throw new Error("Recipe name is required");
      }
      if (type === "cooking" && formData.time <= 0) {
        throw new Error("Preparation time must be greater than 0");
      }
      if (formData.ingredients.length === 0) {
        throw new Error(
          type === "cleaning"
            ? "At least one material is required"
            : "At least one ingredient is required"
        );
      }

      // Insert recipe into database
      const { error } = await supabase.from("recipes").insert({
        user_id: user.id,
        name: formData.name.trim(),
        time: type === "cooking" ? formData.time : 0,
        ingredients: formData.ingredients,
        instructions: formData.instructions,
        type: type,
        image_url: formData.image_url,
      });

      if (error) throw error;

      toast.success(
        `${
          type === "cleaning" ? "Cleaning recipe" : "Recipe"
        } created successfully`
      );

      // Reset form and close dialog
      setFormData({
        name: "",
        time: 0,
        ingredients: [],
        instructions: [],
      });
      setOpen(false);

      // Hard refresh the page to show the new recipe
      window.location.reload();
    } catch (error) {
      console.error("Error creating recipe:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create recipe"
      );
    } finally {
      setLoading(false);
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
      <DialogContent className="max-w-2xl sm:max-h-[90vh] overflow-y-auto top-0 sm:top-[50%] translate-y-0 sm:-translate-y-[50%] rounded-t-[10px] sm:rounded-[10px]">
        <DialogHeader>
          <DialogTitle>
            Create New {type === "cleaning" ? "Cleaning " : ""}Recipe
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-2 flex-1">
              <Label htmlFor="name">Recipe Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter recipe name"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="ml-4 flex-shrink-0"
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
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>{type === "cleaning" ? "Materials" : "Ingredients"}</Label>
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
                className="flex-1"
              />
              <Input
                type="number"
                min="0"
                placeholder="Amount"
                className="w-24"
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
                <SelectTrigger className="w-24">
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
              <Button type="button" onClick={handleAddIngredient}>
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {formData.ingredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-secondary p-2 rounded-md"
                >
                  <span>
                    {ingredient.name} - {ingredient.amount}{" "}
                    {UNITS.find((u) => u.value === ingredient.unit)?.label}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveIngredient(index)}
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
              />
              <Button type="button" onClick={handleAddInstruction}>
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {formData.instructions.map((instruction, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-secondary p-2 rounded-md"
                >
                  <span>
                    {index + 1}. {instruction}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveInstruction(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Recipe"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
