"use client";

import type { EntityType } from "@argus/types";
import { SearchIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { EntityTypeBadge } from "@/components/entity-type-badge";
import { Input } from "@/components/ui/input";
import { useSearch } from "@/hooks/api/use-search";

interface SearchBarProps {
    onSelect: (entity: { id: string; name: string; type: EntityType }) => void;
    typeFilter?: EntityType;
    placeholder?: string;
}

export function SearchBar({
    onSelect,
    typeFilter,
    placeholder = "Search entities...",
}: SearchBarProps) {
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 300);
        return () => clearTimeout(timer);
    }, [query]);

    const { data, isLoading } = useSearch(debouncedQuery, typeFilter);

    const handleSelect = useCallback(
        (entity: { id: string; name: string; type: EntityType }) => {
            onSelect(entity);
            setQuery("");
            setDebouncedQuery("");
            setOpen(false);
        },
        [onSelect],
    );

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className="relative w-full">
            <div className="relative">
                <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-primary/50" />
                <Input
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => query.length > 0 && setOpen(true)}
                    placeholder={placeholder}
                    className="pl-9 bg-card border-primary/20 focus:border-primary/40 focus:glow-cyan transition-all"
                />
            </div>
            {open && debouncedQuery.length > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-[0.2rem] border border-primary/20 bg-card glow-subtle shadow-lg">
                    {isLoading ? (
                        <div className="p-3 text-sm text-primary/50 font-mono tracking-wider">
                            _ SEARCHING...
                        </div>
                    ) : data?.results.length === 0 ? (
                        <div className="p-3 text-sm text-primary/50 font-mono tracking-wider">
                            {"// NO RESULTS FOUND"}
                        </div>
                    ) : (
                        <ul className="max-h-64 overflow-auto py-1">
                            {data?.results.map((entity) => (
                                <li key={entity.id}>
                                    <button
                                        type="button"
                                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-primary/10 border-l-2 border-transparent hover:border-primary transition-all"
                                        onClick={() =>
                                            handleSelect(
                                                entity as {
                                                    id: string;
                                                    name: string;
                                                    type: EntityType;
                                                },
                                            )
                                        }
                                    >
                                        <span className="truncate">
                                            {entity.name}
                                        </span>
                                        <EntityTypeBadge
                                            type={entity.type as EntityType}
                                        />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
