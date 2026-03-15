"use client";

import { EntityType, type EntityType as EntityTypeType } from "@argus/types";
import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { EntityCard } from "@/components/entity-card";
import { ScrapePanel } from "@/components/scrape-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearch } from "@/hooks/api/use-search";

const ENTITY_TYPES = Object.values(EntityType) as EntityTypeType[];
const PAGE_SIZE = 20;

export function SearchView() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<EntityTypeType | undefined>();
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
            setOffset(0);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    const { data, isLoading } = useSearch(
        debouncedQuery,
        typeFilter,
        PAGE_SIZE,
        offset,
    );

    const handleEntityClick = useCallback(
        (id: string) => {
            router.push(`/entities/${id}`);
        },
        [router],
    );

    return (
        <div className="space-y-6">
            <div className="relative">
                <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-primary/50" />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search entities by name..."
                    className="pl-9 bg-card border-primary/20 focus:border-primary/40 focus:glow-cyan transition-all"
                />
            </div>

            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => setTypeFilter(undefined)}
                    className={`rounded-[0.2rem] px-3 py-1 text-xs font-medium uppercase tracking-wider transition-all ${
                        typeFilter === undefined
                            ? "bg-primary text-primary-foreground glow-subtle"
                            : "bg-card border border-primary/20 text-muted-foreground hover:border-primary/40"
                    }`}
                >
                    All
                </button>
                {ENTITY_TYPES.map((type) => (
                    <button
                        key={type}
                        type="button"
                        onClick={() =>
                            setTypeFilter(
                                typeFilter === type ? undefined : type,
                            )
                        }
                        className={`rounded-[0.2rem] px-3 py-1 text-xs font-medium uppercase tracking-wider transition-all ${
                            typeFilter === type
                                ? "bg-primary text-primary-foreground glow-subtle"
                                : "bg-card border border-primary/20 text-muted-foreground hover:border-primary/40"
                        }`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    <Skeleton className="h-20 w-full bg-muted border border-primary/10 animate-pulse" />
                    <Skeleton className="h-20 w-full bg-muted border border-primary/10 animate-pulse" />
                    <Skeleton className="h-20 w-full bg-muted border border-primary/10 animate-pulse" />
                    <Skeleton className="h-20 w-full bg-muted border border-primary/10 animate-pulse" />
                    <Skeleton className="h-20 w-full bg-muted border border-primary/10 animate-pulse" />
                </div>
            ) : !debouncedQuery ? (
                <EmptyState
                    icon={SearchIcon}
                    title="Search for entities"
                    description="Type a query above to search across all entities."
                />
            ) : data?.results.length === 0 ? (
                <div className="space-y-6">
                    <EmptyState
                        icon={SearchIcon}
                        title="No results"
                        description={`No entities found matching "${debouncedQuery}".`}
                    />
                    <ScrapePanel defaultQuery={debouncedQuery} />
                </div>
            ) : (
                <>
                    <p className="text-sm font-mono text-primary/70 uppercase tracking-wider">
                        {data?.total} result{data?.total === 1 ? "" : "s"} found
                    </p>
                    <div className="space-y-3">
                        {data?.results.map((entity) => (
                            <EntityCard
                                key={entity.id}
                                entity={
                                    entity as Parameters<
                                        typeof EntityCard
                                    >[0]["entity"]
                                }
                                onClick={() => handleEntityClick(entity.id)}
                            />
                        ))}
                    </div>
                    {data && data.total > PAGE_SIZE && (
                        <div className="flex items-center justify-center gap-4">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={offset === 0}
                                onClick={() =>
                                    setOffset(Math.max(0, offset - PAGE_SIZE))
                                }
                                className="rounded-[0.2rem] border-primary/30 hover:glow-subtle transition-all"
                            >
                                Previous
                            </Button>
                            <span className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
                                Page {Math.floor(offset / PAGE_SIZE) + 1} of{" "}
                                {Math.ceil(data.total / PAGE_SIZE)}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={offset + PAGE_SIZE >= data.total}
                                onClick={() => setOffset(offset + PAGE_SIZE)}
                                className="rounded-[0.2rem] border-primary/30 hover:glow-subtle transition-all"
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
