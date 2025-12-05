import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CVEInputProps {
  onAddCVE: (cveId: string) => void;
  onAddMultiple: (cveIds: string[]) => void;
  isLoading?: boolean;
}

// Common CVE patterns for suggestions
const CVE_SUGGESTIONS = [
  "CVE-2024-",
  "CVE-2023-",
  "CVE-2022-",
];

export function CVEInput({ onAddCVE, onAddMultiple, isLoading }: CVEInputProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim().toUpperCase();
    
    if (!trimmed) return;
    
    // Validate CVE format
    const cvePattern = /^CVE-\d{4}-\d{4,}$/;
    if (!cvePattern.test(trimmed)) {
      toast({
        title: "Invalid CVE Format",
        description: "Please enter a valid CVE ID (e.g., CVE-2024-12345)",
        variant: "destructive",
      });
      return;
    }
    
    onAddCVE(trimmed);
    setInput("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const cvePattern = /CVE-\d{4}-\d{4,}/gi;
      const matches = text.match(cvePattern);
      
      if (!matches || matches.length === 0) {
        toast({
          title: "No CVEs Found",
          description: "The file doesn't contain any valid CVE IDs",
          variant: "destructive",
        });
        return;
      }

      const uniqueCVEs = [...new Set(matches.map(m => m.toUpperCase()))];
      onAddMultiple(uniqueCVEs);
      
      toast({
        title: "CVEs Imported",
        description: `Found ${uniqueCVEs.length} unique CVE(s) in the file`,
      });
    } catch (error) {
      toast({
        title: "Error Reading File",
        description: "Could not read the uploaded file",
        variant: "destructive",
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Enter CVE ID (e.g., CVE-2024-12345)"
            className="font-mono"
            disabled={isLoading}
          />
          
          {/* Autocomplete suggestions */}
          {showSuggestions && input.length < 10 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-10">
              {CVE_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-3 py-2 text-left text-sm font-mono hover:bg-muted transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <Button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          <span className="ml-2 hidden sm:inline">Add</span>
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
        >
          <Upload className="w-4 h-4" />
          <span className="ml-2 hidden sm:inline">Import</span>
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.csv,.json"
          onChange={handleFileUpload}
          className="hidden"
        />
      </form>
      
      <p className="text-xs text-muted-foreground">
        Import from TXT, CSV, or JSON files containing CVE IDs
      </p>
    </div>
  );
}
