import Image from "next/image";
import Link from "next/link";
import { Recipe } from "@/lib/supabase";
import { Clock } from "lucide-react";

interface RecipeCardProps {
  recipe: Recipe;
  currentUsername: string | null;
}

export default function RecipeCard({
  recipe,
  currentUsername,
}: RecipeCardProps) {
  const basePath = recipe.type === "cleaning" ? "/cleaning" : "/recipes";

  return (
    <Link href={`${basePath}/${recipe.id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex h-24">
        <div className="p-4 flex-1">
          <h3 className="text-lg font-semibold">{recipe.name}</h3>

          <div className="flex flex-col justify-between flex-1">
            {recipe.type === "cooking" && (
              <div className="mt-2 flex items-center text-gray-600">
                <Clock className="h-4 w-4 mr-2" />
                <span>{recipe.time} minutes</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-end">
          {recipe.creator_name && recipe.creator_name !== currentUsername && (
            <p className="text-xs text-gray-500 pr-2 pb-2">
              by {recipe.creator_name}
            </p>
          )}
          {recipe.image_url && (
            <div className="relative w-24 h-24 flex-shrink-0">
              <Image
                src={recipe.image_url}
                alt={recipe.name}
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
