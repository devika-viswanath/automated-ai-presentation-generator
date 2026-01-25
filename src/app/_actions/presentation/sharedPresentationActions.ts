import {
  getPresentationById,
  savePresentation,
} from "@/lib/presentation-store";

/**
 * Get a public presentation without requiring authentication
 */
export async function getSharedPresentation(id: string) {
  try {
    const presentation = getPresentationById(id);

    if (!presentation || !presentation.isPublic) {
      return {
        success: false,
        message: "Presentation not found or not public",
      };
    }

    return {
      success: true,
      presentation,
    };
  } catch (error) {
    console.error("Error fetching shared presentation:", error);
    return {
      success: false,
      message: "Failed to fetch presentation",
    };
  }
}

/**
 * Toggle the public status of a presentation
 */
export async function togglePresentationPublicStatus(
  id: string,
  isPublic: boolean,
) {
  try {
    const presentation = getPresentationById(id);

    if (!presentation) {
      return {
        success: false,
        message: "Presentation not found",
      };
    }

    const updated = {
      ...presentation,
      isPublic,
      updatedAt: new Date(),
    };

    savePresentation(updated);

    return {
      success: true,
      message: isPublic
        ? "Presentation is now publicly accessible"
        : "Presentation is now private",
      presentation: updated,
    };
  } catch (error) {
    console.error("Error updating presentation public status:", error);
    return {
      success: false,
      message: "Failed to update presentation public status",
    };
  }
}
