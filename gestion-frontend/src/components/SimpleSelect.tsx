// src/components/SimpleSelect.tsx
import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SimpleSelectProps {
  options: Array<{ id: string; code: string; title: string }>;
  selectedValues: string[];
  onSelect: (value: string) => void;
  onRemove: (value: string) => void;
  placeholder?: string;
}

export const SimpleSelect = ({
  options,
  selectedValues,
  onSelect,
  onRemove,
  placeholder = "Sélectionner des options",
}: SimpleSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOptions = options.filter(
    (option) =>
      option.code.toLowerCase().includes(search.toLowerCase()) ||
      option.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedValues.length > 0
              ? `${selectedValues.length} sélectionnés`
              : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <div className="p-2 border-b">
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Aucune option disponible
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.id}
                  className={cn(
                    "p-2 cursor-pointer hover:bg-accent flex items-center",
                    selectedValues.includes(option.id) && "bg-accent"
                  )}
                  onClick={() => {
                    if (selectedValues.includes(option.id)) {
                      onRemove(option.id);
                    } else {
                      onSelect(option.id);
                    }
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedValues.includes(option.id)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {option.code} - {option.title}
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedValues.map((value) => {
            const option = options.find((o) => o.id === value);
            return option ? (
              <Badge
                key={value}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {option.code}
                <button
                  onClick={() => onRemove(value)}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
};
