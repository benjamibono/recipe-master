import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { SortableItem } from "./SortableItem";
import { useLanguage } from "@/app/contexts/LanguageContext";

interface RecipeFormInstructionsProps {
  instructions: string[];
  onAddInstruction: (instruction: string) => void;
  onRemoveInstruction: (index: number) => void;
  onReorderInstructions: (newInstructions: string[]) => void;
}

export function RecipeFormInstructions({
  instructions,
  onAddInstruction,
  onRemoveInstruction,
  onReorderInstructions,
}: RecipeFormInstructionsProps) {
  const { t, language } = useLanguage();
  const [newInstruction, setNewInstruction] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddInstruction = () => {
    if (newInstruction.trim()) {
      onAddInstruction(newInstruction);
      setNewInstruction("");
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id !== over.id) {
      const oldIndex = instructions.findIndex(
        (_, index) => `instruction-${index}` === active.id
      );
      const newIndex = instructions.findIndex(
        (_, index) => `instruction-${index}` === over?.id
      );

      const newInstructions = [...instructions];
      const [movedItem] = newInstructions.splice(oldIndex, 1);
      newInstructions.splice(newIndex, 0, movedItem);

      onReorderInstructions(newInstructions);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder={t("recipes.instructions")}
          value={newInstruction}
          onChange={(e) => setNewInstruction(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddInstruction();
            }
          }}
          className="flex-1 h-10"
        />
        <Button
          type="button"
          onClick={handleAddInstruction}
          disabled={!newInstruction.trim()}
          className="h-10 bg-black hover:bg-black/90"
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
          items={instructions.map((_, index) => `instruction-${index}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {instructions.map((instruction, index) => (
              <SortableItem
                key={`instruction-${index}`}
                id={`instruction-${index}`}
              >
                <div className="flex items-center gap-2 flex-1">
                  <span className="flex-1">{instruction}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveInstruction(index)}
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
