import { type PlateSlide } from "@/components/presentation/utils/parser";
import {
  deletePresentationById,
  getPresentationById,
  listPresentations,
  savePresentation,
  type PresentationRecord,
} from "@/lib/presentation-store";

function createId(): string {
  return crypto.randomUUID();
}

export async function createPresentation({
  content,
  title,
  theme = "default",
  outline,
  imageSource,
  presentationStyle,
  language,
}: {
  content: {
    slides: PlateSlide[];
  };
  title: string;
  theme?: string;
  outline?: string[];
  imageSource?: string;
  presentationStyle?: string;
  language?: string;
}) {
  try {
    const now = new Date();
    const id = createId();
    const presentationId = createId();

    const record: PresentationRecord = {
      id,
      title: title ?? "Untitled Presentation",
      thumbnailUrl: undefined,
      isPublic: false,
      createdAt: now,
      updatedAt: now,
      presentation: {
        id: presentationId,
        content,
        theme,
        imageSource,
        presentationStyle,
        language,
        outline,
      },
    };

    savePresentation(record);

    return {
      success: true,
      message: "Presentation created successfully",
      presentation: record,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Failed to create presentation",
    };
  }
}

export async function createEmptyPresentation(
  title: string,
  theme = "default",
  language = "en-US",
) {
  const emptyContent: { slides: PlateSlide[] } = { slides: [] };

  return createPresentation({
    content: emptyContent,
    title,
    theme,
    language,
  });
}

export async function updatePresentation({
  id,
  content,
  prompt,
  title,
  theme,
  outline,
  searchResults,
  imageSource,
  presentationStyle,
  language,
  thumbnailUrl,
}: {
  id: string;
  content?: {
    slides: PlateSlide[];
    config: Record<string, unknown>;
  };
  title?: string;
  theme?: string;
  prompt?: string;
  outline?: string[];
  searchResults?: Array<{ query: string; results: unknown[] }>;
  imageSource?: string;
  presentationStyle?: string;
  language?: string;
  thumbnailUrl?: string;
}) {
  try {
    const existing = getPresentationById(id);
    if (!existing) {
      return { success: false, message: "Presentation not found" };
    }

    const updated: PresentationRecord = {
      ...existing,
      title: title ?? existing.title,
      thumbnailUrl: thumbnailUrl ?? existing.thumbnailUrl,
      updatedAt: new Date(),
      presentation: {
        ...existing.presentation,
        prompt: prompt ?? existing.presentation.prompt,
        content: content ?? existing.presentation.content,
        theme: theme ?? existing.presentation.theme,
        imageSource: imageSource ?? existing.presentation.imageSource,
        presentationStyle:
          presentationStyle ?? existing.presentation.presentationStyle,
        language: language ?? existing.presentation.language,
        outline: outline ?? existing.presentation.outline,
        searchResults: searchResults ?? existing.presentation.searchResults,
      },
    };

    savePresentation(updated);

    return {
      success: true,
      message: "Presentation updated successfully",
      presentation: updated,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Failed to update presentation",
    };
  }
}

export async function updatePresentationTitle(id: string, title: string) {
  try {
    const existing = getPresentationById(id);
    if (!existing) {
      return { success: false, message: "Presentation not found" };
    }

    const updated = {
      ...existing,
      title,
      updatedAt: new Date(),
    };

    savePresentation(updated);

    return {
      success: true,
      message: "Presentation title updated successfully",
      presentation: updated,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Failed to update presentation title",
    };
  }
}

export async function deletePresentation(id: string) {
  return deletePresentations([id]);
}

export async function deletePresentations(ids: string[]) {
  try {
    ids.forEach(deletePresentationById);

    return {
      success: true,
      message:
        ids.length === 1
          ? "Presentation deleted successfully"
          : `${ids.length} presentations deleted successfully`,
    };
  } catch (error) {
    console.error("Failed to delete presentations:", error);
    return {
      success: false,
      message: "Failed to delete presentations",
    };
  }
}

export async function getPresentation(id: string) {
  try {
    const presentation = getPresentationById(id);

    if (!presentation) {
      return { success: false, message: "Presentation not found" };
    }

    return {
      success: true,
      presentation,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Failed to fetch presentation",
    };
  }
}

export async function getPresentationContent(id: string) {
  try {
    const presentation = getPresentationById(id);

    if (!presentation) {
      return {
        success: false,
        message: "Presentation not found",
      };
    }

    return {
      success: true,
      presentation: presentation.presentation,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Failed to fetch presentation",
    };
  }
}

export async function updatePresentationTheme(id: string, theme: string) {
  try {
    const existing = getPresentationById(id);
    if (!existing) {
      return { success: false, message: "Presentation not found" };
    }

    const updated: PresentationRecord = {
      ...existing,
      updatedAt: new Date(),
      presentation: {
        ...existing.presentation,
        theme,
      },
    };

    savePresentation(updated);

    return {
      success: true,
      message: "Presentation theme updated successfully",
      presentation: updated,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Failed to update presentation theme",
    };
  }
}

export async function duplicatePresentation(id: string, newTitle?: string) {
  try {
    const original = getPresentationById(id);

    if (!original) {
      return {
        success: false,
        message: "Original presentation not found",
      };
    }

    const now = new Date();
    const duplicated: PresentationRecord = {
      ...original,
      id: createId(),
      title: newTitle ?? `${original.title} (Copy)`,
      createdAt: now,
      updatedAt: now,
      presentation: {
        ...original.presentation,
        id: createId(),
      },
    };

    savePresentation(duplicated);

    return {
      success: true,
      message: "Presentation duplicated successfully",
      presentation: duplicated,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Failed to duplicate presentation",
    };
  }
}

export async function listAllPresentations() {
  return listPresentations();
}
