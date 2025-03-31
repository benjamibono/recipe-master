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

interface ShareRecipeDialogProps {
  recipe: Recipe;
}

export function ShareRecipeDialog({ recipe }: ShareRecipeDialogProps) {
  const [open, setOpen] = useState(false);

  const handleShare = async () => {
    try {
      // Create a shareable URL with recipe ID
      const shareUrl = `${window.location.origin}/recipes/share/${recipe.id}`;

      // Try to use the native share API if available
      if (navigator.share) {
        await navigator.share({
          title: `${recipe.name} - RecipeMaster`,
          text: `Check out this recipe for ${recipe.name} on RecipeMaster!`,
          url: shareUrl,
        });
      } else {
        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Share link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing recipe:", error);
      toast.error("Failed to share recipe");
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
          <DialogTitle>Share Recipe</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>Share this recipe with other RecipeMaster users:</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleShare}>Share Recipe</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
