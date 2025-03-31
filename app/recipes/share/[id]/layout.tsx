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
        title: "Recipe Not Found - RecipeMaster",
      };
    }

    return {
      title: `${recipe.name} - RecipeMaster`,
      description: `Check out this recipe for ${recipe.name} on RecipeMaster!`,
      openGraph: {
        title: `${recipe.name} - RecipeMaster`,
        description: `Check out this recipe for ${recipe.name} on RecipeMaster!`,
        images: recipe.image_url ? [recipe.image_url] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: `${recipe.name} - RecipeMaster`,
        description: `Check out this recipe for ${recipe.name} on RecipeMaster!`,
        images: recipe.image_url ? [recipe.image_url] : undefined,
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Shared Recipe - RecipeMaster",
    };
  }
}
