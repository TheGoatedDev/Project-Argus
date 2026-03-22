"use client";

import type { EntityType } from "@argus/types";
import { Command as CommandPrimitive } from "cmdk";
import { SearchIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { EntityTypeBadge } from "@/components/entity-type-badge";
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

    const showDropdown = open && debouncedQuery.length > 0;

    return (
        <div ref={containerRef} className="relative w-full">
            <CommandPrimitive
                shouldFilter={false}
                onKeyDown={(e) => {
                    if (e.key === "Escape") setOpen(false);
                }}
            >
                <div className="relative">
                    <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-primary/50 pointer-events-none" />
                    <CommandPrimitive.Input
                        value={query}
                        onValueChange={(v) => {
                            setQuery(v);
                            setOpen(true);
                        }}
                        onFocus={() => query.length > 0 && setOpen(true)}
                        onBlur={(e) => {
                            if (
                                !containerRef.current?.contains(
                                    e.relatedTarget as Node,
                                )
                            ) {
                                setOpen(false);
                            }
                        }}
                        placeholder={placeholder}
                        aria-label={placeholder}
                        className="flex h-9 w-full rounded-[0.2rem] border border-primary/20 bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:glow-cyan focus:outline-none transition-all"
                    />
                </div>

                {showDropdown && (
                    <div className="absolute z-50 mt-1 w-full rounded-[0.2rem] border border-primary/20 bg-card glow-subtle shadow-lg">
                        <CommandPrimitive.List className="max-h-64 overflow-auto py-1">
                            {isLoading && (
                                <CommandPrimitive.Loading>
                                    <div className="p-3 text-sm text-primary/50 font-mono tracking-wider">
                                        _ SEARCHING...
                                    </div>
                                </CommandPrimitive.Loading>
                            )}
                            {!isLoading && (
                                <CommandPrimitive.Empty className="p-3 text-sm text-primary/50 font-mono tracking-wider">
                                    {"// NO RESULTS FOUND"}
                                </CommandPrimitive.Empty>
                            )}
                            {data?.results.map((entity) => (
                                <CommandPrimitive.Item
                                    key={entity.id}
                                    value={entity.id}
                                    onSelect={() =>
                                        handleSelect(
                                            entity as {
                                                id: string;
                                                name: string;
                                                type: EntityType;
                                            },
                                        )
                                    }
                                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-sm cursor-default border-l-2 border-transparent aria-selected:bg-primary/10 aria-selected:border-primary transition-all outline-none"
                                >
                                    <span className="truncate">
                                        {entity.name}
                                    </span>
                                    <EntityTypeBadge
                                        type={entity.type as EntityType}
                                    />
                                </CommandPrimitive.Item>
                            ))}
                        </CommandPrimitive.List>
                    </div>
                )}
            </CommandPrimitive>
        </div>
    );
}
