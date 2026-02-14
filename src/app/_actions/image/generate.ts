"use server";

import { env } from "@/env";
import Together from "together-ai";

const together = env.TOGETHER_AI_API_KEY
  ? new Together({ apiKey: env.TOGETHER_AI_API_KEY })
  : null;

export type ImageModelList =
  | "black-forest-labs/FLUX1.1-pro"
  | "black-forest-labs/FLUX.1-schnell"
  | "black-forest-labs/FLUX.1-schnell-Free"
  | "black-forest-labs/FLUX.1-pro"
  | "black-forest-labs/FLUX.1-dev";

/**
 * Generate an image using BFL (Black Forest Labs) API directly.
 */
async function generateWithBFL(
  prompt: string,
  width = 1024,
  height = 768,
): Promise<string | null> {
  if (!env.FLUX_API_KEY) return null;

  try {
    console.log("Generating image with BFL Flux API...");
    
    // Create generation task
    const createResponse = await fetch("https://api.bfl.ml/v1/flux-pro-1.1", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Key": env.FLUX_API_KEY,
      },
      body: JSON.stringify({
        prompt,
        width,
        height,
      }),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!createResponse.ok) {
      console.error(`BFL API error: ${createResponse.status}`);
      return null;
    }

    const createData = await createResponse.json();
    const taskId = createData.id;

    if (!taskId) {
      console.error("BFL API: No task ID returned");
      return null;
    }

    // Poll for result (max 60 seconds)
    for (let i = 0; i < 30; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const resultResponse = await fetch(
        `https://api.bfl.ml/v1/get_result?id=${taskId}`,
        {
          headers: {
            "X-Key": env.FLUX_API_KEY,
          },
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!resultResponse.ok) continue;

      const resultData = await resultResponse.json();

      if (resultData.status === "Ready" && resultData.result?.sample) {
        return resultData.result.sample;
      }

      if (resultData.status === "Error") {
        console.error("BFL generation failed:", resultData);
        return null;
      }
    }

    return null;
  } catch (error) {
    console.error("BFL API error:", error);
    return null;
  }
}

/**
 * Generate an image using Pollinations.ai (free, no API key needed).
 * Returns a URL that generates the image on request.
 */
async function generateWithPollinations(
  prompt: string,
  width = 1024,
  height = 768,
): Promise<string> {
  const seed = Math.floor(Math.random() * 1000000);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

  // Follow redirects and get the final resolved URL with timeout
  const res = await fetch(url, { 
    redirect: "follow",
    signal: AbortSignal.timeout(30000), // 30 second timeout
  });
  if (!res.ok) {
    throw new Error(`Pollinations.ai returned status ${res.status}`);
  }
  // Use the final URL after redirects; fallback to original if no redirect occurred
  return res.url || url;
}

export async function generateImageAction(
  prompt: string,
  model: ImageModelList = "black-forest-labs/FLUX.1-schnell-Free",
) {
  try {
    // Priority 1: If Together AI is configured, use it
    if (together) {
      console.log(`Generating image with Together AI model: ${model}`);

      const response = (await together.images.create({
        model: model,
        prompt: prompt,
        width: 1024,
        height: 768,
        steps: model.includes("schnell") ? 4 : 28,
        n: 1,
      })) as unknown as {
        id: string;
        model: string;
        object: string;
        data: {
          url: string;
        }[];
      };

      const imageUrl = response.data[0]?.url;

      if (imageUrl) {
        return {
          success: true,
          image: {
            url: imageUrl,
            prompt,
          },
        };
      }
      // Fall through to BFL if Together AI returned no URL
    }

    // Priority 2: Try BFL API (Black Forest Labs) if configured
    if (env.FLUX_API_KEY) {
      const bflImageUrl = await generateWithBFL(prompt);
      if (bflImageUrl) {
        return {
          success: true,
          image: {
            url: bflImageUrl,
            prompt,
          },
        };
      }
    }

    // Priority 3: Fallback to Pollinations.ai (free, no API key needed)
    console.log("Using Pollinations.ai for image generation (free fallback)");
    const imageUrl = await generateWithPollinations(prompt);

    return {
      success: true,
      image: {
        url: imageUrl,
        prompt,
      },
    };
  } catch (error) {
    console.error("Error generating image:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate image",
    };
  }
}
