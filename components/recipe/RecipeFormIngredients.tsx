import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

export const UNITS = [
  { value: "g", label: "grams" },
  { value: "ml", label: "milliliters" },
  { value: "u", label: "units" },
] as const;

export interface Ingredient {
  name: string;
  amount: number;
  unit: (typeof UNITS)[number]["value"];
}

interface RecipeFormIngredientsProps {
  ingredients: Ingredient[];
  type: "cooking" | "cleaning";
  onAddIngredient: (ingredient: Ingredient) => void;
  onRemoveIngredient: (index: number) => void;
}

export function RecipeFormIngredients({
  ingredients,
  type,
  onAddIngredient,
  onRemoveIngredient,
}: RecipeFormIngredientsProps) {
  const [newIngredient, setNewIngredient] = useState<Ingredient>({
    name: "",
    amount: 0,
    unit: "g",
  });

  const handleAddIngredient = () => {
    if (newIngredient.name && newIngredient.amount > 0) {
      onAddIngredient(newIngredient);
      setNewIngredient({ name: "", amount: 0, unit: "g" });
    }
  };

  return (
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
            disabled={!newIngredient.name || newIngredient.amount <= 0}
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
        {ingredients.map((ingredient, index) => (
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
              onClick={() => onRemoveIngredient(index)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
