import { NextRequest, NextResponse } from "next/server";

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

interface PexelsResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: Photo[];
  next_page: string;
  prev_page: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  const perPage = searchParams.get("per_page") || "15";
  const page = searchParams.get("page") || "1";

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter is required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.PEXELS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Pexels API key is not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(
        query
      )}&per_page=${perPage}&page=${page}`,
      {
        headers: {
          Authorization: apiKey,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: "Pexels API error", details: errorData },
        { status: response.status }
      );
    }

    const data: PexelsResponse = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching from Pexels API:", error);
    return NextResponse.json(
      { error: "Failed to fetch images from Pexels" },
      { status: 500 }
    );
  }
}
