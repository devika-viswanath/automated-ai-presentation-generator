// components/export-ppt-button.tsx
"use client";

import { exportPresentation } from "@/app/_actions/presentation/exportPresentationActions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { themes } from "@/lib/presentation/themes";
import { usePresentationState } from "@/states/presentation-state";
import { Download, FileText, Presentation } from "lucide-react";
import { useState } from "react";

interface ExportPPTButtonProps {
  presentationId: string;
  fileName?: string;
}

export function ExportButton({
  presentationId,
  fileName = "presentation",
}: ExportPPTButtonProps) {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pptx" | "pdf" | null>(null);
  const { toast } = useToast();
  const theme = usePresentationState((s) => s.theme);
  const customThemeData = usePresentationState((s) => s.customThemeData);

  const getThemeColors = () => {
    if (customThemeData) {
      const colors = customThemeData.colors.light;
      return {
        primary: colors.primary.replace("#", ""),
        secondary: colors.secondary.replace("#", ""),
        accent: colors.accent.replace("#", ""),
        background: colors.background.replace("#", ""),
        text: colors.text.replace("#", ""),
        heading: colors.heading.replace("#", ""),
        muted: colors.muted.replace("#", ""),
      };
    }
    if (typeof theme === "string" && theme in themes) {
      const t = themes[theme as keyof typeof themes];
      const colors = t.colors.light;
      return {
        primary: colors.primary.replace("#", ""),
        secondary: colors.secondary.replace("#", ""),
        accent: colors.accent.replace("#", ""),
        background: colors.background.replace("#", ""),
        text: colors.text.replace("#", ""),
        heading: colors.heading.replace("#", ""),
        muted: colors.muted.replace("#", ""),
      };
    }
    return undefined;
  };

  const handleExportPPTX = async () => {
    try {
      setIsExporting(true);
      setExportFormat("pptx");

      const themeColors = getThemeColors();
      const result = await exportPresentation(
        presentationId,
        fileName,
        themeColors,
      );

      if (result.success && result.data) {
        const byteCharacters = atob(result.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.fileName ?? `${fileName}.pptx`;
        document.body.appendChild(link);
        link.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(link);

        toast({
          title: "Export Successful",
          description: "Presentation exported as PowerPoint (.pptx).",
        });
        setIsExportDialogOpen(false);
      } else {
        throw new Error(result.error ?? "Export failed");
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting your presentation.",
        variant: "destructive",
      });
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      setExportFormat("pdf");

      // Close the dialog first so slides are visible for capture
      setIsExportDialogOpen(false);

      // Wait for dialog to close and DOM to settle
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Dynamically import html2canvas-pro and pdf-lib
      const [html2canvasModule, pdfLibModule] = await Promise.all([
        import("html2canvas-pro"),
        import("pdf-lib"),
      ]);
      const html2canvas = html2canvasModule.default;
      const { PDFDocument } = pdfLibModule;

      // Find slide containers - use multiple selectors for robustness
      const presentationContainer = document.querySelector(".presentation-slides");
      if (!presentationContainer) {
        throw new Error("Presentation container not found. Please ensure a presentation is open.");
      }

      // Try to find slides with different selectors
      let slideElements = presentationContainer.querySelectorAll("[class*='slide-container-']");
      
      // Fallback: try to find slide wrappers and get their inner slide content
      if (!slideElements || slideElements.length === 0) {
        slideElements = presentationContainer.querySelectorAll("[class*='slide-wrapper-']");
      }

      // Final fallback: look for plate editor containers
      if (!slideElements || slideElements.length === 0) {
        slideElements = presentationContainer.querySelectorAll("[data-plate-editor]");
      }

      if (!slideElements || slideElements.length === 0) {
        throw new Error(
          "No slides found. Please ensure the presentation has slides and is visible.",
        );
      }

      const pdfDoc = await PDFDocument.create();
      const SLIDE_WIDTH = 960;
      const SLIDE_HEIGHT = 540;

      for (let i = 0; i < slideElements.length; i++) {
        const slideEl = slideElements[i] as HTMLElement;

        // Temporarily ensure the element is visible
        const originalDisplay = slideEl.style.display;
        const originalVisibility = slideEl.style.visibility;
        slideEl.style.display = "block";
        slideEl.style.visibility = "visible";

        try {
          const canvas = await html2canvas(slideEl, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff",
            logging: false,
            width: slideEl.scrollWidth || slideEl.offsetWidth,
            height: slideEl.scrollHeight || slideEl.offsetHeight,
            onclone: (clonedDoc) => {
              // Fix images in the cloned document that might have CORS issues
              const images = clonedDoc.querySelectorAll("img");
              images.forEach((img) => {
                img.crossOrigin = "anonymous";
              });
            },
          });

          const imgData = canvas.toDataURL("image/png");
          const base64Data = imgData.split(",")[1];
          if (!base64Data) {
            console.warn(`Slide ${i + 1}: Failed to get image data, skipping`);
            continue;
          }
          
          const imgBytes = Uint8Array.from(atob(base64Data), (c) =>
            c.charCodeAt(0),
          );

          const pngImage = await pdfDoc.embedPng(imgBytes);
          const page = pdfDoc.addPage([SLIDE_WIDTH, SLIDE_HEIGHT]);

          // Scale image to fit the page while maintaining aspect ratio
          const imgAspect = pngImage.width / pngImage.height;
          const pageAspect = SLIDE_WIDTH / SLIDE_HEIGHT;

          let drawWidth = SLIDE_WIDTH;
          let drawHeight = SLIDE_HEIGHT;

          if (imgAspect > pageAspect) {
            drawHeight = SLIDE_WIDTH / imgAspect;
          } else {
            drawWidth = SLIDE_HEIGHT * imgAspect;
          }

          page.drawImage(pngImage, {
            x: (SLIDE_WIDTH - drawWidth) / 2,
            y: (SLIDE_HEIGHT - drawHeight) / 2,
            width: drawWidth,
            height: drawHeight,
          });
        } finally {
          // Restore original display state
          slideEl.style.display = originalDisplay;
          slideEl.style.visibility = originalVisibility;
        }
      }

      if (pdfDoc.getPageCount() === 0) {
        throw new Error("No slides could be captured. Please try again.");
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName}.pdf`;
      document.body.appendChild(link);
      link.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: "Presentation exported as PDF.",
      });
    } catch (error) {
      toast({
        title: "PDF Export Failed",
        description:
          error instanceof Error
            ? error.message
            : "There was an error exporting to PDF.",
        variant: "destructive",
      });
      console.error("PDF export error:", error);
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  };

  return (
    <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
        >
          <Download className="mr-1 h-4 w-4" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Presentation</DialogTitle>
          <DialogDescription>
            Choose a format to export your presentation.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-4">
          <Button
            variant="outline"
            className="flex h-24 flex-col items-center justify-center gap-2"
            onClick={handleExportPPTX}
            disabled={isExporting}
          >
            {isExporting && exportFormat === "pptx" ? (
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <Presentation className="h-8 w-8 text-orange-500" />
            )}
            <span className="text-sm font-medium">
              {isExporting && exportFormat === "pptx"
                ? "Exporting..."
                : "PowerPoint (.pptx)"}
            </span>
          </Button>
          <Button
            variant="outline"
            className="flex h-24 flex-col items-center justify-center gap-2"
            onClick={handleExportPDF}
            disabled={isExporting}
          >
            {isExporting && exportFormat === "pdf" ? (
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <FileText className="h-8 w-8 text-red-500" />
            )}
            <span className="text-sm font-medium">
              {isExporting && exportFormat === "pdf"
                ? "Exporting..."
                : "PDF (.pdf)"}
            </span>
          </Button>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsExportDialogOpen(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
