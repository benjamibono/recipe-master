import Image from "next/image";
import Link from "next/link";
import { Recipe } from "@/lib/supabase";
import { Clock } from "lucide-react";
import { useLanguage } from "@/app/contexts/LanguageContext";

interface RecipeCardProps {
  recipe: Recipe;
  currentUsername: string | null;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (recipeId: string) => void;
}

export default function RecipeCard({
  recipe,
  currentUsername,
  isSelectionMode = false,
  isSelected = false,
  onSelect,
}: RecipeCardProps) {
  const { t } = useLanguage();
  const basePath = recipe.type === "cleaning" ? "/cleaning" : "/recipes";

  const handleClick = (e: React.MouseEvent) => {
    if (isSelectionMode && onSelect) {
      e.preventDefault();
      onSelect(recipe.id);
    }
  };

  const cardContent = (
    <div
      className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex min-h-[120px] w-full ${
        isSelectionMode ? "cursor-pointer" : ""
      } ${isSelectionMode && isSelected ? "border-2 border-black" : ""}`}
      onClick={handleClick}
    >
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-lg font-semibold line-clamp-2">{recipe.name}</h3>

        <div className="flex flex-col justify-between flex-1 mt-2">
          {recipe.type === "cooking" && (
            <div className="flex items-center text-gray-600">
              <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>
                {recipe.time} {t("recipes.minutes")}
              </span>
            </div>
          )}
          {recipe.creator_name && recipe.creator_name !== currentUsername && (
            <p className="text-xs text-gray-500 mt-auto">
              {t("recipes.by")} {recipe.creator_name}
            </p>
          )}
        </div>
      </div>

      {recipe.image_url && (
        <div className="relative w-32 h-32 flex-shrink-0">
          <Image
            src={recipe.image_url}
            alt={recipe.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority
          />
        </div>
      )}
    </div>
  );

  if (isSelectionMode) {
    return cardContent;
  }

  return (
    <Link href={`${basePath}/${recipe.id}`} className="block w-full">
      {cardContent}
    </Link>
  );
}
