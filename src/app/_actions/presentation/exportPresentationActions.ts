import { convertPlateJSToPPTX } from "@/components/presentation/utils/exportToPPT";
import { type PlateSlide } from "@/components/presentation/utils/parser";
import { getPresentationById } from "@/lib/presentation-store";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  return btoa(binary);
}

export async function exportPresentation(
  presentationId: string,
  fileName?: string,
  theme?: Partial<{
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    heading: string;
    muted: string;
  }>,
) {
  try {
    const presentation = getPresentationById(presentationId);
    if (!presentation?.presentation?.content) {
      return { success: false, error: "Presentation not found" };
    }

    const slides = (presentation.presentation.content as {
      slides: PlateSlide[];
    }).slides;

    const arrayBuffer = await convertPlateJSToPPTX({ slides }, theme);
    const base64 = arrayBufferToBase64(arrayBuffer);

    return {
      success: true,
      data: base64,
      fileName: `${fileName ?? "presentation"}.pptx`,
    };
  } catch (error) {
    console.error("Error exporting presentation:", error);
    return { success: false, error: "Failed to export presentation" };
  }
}
