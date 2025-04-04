import { useState } from "react";

interface Photo {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  liked: boolean;
  alt: string;
}

interface PexelsSearchResult {
  total_results: number;
  page: number;
  per_page: number;
  photos: Photo[];
  next_page: string;
  prev_page: string;
}

export function usePexelsSearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PexelsSearchResult | null>(null);

  const searchImages = async (query: string, perPage = 15, page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/pexels-search?query=${encodeURIComponent(
          query
        )}&per_page=${perPage}&page=${page}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch images");
      }

      const data = await response.json();
      setResults(data);
      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    searchImages,
    loading,
    error,
    results,
  };
}
