"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Recipe } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Image from "next/image";

export default function ShareRecipePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    async function loadRecipe() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          toast.error("Please log in to add this recipe");
          router.push("/auth/login");
          return;
        }

        // Load the shared recipe
        const { data, error } = await supabase
          .from("recipes")
          .select("*")
          .eq("id", params.id)
          .single();

        if (error) throw error;
        if (!data) {
          toast.error("Recipe not found");
          router.push("/recipes");
          return;
        }

        setRecipe(data);
      } catch (error) {
        console.error("Error loading shared recipe:", error);
        toast.error("Failed to load recipe");
      } finally {
        setLoading(false);
      }
    }

    loadRecipe();
  }, [params.id, router]);

  const handleAddRecipe = async () => {
    if (!recipe) return;
    setAdding(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in to add this recipe");
      }

      // Get the creator's information (username if available, or email)
      let creatorName = "";
      if (recipe.user_id) {
        const { data: creatorProfile } = await supabase
          .from("profiles")
          .select("username, email")
          .eq("id", recipe.user_id)
          .single();

        if (creatorProfile) {
          creatorName = creatorProfile.username || creatorProfile.email;
        }
      }

      let newImageUrl = recipe.image_url;

      // If there's an image URL, create a new unique path
      if (recipe.image_url) {
        // Extract the file extension from the original URL
        const urlParts = recipe.image_url.split(".");
        const fileExt = urlParts[urlParts.length - 1];

        // Generate a new unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const newFileName = `${timestamp}-${randomString}.${fileExt}`;

        // If it's a Supabase storage URL, try to determine the correct path
        if (recipe.image_url?.includes("supabase")) {
          const originalPath = recipe.image_url.split("/").pop();
          if (originalPath) {
            // Try different possible file paths
            const possiblePaths = [
              `public/${originalPath}`,
              `recipe-images/${originalPath}`,
            ];

            let copied = false;

            for (const path of possiblePaths) {
              try {
                // Attempt to copy the file from this path
                const { error: copyError } = await supabase.storage
                  .from("recipes")
                  .copy(path, `public/${newFileName}`);

                if (!copyError) {
                  // Get the public URL for the new file
                  const {
                    data: { publicUrl },
                  } = supabase.storage
                    .from("recipes")
                    .getPublicUrl(`public/${newFileName}`);

                  newImageUrl = publicUrl;
                  copied = true;
                  break; // Exit the loop if successful
                }
              } catch (error) {
                console.error(`Error copying from ${path}:`, error);
              }
            }

            if (!copied) {
              console.log("Could not copy image, using original URL");
            }
          }
        }
      }

      // Prepare the recipe data with the new image URL and creator information
      const newRecipeData = {
        name: recipe.name,
        type: recipe.type,
        time: recipe.time,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        image_url: newImageUrl,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        creator_name: creatorName,
        servings: recipe.servings,
      };

      // Create a new recipe for the current user
      const { data: newRecipe, error } = await supabase
        .from("recipes")
        .insert(newRecipeData)
        .select()
        .single();

      if (error) {
        console.error("Supabase error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw new Error(`Failed to add recipe: ${error.message}`);
      }

      if (!newRecipe) {
        throw new Error("Failed to add recipe - no data returned");
      }

      toast.success("Recipe added to your collection!");
      router.push(`/recipes/${newRecipe.id}`);
    } catch (error) {
      console.error("Error adding recipe:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add recipe"
      );
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="text-center">Loading shared recipe...</div>
      </div>
    );
  }

  if (!recipe) {
    return null;
  }

  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {recipe.image_url && (
            <div className="relative w-full h-48">
              <Image
                src={recipe.image_url}
                alt={recipe.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          )}
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">{recipe.name}</h1>
            <p className="text-gray-600 mb-6">
              Would you like to add this recipe to your collection?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => router.push("/recipes")}>
                Cancel
              </Button>
              <Button onClick={handleAddRecipe} disabled={adding}>
                {adding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add to My Recipes"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
