import Image from "next/image";
import Link from "next/link";
import { Recipe } from "@/lib/supabase";
import { Clock } from "lucide-react";

interface RecipeCardProps {
  recipe: Recipe;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const basePath = recipe.type === "cleaning" ? "/cleaning" : "/recipes";

  return (
    <Link href={`${basePath}/${recipe.id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        {recipe.image_url && (
          <div className="relative h-48 w-full">
            <Image
              src={recipe.image_url}
              alt={recipe.name}
              fill
              className="object-cover"
            />
          </div>
        )}

        <div className="p-4">
          <h3 className="text-xl font-semibold mb-2">{recipe.name}</h3>

          {recipe.type === "cooking" && (
            <div className="mt-4 flex items-center text-gray-600">
              <Clock className="h-4 w-4 mr-2" />
              <span>{recipe.time} minutes</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
