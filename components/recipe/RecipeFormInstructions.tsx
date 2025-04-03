import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface RecipeFormInstructionsProps {
  instructions: string[];
  onAddInstruction: (instruction: string) => void;
  onRemoveInstruction: (index: number) => void;
}

export function RecipeFormInstructions({
  instructions,
  onAddInstruction,
  onRemoveInstruction,
}: RecipeFormInstructionsProps) {
  const [newInstruction, setNewInstruction] = useState("");

  const handleAddInstruction = () => {
    if (newInstruction.trim()) {
      onAddInstruction(newInstruction);
      setNewInstruction("");
    }
  };

  return (
    <div className="space-y-2">
      <Label>Instructions</Label>
      <div className="flex gap-2">
        <Input
          placeholder="Add instruction step"
          value={newInstruction}
          onChange={(e) => setNewInstruction(e.target.value)}
          className="h-10"
          onKeyDown={(e) => {
            if (e.key === "Enter" && newInstruction.trim()) {
              e.preventDefault();
              handleAddInstruction();
            }
          }}
        />
        <Button
          type="button"
          onClick={handleAddInstruction}
          className="h-10"
          disabled={!newInstruction.trim()}
        >
          Add
        </Button>
      </div>
      <div className="space-y-2">
        {instructions.map((instruction, index) => (
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
              onClick={() => onRemoveInstruction(index)}
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
