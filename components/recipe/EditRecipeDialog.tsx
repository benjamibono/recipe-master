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
import { Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Recipe } from "@/lib/supabase";
import { ImageUpload } from "@/components/ImageUpload";

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

interface EditRecipeDialogProps {
  recipe: Recipe;
}

export function EditRecipeDialog({ recipe }: EditRecipeDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: recipe.name,
    time: recipe.time,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    image_url: recipe.image_url,
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

      // Create the full path for the file
      const filePath = `public/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("recipes")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error details:", {
          message: uploadError.message,
        });
        throw uploadError;
      }

      if (!uploadData) {
        throw new Error("No upload data returned");
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("recipes").getPublicUrl(filePath);

      setFormData((prev) => ({
        ...prev,
        image_url: publicUrl,
      }));

      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload image"
      );
    }
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
        throw new Error("You must be logged in to edit a recipe");
      }

      // Validate form data
      if (!formData.name.trim()) {
        throw new Error("Recipe name is required");
      }
      if (recipe.type === "cooking" && formData.time <= 0) {
        throw new Error("Preparation time must be greater than 0");
      }
      if (formData.ingredients.length === 0) {
        throw new Error(
          recipe.type === "cleaning"
            ? "At least one material is required"
            : "At least one ingredient is required"
        );
      }

      // Validate ingredients data structure
      const validatedIngredients = formData.ingredients.map((ingredient) => ({
        name: String(ingredient.name).trim(),
        amount: Number(ingredient.amount),
        unit: String(ingredient.unit),
      }));

      // Validate instructions
      const validatedInstructions = formData.instructions.map((instruction) =>
        String(instruction).trim()
      );

      // Prepare update data
      const updateData = {
        name: formData.name.trim(),
        time: recipe.type === "cooking" ? Number(formData.time) : 0,
        ingredients: validatedIngredients,
        instructions: validatedInstructions,
        image_url: formData.image_url || null,
        updated_at: new Date().toISOString(),
      };

      // Update recipe in database
      const { data, error } = await supabase
        .from("recipes")
        .update(updateData)
        .eq("id", recipe.id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Supabase error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw new Error(`Failed to update recipe: ${error.message}`);
      }

      if (!data) {
        throw new Error("Failed to update recipe - no data returned");
      }

      toast.success("Recipe updated successfully");
      setOpen(false);

      // Hard refresh the page to show the updated recipe
      window.location.reload();
    } catch (error) {
      console.error("Error updating recipe:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while updating the recipe"
      );
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
      <DialogContent className="max-w-2xl h-[90vh] sm:h-auto sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="sticky top-0 bg-background z-10 pb-4 border-b">
          <DialogTitle>Edit Recipe</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
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

          {recipe.type === "cooking" && (
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

          <div className="space-y-4">
            <Label>
              {recipe.type === "cleaning" ? "Materials" : "Ingredients"}
            </Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Name"
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
                  Add {recipe.type === "cleaning" ? "Material" : "Ingredient"}
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="0"
                  placeholder="Amount"
                  value={newIngredient.amount || ""}
                  onChange={(e) =>
                    setNewIngredient((prev) => ({
                      ...prev,
                      amount: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-32 h-10"
                />
                <Select
                  value={newIngredient.unit}
                  onValueChange={(value) =>
                    setNewIngredient((prev) => ({
                      ...prev,
                      unit: value as (typeof UNITS)[number]["value"],
                    }))
                  }
                >
                  <SelectTrigger className="w-24 h-10">
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

            <ul className="space-y-2">
              {formData.ingredients.map((ingredient, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between bg-secondary p-3 rounded"
                >
                  <span className="flex-1">
                    {ingredient.amount} {ingredient.unit} {ingredient.name}
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
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <Label>Instructions</Label>
            <div className="space-y-2">
              <Input
                placeholder="Add an instruction"
                value={newInstruction}
                onChange={(e) => setNewInstruction(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddInstruction();
                  }
                }}
                className="h-10"
              />
              <Button
                type="button"
                onClick={handleAddInstruction}
                className="w-full h-10"
              >
                Add Instruction
              </Button>
            </div>

            <ol className="space-y-2">
              {formData.instructions.map((instruction, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between bg-secondary p-3 rounded"
                >
                  <span className="flex flex-1">
                    <span className="font-semibold mr-4">{index + 1}.</span>
                    <span>{instruction}</span>
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
                </li>
              ))}
            </ol>
          </div>

          <Button type="submit" className="w-full h-10" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
