import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowDownAZ, ArrowUpAZ, Clock } from "lucide-react";

export type SortOption = {
  field: "name" | "created_at";
  ascending: boolean;
};

interface SortControlsProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export function SortControls({ value, onChange }: SortControlsProps) {
  const options = [
    {
      value: "name-asc",
      label: "Name (A-Z)",
      icon: ArrowDownAZ,
    },
    {
      value: "name-desc",
      label: "Name (Z-A)",
      icon: ArrowUpAZ,
    },
    {
      value: "date-desc",
      label: "Newest First",
      icon: Clock,
    },
    {
      value: "date-asc",
      label: "Oldest First",
      icon: Clock,
    },
  ];

  const handleChange = (value: string) => {
    const [field, direction] = value.split("-");
    onChange({
      field: field as "name" | "created_at",
      ascending: direction === "asc",
    });
  };

  const currentValue = `${value.field}-${value.ascending ? "asc" : "desc"}`;

  return (
    <Select value={currentValue} onValueChange={handleChange}>
      <SelectTrigger className="w-[160px]">
        <SelectValue placeholder="Sort by..." />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="flex items-center gap-2"
          >
            <option.icon className="h-4 w-4" />
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
