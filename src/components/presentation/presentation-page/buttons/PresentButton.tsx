"use client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";
import { Play, X } from "lucide-react";

export function PresentButton() {
  //Tracks whether the presentation is currently in "Present" mode.
  const isPresenting = usePresentationState((s) => s.isPresenting);
  //fun toggle presentation mode on and off
  const setIsPresenting = usePresentationState((s) => s.setIsPresenting);
  //preseentation is running or not
  const isGeneratingPresentation = usePresentationState(
    (s) => s.isGeneratingPresentation,
  );
  //track outline gen process is running or not
  const isGeneratingOutline = usePresentationState(
    (s) => s.isGeneratingOutline,
  );

  // Check if generation is in progress ,combine both presentation and outline generation states
  //  to determine if any generation process is active. This is used to disable the Present button and show a loading state while generation is happening.
  const isGenerating = isGeneratingPresentation || isGeneratingOutline;

  return (
    <Button
      size="sm"
      className={cn(
        isPresenting
          ? "bg-red-600 text-white hover:bg-red-700"
          : "bg-purple-600 text-white hover:bg-purple-700",
        isGenerating && "cursor-not-allowed opacity-70",
      )}
      onClick={() => !isGenerating && setIsPresenting(!isPresenting)}
      disabled={isGenerating}
    >
      {isPresenting ? (
        <>
          <X className="mr-1 h-4 w-4" />
          Exit
        </>
      ) : (
        <>
          <Play className="mr-1 h-4 w-4" />
          Present
        </>
      )}
    </Button>
  );
}
