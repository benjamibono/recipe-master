import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Recipe } from "@/lib/supabase";
import { useLanguage } from "@/app/contexts/LanguageContext";

interface ShareRecipeDialogProps {
  recipe: Recipe;
}

export function ShareRecipeDialog({ recipe }: ShareRecipeDialogProps) {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  const handleShare = async () => {
    try {
      // Create a shareable URL with recipe ID
      const shareUrl = `${window.location.origin}/recipes/share/${recipe.id}`;

      // Try to use the native share API if available
      if (navigator.share) {
        await navigator.share({
          title: `${recipe.name} - Recipe Master`,
          text: t(
            "recipes.shareMessage",
            {
              name: recipe.name,
              servings: recipe.servings
                ? ` (${recipe.servings} ${t("recipes.servings")})`
                : "",
            },
            `Check out this recipe for ${recipe.name}${
              recipe.servings ? ` (${recipe.servings} servings)` : ""
            } on Recipe Master!`
          ),
          url: shareUrl,
        });
      } else {
        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(shareUrl);
        toast.success(
          t("recipes.shareSuccess", "Share link copied to clipboard!")
        );
      }
    } catch (error) {
      console.error("Error sharing recipe:", error);
      toast.error(t("recipes.shareFailed", "Failed to share recipe"));
    } finally {
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-10 w-10">
          <Share2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("recipes.shareRecipe", "Share Recipe")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>
            {t(
              "recipes.shareDescription",
              "Share this recipe with other Recipe Master users:"
            )}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button onClick={handleShare}>
              {t("recipes.shareRecipe", "Share Recipe")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
