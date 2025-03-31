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
      if (formData.instructions.length === 0) {
        throw new Error("At least one instruction is required");
      }

      // Update recipe in database
      const { error } = await supabase
        .from("recipes")
        .update({
          name: formData.name.trim(),
          time: recipe.type === "cooking" ? formData.time : 0,
          ingredients: formData.ingredients,
          instructions: formData.instructions,
        })
        .eq("id", recipe.id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Recipe updated successfully");
      setOpen(false);

      // Hard refresh the page to show the updated recipe
      window.location.reload();
    } catch (error) {
      console.error("Error updating recipe:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update recipe"
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Recipe</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
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

          {recipe.type === "cooking" && (
            <div className="space-y-2">
              <Label htmlFor="time">Preparation Time (minutes)</Label>
              <Input
                id="time"
                type="number"
                min="0"
                value={formData.time}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    time: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
          )}

          <div className="space-y-4">
            <Label>
              {recipe.type === "cleaning" ? "Materials" : "Ingredients"}
            </Label>
            <div className="grid grid-cols-[1fr,auto,auto] gap-2 items-end">
              <div className="space-y-2">
                <Input
                  placeholder="Name"
                  value={newIngredient.name}
                  onChange={(e) =>
                    setNewIngredient((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
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
                />
              </div>
              <div className="space-y-2">
                <Select
                  value={newIngredient.unit}
                  onValueChange={(value) =>
                    setNewIngredient((prev) => ({
                      ...prev,
                      unit: value as (typeof UNITS)[number]["value"],
                    }))
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
              </div>
              <Button
                type="button"
                onClick={handleAddIngredient}
                className="col-span-3"
              >
                Add {recipe.type === "cleaning" ? "Material" : "Ingredient"}
              </Button>
            </div>

            <ul className="space-y-2">
              {formData.ingredients.map((ingredient, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between bg-secondary p-2 rounded"
                >
                  <span>
                    {ingredient.amount} {ingredient.unit} {ingredient.name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveIngredient(index)}
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
              />
              <Button
                type="button"
                onClick={handleAddInstruction}
                className="w-full"
              >
                Add Instruction
              </Button>
            </div>

            <ol className="space-y-2">
              {formData.instructions.map((instruction, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between bg-secondary p-2 rounded"
                >
                  <span className="flex">
                    <span className="font-semibold mr-4">{index + 1}.</span>
                    <span>{instruction}</span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveInstruction(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ol>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
