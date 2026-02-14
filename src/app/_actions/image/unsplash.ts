"use server";

import { type LayoutType } from "@/components/presentation/utils/parser";
import { env } from "@/env";

export interface UnsplashImage {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string | null;
  description: string | null;
  user: {
    name: string;
    username: string;
  };
  links: {
    download_location: string;
  };
}

export interface UnsplashSearchResponse {
  results: UnsplashImage[];
  total: number;
  total_pages: number;
}

export async function getImageFromUnsplash(
  query: string,
  layoutType?: LayoutType,
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  const orientationQuery =
    layoutType === "vertical"
      ? "&orientation=landscape"
      : layoutType === "left" || layoutType === "right"
        ? "&orientation=portrait"
        : "&orientation=landscape";

  // Determine dimensions based on layout
  const isPortrait = layoutType === "left" || layoutType === "right";
  const width = isPortrait ? 768 : 1024;
  const height = isPortrait ? 1024 : 768;

  try {
    if (env.UNSPLASH_ACCESS_KEY) {
      // Use Unsplash when API key is available
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=1&per_page=1${orientationQuery}`,
        {
          headers: {
            Authorization: `Client-ID ${env.UNSPLASH_ACCESS_KEY}`,
          },
          signal: AbortSignal.timeout(15000), // 15 second timeout to prevent freezing
        },
      );

      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.status}`);
      }

      const data: UnsplashSearchResponse = await response.json();

      if (!data.results || data.results.length === 0) {
        return { success: false, error: "No images found for this query" };
      }

      const firstImage = data.results[0];
      if (!firstImage) {
        return { success: false, error: "No images found for this query" };
      }

      return {
        success: true,
        imageUrl: firstImage.urls.regular,
      };
    }

    // Fallback: use Pollinations.ai to generate a photographic-style image (free, no API key)
    console.log("Using Pollinations.ai as stock image fallback (no Unsplash key)");
    const stockPrompt = `professional high quality stock photograph of ${query}, photorealistic, editorial photography`;
    const seed = Math.floor(Math.random() * 1000000);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(stockPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

    // Follow redirects and get the final resolved URL with timeout
    const res = await fetch(pollinationsUrl, { 
      redirect: "follow",
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });
    if (!res.ok) {
      throw new Error(`Pollinations fallback returned status ${res.status}`);
    }

    return {
      success: true,
      imageUrl: res.url || pollinationsUrl,
    };
  } catch (error) {
    console.error("Error getting image:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get image",
    };
  }
}
