import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowDownAZ, ArrowUpAZ, Clock } from "lucide-react";
import { useLanguage } from "@/app/contexts/LanguageContext";

export type SortOption = {
  field: "name" | "created_at";
  ascending: boolean;
};

interface SortControlsProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export function SortControls({ value, onChange }: SortControlsProps) {
  const { t } = useLanguage();

  const options = [
    {
      value: "name-asc",
      label: t("recipes.sort.name_asc"),
      icon: ArrowDownAZ,
    },
    {
      value: "name-desc",
      label: t("recipes.sort.name_desc"),
      icon: ArrowUpAZ,
    },
    {
      value: "date-desc",
      label: t("recipes.sort.newest"),
      icon: Clock,
    },
    {
      value: "date-asc",
      label: t("recipes.sort.oldest"),
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

  // Find current option for display purposes
  const currentOption = options.find((option) => option.value === currentValue);

  return (
    <Select
      value={currentValue}
      onValueChange={handleChange}
      defaultValue="date-desc"
    >
      <SelectTrigger className="w-[140px]">
        <SelectValue>
          {currentOption && (
            <div className="flex items-center gap-2">
              <currentOption.icon className="h-4 w-4" />
              {currentOption.label}
            </div>
          )}
        </SelectValue>
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
