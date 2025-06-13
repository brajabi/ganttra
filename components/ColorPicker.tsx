"use client";

import { useState, useRef, useEffect } from "react";
import { TASK_COLORS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown } from "lucide-react";

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  className?: string;
}

export function ColorPicker({
  selectedColor,
  onColorChange,
  className,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-8 px-2 border-2"
      >
        <div
          className="w-4 h-4 rounded border"
          style={{ backgroundColor: selectedColor }}
        />
        <ChevronDown className="w-3 h-3" />
      </Button>

      {isOpen && (
        <div
          className="absolute top-full left-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3"
          style={{ direction: "rtl" }}
        >
          <div className="grid grid-cols-4 gap-2 w-48">
            {TASK_COLORS.map((color) => (
              <button
                key={color}
                className="w-10 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors relative"
                style={{ backgroundColor: color }}
                onClick={() => {
                  onColorChange(color);
                  setIsOpen(false);
                }}
              >
                {selectedColor === color && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white drop-shadow-md" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
