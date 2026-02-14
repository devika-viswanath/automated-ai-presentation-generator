import * as React from "react";

import {
  type ClientUploadedFileData,
  type UploadFilesOptions,
} from "uploadthing/types";

import { type OurFileRouter } from "@/app/api/uploadthing/core";
import { uploadFiles } from "@/hooks/globals/useUploadthing";
import { toast } from "sonner";
import { z } from "zod";

export type UploadedFile<T = unknown> = ClientUploadedFileData<T>;

/**
 * Convert a File to a base64 data URL (persists without external storage)
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface UseUploadFileProps
  extends Pick<
    UploadFilesOptions<OurFileRouter["editorUploader"]>,
    "headers" | "onUploadBegin" | "onUploadProgress" | "skipPolling"
  > {
  onUploadComplete?: (file: UploadedFile) => void;
  onUploadError?: (error: unknown) => void;
}

export function useUploadFile({
  onUploadComplete,
  onUploadError,
  ...props
}: UseUploadFileProps = {}) {
  const [uploadedFile, setUploadedFile] = React.useState<UploadedFile>();
  const [uploadingFile, setUploadingFile] = React.useState<File>();
  const [progress, setProgress] = React.useState<number>(0);
  const [isUploading, setIsUploading] = React.useState(false);

  async function uploadThing(file: File) {
    setIsUploading(true);
    setUploadingFile(file);

    try {
      const res = await uploadFiles("editorUploader", {
        ...props,
        files: [file],
        onUploadProgress: ({ progress }) => {
          setProgress(Math.min(progress, 100));
        },
      });

      setUploadedFile(res[0]);

      onUploadComplete?.(res[0] ?? ({} as UploadedFile));

      return uploadedFile;
    } catch (error) {
      // Fallback: convert file to base64 data URL (works without UploadThing)
      console.log("UploadThing unavailable, using base64 fallback");
      
      try {
        const base64Url = await fileToBase64(file);
        
        const fallbackUploadedFile = {
          key: `local-${Date.now()}`,
          appUrl: base64Url,
          name: file.name,
          size: file.size,
          type: file.type,
          url: base64Url,
        } as UploadedFile;

        // Simulate upload progress
        let prog = 0;
        const simulateProgress = async () => {
          while (prog < 100) {
            await new Promise((resolve) => setTimeout(resolve, 30));
            prog += 10;
            setProgress(Math.min(prog, 100));
          }
        };
        await simulateProgress();

        setUploadedFile(fallbackUploadedFile);
        onUploadComplete?.(fallbackUploadedFile);
        toast.success("File uploaded (local storage)");

        return fallbackUploadedFile;
      } catch (fallbackError) {
        const errorMessage = getErrorMessage(error);
        const message = errorMessage.length > 0 ? errorMessage : "Something went wrong, please try again later.";
        toast.error(message);
        onUploadError?.(error);
        return undefined;
      }
    } finally {
      setProgress(0);
      setIsUploading(false);
      setUploadingFile(undefined);
    }
  }

  return {
    isUploading,
    progress,
    uploadedFile,
    uploadFile: uploadThing,
    uploadingFile,
  };
}

export function getErrorMessage(err: unknown) {
  const unknownError = "Something went wrong, please try again later.";

  if (err instanceof z.ZodError) {
    const errors = err.issues.map((issue) => {
      return issue.message;
    });

    return errors.join("\n");
  } else if (err instanceof Error) {
    return err.message;
  } else {
    return unknownError;
  }
}

export function showErrorToast(err: unknown) {
  const errorMessage = getErrorMessage(err);

  return toast.error(errorMessage);
}
