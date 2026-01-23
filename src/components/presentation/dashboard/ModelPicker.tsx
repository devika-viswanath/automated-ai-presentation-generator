"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { usePresentationState } from "@/states/presentation-state";
import { Bot } from "lucide-react";

export function ModelPicker({
  shouldShowLabel = true,
}: {
  shouldShowLabel?: boolean;
}) {
  const { setModelProvider, setModelId } = usePresentationState();

  const handleModelChange = () => {
    setModelProvider("gemini");
    setModelId("");
  };

  return (
    <div>
      {shouldShowLabel && (
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Text Model
        </label>
      )}
      <Select value="gemini" onValueChange={handleModelChange}>
        <SelectTrigger className="overflow-hidden">
          <div className="flex items-center gap-2 min-w-0">
            <Bot className="h-4 w-4 flex-shrink-0" />
            <span className="truncate text-sm">Gemini 2.0 Flash</span>
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="gemini">
            <div className="flex items-center gap-3">
              <Bot className="h-4 w-4 flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="truncate text-sm">Gemini 2.0 Flash</span>
                <span className="text-xs text-muted-foreground truncate">
                  Google AI model (default)
                </span>
              </div>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
