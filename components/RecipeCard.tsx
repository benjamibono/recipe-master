import Image from "next/image";
import Link from "next/link";
import { Recipe } from "@/lib/supabase";
import { Clock } from "lucide-react";

interface RecipeCardProps {
  recipe: Recipe;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Link href={`/recipes/${recipe.id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
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

          <div className="mt-4 flex items-center text-gray-600">
            <Clock className="h-4 w-4 mr-2" />
            <span>{recipe.time} minutos</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
