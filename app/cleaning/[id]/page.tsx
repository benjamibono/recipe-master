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
          .single();

        if (error) throw error;
        if (!data) {
          toast.error("Recipe not found");
          router.push("/cleaning");
          return;
        }

        setRecipe(data);
      } catch (error) {
        console.error("Error loading recipe:", error);
        toast.error("Failed to load recipe");
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

      toast.success("Recipe deleted successfully");
      router.push("/cleaning");
    } catch (error) {
      console.error("Error deleting recipe:", error);
      toast.error("Failed to delete recipe");
      setDeleteDialogOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="text-center">Loading recipe...</div>
      </div>
    );
  }

  if (!recipe) {
    return null;
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="flex items-center gap-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <EditRecipeDialog recipe={recipe} />
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="icon" className="h-10 w-10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Recipe</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this recipe? This action
                    cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2">
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

        {recipe.image_url && (
          <div className="relative w-full h-[400px] rounded-lg overflow-hidden">
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

        <div>
          <h1 className="text-3xl font-bold mb-4">{recipe.name}</h1>
        </div>

        <Collapsible
          open={isMaterialsOpen}
          onOpenChange={setIsMaterialsOpen}
          className="space-y-2"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Materials</h2>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-9 p-0">
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isMaterialsOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="space-y-2">
            {recipe.ingredients.map((ingredient, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b last:border-b-0"
              >
                <span className="font-medium">{ingredient.name}</span>
                <span>
                  {ingredient.amount} {ingredient.unit}
                </span>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        <Collapsible
          open={isInstructionsOpen}
          onOpenChange={setIsInstructionsOpen}
          className="space-y-2"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Instructions</h2>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-9 p-0">
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    isInstructionsOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="space-y-4">
            {recipe.instructions.map((instruction, index) => (
              <div key={index} className="flex gap-4">
                <span className="font-bold">{index + 1}.</span>
                <p>{instruction}</p>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
