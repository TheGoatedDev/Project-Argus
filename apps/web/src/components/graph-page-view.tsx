"use client";

import { EdgeType } from "@argus/types";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { EntityDetailSheet } from "@/components/entity-detail-sheet";
import { GraphView } from "@/components/graph-view";
import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui";

const EDGE_TYPES = Object.values(EdgeType);

export function GraphPageView() {
    const searchParams = useSearchParams();
    const initialEntityId = searchParams.get("entityId");

    const [entityId, setEntityId] = useState<string | null>(initialEntityId);
    const [depth, setDepth] = useState(2);
    const [selectedEdgeTypes, setSelectedEdgeTypes] = useState<Set<string>>(
        new Set(EDGE_TYPES),
    );
    const [minConfidence, setMinConfidence] = useState(0);

    const selectedEntityId = useUIStore((s) => s.selectedEntityId);
    const selectEntity = useUIStore((s) => s.selectEntity);

    function toggleEdgeType(type: string) {
        setSelectedEdgeTypes((prev) => {
            const next = new Set(prev);
            if (next.has(type)) next.delete(type);
            else next.add(type);
            return next;
        });
    }

    const edgeTypesParam =
        selectedEdgeTypes.size === EDGE_TYPES.length
            ? undefined
            : Array.from(selectedEdgeTypes).join(",");

    return (
        <main className="flex h-screen flex-col">
            <header className="flex items-center gap-4 border-b border-primary/20 bg-background/80 p-4 backdrop-blur-md">
                <h1 className="font-display text-xl font-semibold uppercase tracking-wider text-neon-cyan text-glow-cyan">
                    Entity Graph
                </h1>
                {!entityId && (
                    <div className="max-w-sm flex-1">
                        <SearchBar
                            onSelect={(entity) => setEntityId(entity.id)}
                            placeholder="Search for an entity to graph..."
                        />
                    </div>
                )}
                {entityId && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-primary/30"
                        onClick={() => setEntityId(null)}
                    >
                        Clear
                    </Button>
                )}
            </header>

            <div className="flex flex-1 overflow-hidden">
                {entityId && (
                    <div className="w-56 shrink-0 space-y-6 overflow-y-auto border-r border-primary/15 bg-card/50 p-4 backdrop-blur-sm">
                        <label className="block">
                            <span className="mb-1 block font-display text-xs font-medium uppercase tracking-wider text-primary/70">
                                Depth ({depth})
                            </span>
                            <input
                                type="range"
                                min={1}
                                max={5}
                                value={depth}
                                onChange={(e) =>
                                    setDepth(Number(e.target.value))
                                }
                                className="w-full"
                                style={{ accentColor: "var(--neon-cyan)" }}
                            />
                        </label>

                        <label className="block">
                            <span className="mb-1 block font-display text-xs font-medium uppercase tracking-wider text-primary/70">
                                Min Confidence (
                                {Math.round(minConfidence * 100)}%)
                            </span>
                            <input
                                type="range"
                                min={0}
                                max={100}
                                value={minConfidence * 100}
                                onChange={(e) =>
                                    setMinConfidence(
                                        Number(e.target.value) / 100,
                                    )
                                }
                                className="w-full"
                                style={{ accentColor: "var(--neon-cyan)" }}
                            />
                        </label>

                        <div>
                            <span className="mb-2 block font-display text-xs font-medium uppercase tracking-wider text-primary/70">
                                Edge Types
                            </span>
                            <div className="space-y-1">
                                {EDGE_TYPES.map((type) => (
                                    <label
                                        key={type}
                                        className="flex items-center gap-2 text-sm text-foreground/80"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedEdgeTypes.has(
                                                type,
                                            )}
                                            onChange={() =>
                                                toggleEdgeType(type)
                                            }
                                            style={{
                                                accentColor: "var(--neon-cyan)",
                                            }}
                                        />
                                        {type}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex-1">
                    <GraphView
                        entityId={entityId}
                        depth={depth}
                        edgeTypes={edgeTypesParam}
                        minConfidence={
                            minConfidence > 0 ? minConfidence : undefined
                        }
                    />
                </div>
            </div>

            <EntityDetailSheet
                entityId={selectedEntityId}
                open={selectedEntityId !== null}
                onOpenChange={(open) => {
                    if (!open) selectEntity(null);
                }}
            />
        </main>
    );
}
