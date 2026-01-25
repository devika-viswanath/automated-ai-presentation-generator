import { z } from "zod";

// Schema for creating/updating a theme
const themeSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
  themeData: z.any(),
  logoUrl: z.string().optional(),
  isPublic: z.boolean().optional().default(false),
});

export type ThemeFormData = z.infer<typeof themeSchema>;

type ThemeRecord = ThemeFormData & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
};

type ThemeStore = Map<string, ThemeRecord>;

function getThemeStore(): ThemeStore {
  const globalForStore = globalThis as unknown as {
    __themeStore?: ThemeStore;
  };
  if (!globalForStore.__themeStore) {
    globalForStore.__themeStore = new Map();
  }
  return globalForStore.__themeStore;
}

function createId(): string {
  return crypto.randomUUID();
}

const DEFAULT_USER_ID = "local-user";

// Create a new custom theme
export async function createCustomTheme(formData: ThemeFormData) {
  try {
    const validatedData = themeSchema.parse(formData);
    const now = new Date();
    const id = createId();

    const record: ThemeRecord = {
      ...validatedData,
      id,
      createdAt: now,
      updatedAt: now,
      userId: DEFAULT_USER_ID,
    };

    getThemeStore().set(id, record);

    return {
      success: true,
      themeId: id,
      message: "Theme created successfully",
    };
  } catch (error) {
    console.error("Failed to create custom theme:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Invalid theme data. Please check your inputs and try again.",
      };
    }

    return {
      success: false,
      message: "Something went wrong. Please try again later.",
    };
  }
}

// Update an existing custom theme
export async function updateCustomTheme(
  themeId: string,
  formData: ThemeFormData,
) {
  try {
    const validatedData = themeSchema.parse(formData);
    const store = getThemeStore();
    const existing = store.get(themeId);

    if (!existing) {
      return { success: false, message: "Theme not found" };
    }

    const updated: ThemeRecord = {
      ...existing,
      ...validatedData,
      updatedAt: new Date(),
    };

    store.set(themeId, updated);

    return {
      success: true,
      message: "Theme updated successfully",
    };
  } catch (error) {
    console.error("Failed to update custom theme:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Invalid theme data. Please check your inputs and try again.",
      };
    }

    return {
      success: false,
      message: "Something went wrong. Please try again later.",
    };
  }
}

// Delete a custom theme
export async function deleteCustomTheme(themeId: string) {
  try {
    const store = getThemeStore();
    const existing = store.get(themeId);

    if (!existing) {
      return { success: false, message: "Theme not found" };
    }

    store.delete(themeId);

    return {
      success: true,
      message: "Theme deleted successfully",
    };
  } catch (error) {
    console.error("Failed to delete custom theme:", error);
    return {
      success: false,
      message:
        "Something went wrong while deleting the theme. Please try again later.",
    };
  }
}

// Get all custom themes for the current user
export async function getUserCustomThemes() {
  try {
    const themes = Array.from(getThemeStore().values()).filter(
      (theme) => theme.userId === DEFAULT_USER_ID,
    );

    return {
      success: true,
      themes,
    };
  } catch (error) {
    console.error("Failed to fetch custom themes:", error);
    return {
      success: false,
      message: "Unable to load themes at this time. Please try again later.",
      themes: [],
    };
  }
}

// Get all public themes
export async function getPublicCustomThemes() {
  try {
    const themes = Array.from(getThemeStore().values()).filter(
      (theme) => theme.isPublic,
    );

    return {
      success: true,
      themes,
    };
  } catch (error) {
    console.error("Failed to fetch public themes:", error);
    return {
      success: false,
      message:
        "Unable to load public themes at this time. Please try again later.",
      themes: [],
    };
  }
}

// Get a single theme by ID
export async function getCustomThemeById(themeId: string) {
  try {
    const theme = getThemeStore().get(themeId);

    if (!theme) {
      return { success: false, message: "Theme not found" };
    }

    return {
      success: true,
      theme,
    };
  } catch (error) {
    console.error("Failed to fetch theme:", error);
    return {
      success: false,
      message: "Unable to load the theme at this time. Please try again later.",
    };
  }
}
