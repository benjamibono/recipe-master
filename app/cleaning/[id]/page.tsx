"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { Recipe } from "@/lib/supabase";
import { toast } from "sonner";
import { EditRecipeDialog } from "@/components/recipe/EditRecipeDialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function CleaningDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isMaterialsOpen, setIsMaterialsOpen] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);

  useEffect(() => {
    async function loadRecipe() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          toast.error("Please log in to view this recipe");
          router.push("/auth/login");
          return;
        }

        const { data, error } = await supabase
          .from("recipes")
          .select("*")
          .eq("id", params.id)
          .eq("user_id", user.id)
          .eq("type", "cleaning")
          .single();

        if (error) throw error;
        if (!data) {
          toast.error("Cleaning recipe not found");
          router.push("/cleaning");
          return;
        }

        setRecipe(data);
      } catch (error) {
        console.error("Error loading cleaning recipe:", error);
        toast.error("Failed to load cleaning recipe");
      } finally {
        setLoading(false);
      }
    }

    loadRecipe();
  }, [params.id, router]);

  const handleDelete = async () => {
    if (!recipe) return;
    setDeleting(true);

    try {
      const { error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", recipe.id);

      if (error) throw error;

      toast.success("Cleaning recipe deleted successfully");
      router.push("/cleaning");
    } catch (error) {
      console.error("Error deleting cleaning recipe:", error);
      toast.error("Failed to delete cleaning recipe");
      setDeleteDialogOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="text-center">Loading cleaning recipe...</div>
      </div>
    );
  }

  if (!recipe) {
    return null;
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <Button
          variant="ghost"
          className="flex items-center gap-2"
          onClick={() => router.push("/cleaning")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to cleaning recipes
        </Button>

        <div className="flex items-center gap-2">
          <EditRecipeDialog recipe={recipe} />
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Cleaning Recipe</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete &quot;{recipe.name}&quot;?
                  This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {recipe.image_url && (
          <div className="relative h-64 w-full">
            <Image
              src={recipe.image_url}
              alt={recipe.name}
              fill
              className="object-cover"
            />
          </div>
        )}

        <div className="p-6">
          <h1 className="text-3xl font-bold mb-4">{recipe.name}</h1>

          <div className="space-y-6">
            <Collapsible
              open={isMaterialsOpen}
              onOpenChange={setIsMaterialsOpen}
            >
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg">
                  <h2 className="text-2xl font-semibold">Materials</h2>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform duration-200 ${
                      isMaterialsOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="transition-all">
                <ul className="list-disc pl-6 mt-4 mb-6 space-y-2">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index}>
                      {ingredient.amount} {ingredient.unit} {ingredient.name}
                    </li>
                  ))}
                </ul>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible
              open={isInstructionsOpen}
              onOpenChange={setIsInstructionsOpen}
            >
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-lg">
                  <h2 className="text-2xl font-semibold">Instructions</h2>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform duration-200 ${
                      isInstructionsOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="transition-all">
                <ol className="space-y-4 mt-4">
                  {recipe.instructions.map((instruction, index) => (
                    <li key={index} className="flex">
                      <span className="font-semibold mr-4">{index + 1}.</span>
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ol>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </div>
    </div>
  );
}
