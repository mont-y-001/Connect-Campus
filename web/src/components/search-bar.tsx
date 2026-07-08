"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type SearchBarProps = {
  onSearch: (query: string) => void;
  onCollegeFilter: (college: string) => void;
  college?: string;
};

export function SearchBar({ onSearch, onCollegeFilter, college }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [collegeInput, setCollegeInput] = useState(college ?? "");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    onSearch(query.trim());
  }

  function handleCollegeFilter(e: React.FormEvent) {
    e.preventDefault();
    onCollegeFilter(collegeInput.trim());
  }

  return (
    <div className="space-y-2">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" size="sm">
          Search
        </Button>
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              setQuery("");
              onSearch("");
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </form>
      <form onSubmit={handleCollegeFilter} className="flex gap-2">
        <Input
          placeholder="Filter by college (e.g. IIT Delhi)"
          value={collegeInput}
          onChange={(e) => setCollegeInput(e.target.value)}
          className="text-sm"
        />
        <Button type="submit" variant="outline" size="sm">
          Filter
        </Button>
        {collegeInput && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setCollegeInput("");
              onCollegeFilter("");
            }}
          >
            Clear
          </Button>
        )}
      </form>
    </div>
  );
}
