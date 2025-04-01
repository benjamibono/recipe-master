import { Metadata } from "next";
import { supabase } from "@/lib/supabase";

// Define the layout component first
export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

// Define params type as Promise
export type ParamsType = Promise<{ id: string }>;

// Then define the metadata generation with Promise params
export async function generateMetadata(props: {
  params: ParamsType;
}): Promise<Metadata> {
  try {
    // Await the params
    const { id } = await props.params;

    // Load the recipe data
    const { data: recipe } = await supabase
      .from("recipes")
      .select("*")
      .eq("id", id)
      .single();

    if (!recipe) {
      return {
        title: "Recipe Not Found - Recipe Master",
      };
    }

    return {
      title: `${recipe.name} - Recipe Master`,
      description: `Check out this recipe for ${recipe.name}${
        recipe.servings ? ` (${recipe.servings} servings)` : ""
      } on Recipe Master!`,
      openGraph: {
        title: `${recipe.name} - Recipe Master`,
        description: `Check out this recipe for ${recipe.name}${
          recipe.servings ? ` (${recipe.servings} servings)` : ""
        } on Recipe Master!`,
        images: recipe.image_url ? [recipe.image_url] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: `${recipe.name} - Recipe Master`,
        description: `Check out this recipe for ${recipe.name}${
          recipe.servings ? ` (${recipe.servings} servings)` : ""
        } on Recipe Master!`,
        images: recipe.image_url ? [recipe.image_url] : undefined,
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Shared Recipe - Recipe Master",
    };
  }
}
