import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Loader2 } from "lucide-react";
import Image from "next/image";
import { usePexelsSearch } from "@/lib/hooks/usePexelsSearch";
import { useLanguage } from "@/app/contexts/LanguageContext";

interface PexelsImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectImage: (imageUrl: string) => void;
}

export function PexelsImageDialog({
  open,
  onOpenChange,
  onSelectImage,
}: PexelsImageDialogProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const { searchImages, loading, results, error } = usePexelsSearch();
  const lastSearchedQuery = useRef<string>("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && searchQuery !== lastSearchedQuery.current) {
      lastSearchedQuery.current = searchQuery;
      searchImages(searchQuery);
    }
  };

  const handleSelectImage = (imageUrl: string) => {
    onSelectImage(imageUrl);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("recipes.searchImages", "Search for Images")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="search-query" className="sr-only">
                {t("search.search_recipes", "Search for images")}
              </Label>
              <Input
                id="search-query"
                placeholder={t(
                  "search.search_recipes_placeholder",
                  "Search for images..."
                )}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Button type="submit" disabled={loading || !searchQuery.trim()}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              {t("common.search", "Search")}
            </Button>
          </div>
        </form>

        {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

        {loading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}

        {results && results.photos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {results.photos.map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-square cursor-pointer overflow-hidden rounded-md hover:opacity-80 transition-opacity border"
                onClick={() => handleSelectImage(photo.src.original)}
              >
                <Image
                  src={photo.src.original}
                  alt={photo.alt || t("recipes.pexelsImage", "Pexels image")}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-1 text-xs truncate">
                  {t("recipes.photoBy", "Photo by")} {photo.photographer}
                </div>
              </div>
            ))}
          </div>
        ) : results && results.photos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {t("search.no_matches", "No images found for")} &quot;{searchQuery}
            &quot;.{" "}
            {t(
              "recipes.tryDifferentSearchTerm",
              "Try a different search term."
            )}
          </div>
        ) : null}

        {results && results.total_results > results.photos.length && (
          <div className="flex justify-center mt-4">
            <Button
              onClick={() =>
                searchImages(searchQuery, 15, (results.page || 1) + 1)
              }
              disabled={loading}
              variant="outline"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {t("recipes.loadMore", "Load More")}
            </Button>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500 text-center">
          {t("recipes.imagesProvidedBy", "Images provided by")}{" "}
          <a
            href="https://www.pexels.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Pexels
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
