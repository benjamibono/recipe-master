import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "@/components/recipe/SortableItem";
import { useLanguage } from "@/app/contexts/LanguageContext";

export const UNITS = [
  { value: "g", label: "grams", labelEs: "gramos" },
  { value: "ml", label: "milliliters", labelEs: "mililitros" },
  { value: "u", label: "units", labelEs: "unidades" },
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
  onReorderIngredients: (newIngredients: Ingredient[]) => void;
}

export function RecipeFormIngredients({
  ingredients,
  type,
  onAddIngredient,
  onRemoveIngredient,
  onReorderIngredients,
}: RecipeFormIngredientsProps) {
  const { t, language } = useLanguage();
  const [newIngredient, setNewIngredient] = useState<Ingredient>({
    name: "",
    amount: 0,
    unit: "g",
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddIngredient = () => {
    if (newIngredient.name && newIngredient.amount > 0) {
      onAddIngredient(newIngredient);
      setNewIngredient({ name: "", amount: 0, unit: "g" });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id !== over.id) {
      const oldIndex = ingredients.findIndex(
        (_, index) => `ingredient-${index}` === active.id
      );
      const newIndex = ingredients.findIndex(
        (_, index) => `ingredient-${index}` === over?.id
      );

      const newIngredients = [...ingredients];
      const [movedItem] = newIngredients.splice(oldIndex, 1);
      newIngredients.splice(newIndex, 0, movedItem);

      onReorderIngredients(newIngredients);
    }
  };

  // Helper function to get the appropriate unit label based on language
  const getUnitLabel = (unit: (typeof UNITS)[number]) => {
    return language === "es" ? unit.labelEs : unit.label;
  };

  return (
    <div className="space-y-4">
      <div>
        <Input
          type="text"
          placeholder={t("recipes.ingredients")}
          value={newIngredient.name}
          onChange={(e) =>
            setNewIngredient((prev) => ({
              ...prev,
              name: e.target.value,
            }))
          }
          className="w-full h-10"
        />
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder={t("shopping.quantity")}
          value={newIngredient.amount.toString()}
          onChange={(e) =>
            setNewIngredient((prev) => ({
              ...prev,
              amount: parseFloat(e.target.value) || 0,
            }))
          }
          className="h-10 flex-1"
        />
        {type === "cooking" && (
          <Select
            value={newIngredient.unit}
            onValueChange={(value: (typeof UNITS)[number]["value"]) =>
              setNewIngredient((prev) => ({ ...prev, unit: value }))
            }
          >
            <SelectTrigger className="h-10 flex-1">
              <SelectValue placeholder={t("shopping.unit")} />
            </SelectTrigger>
            <SelectContent>
              {UNITS.map((unit) => (
                <SelectItem key={unit.value} value={unit.value}>
                  {getUnitLabel(unit)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button
          type="button"
          onClick={handleAddIngredient}
          disabled={!newIngredient.name.trim()}
          className="h-10 flex-1 bg-black hover:bg-black/90"
        >
          {t("common.add")}
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={ingredients.map((_, index) => `ingredient-${index}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {ingredients.map((ingredient, index) => (
              <SortableItem
                key={`ingredient-${index}`}
                id={`ingredient-${index}`}
              >
                <div className="flex items-center justify-between gap-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{ingredient.name}</span>
                    {type === "cooking" && (
                      <span className="text-muted-foreground">
                        {ingredient.amount} {ingredient.unit}
                      </span>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveIngredient(index)}
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
