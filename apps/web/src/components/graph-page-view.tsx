"use client";

import { EdgeType } from "@argus/types";
import { ChevronDownIcon, ChevronRightIcon, Pause, Play } from "lucide-react";
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
    const [repulsion, setRepulsion] = useState(-300);
    const [linkDistance, setLinkDistance] = useState(120);
    const [paused, setPaused] = useState(false);
    const [physicsOpen, setPhysicsOpen] = useState(false);
    const [edgeTypesOpen, setEdgeTypesOpen] = useState(false);

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
                                type="number"
                                min={1}
                                value={depth}
                                onChange={(e) =>
                                    setDepth(
                                        Math.max(
                                            1,
                                            Number(e.target.value) || 1,
                                        ),
                                    )
                                }
                                className="w-full rounded-[0.2rem] border border-primary/20 bg-card px-2 py-1 font-mono text-sm text-foreground focus:border-primary/40 focus:outline-none"
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
                            <button
                                type="button"
                                className="mb-2 flex w-full items-center gap-1 font-display text-xs font-medium uppercase tracking-wider text-primary/70 hover:text-primary transition-colors"
                                onClick={() => setEdgeTypesOpen((o) => !o)}
                                aria-expanded={edgeTypesOpen}
                            >
                                {edgeTypesOpen ? (
                                    <ChevronDownIcon className="size-3" />
                                ) : (
                                    <ChevronRightIcon className="size-3" />
                                )}
                                Edge Types
                                {!edgeTypesOpen &&
                                    selectedEdgeTypes.size <
                                        EDGE_TYPES.length && (
                                        <span className="ml-auto font-mono text-primary/50 normal-case tracking-normal">
                                            {selectedEdgeTypes.size}/
                                            {EDGE_TYPES.length}
                                        </span>
                                    )}
                            </button>
                            {edgeTypesOpen && (
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
                                                    accentColor:
                                                        "var(--neon-cyan)",
                                                }}
                                            />
                                            {type}
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="border-t border-primary/10 pt-4">
                            <button
                                type="button"
                                className="mb-2 flex w-full items-center gap-1 font-display text-xs font-medium uppercase tracking-wider text-primary/70 hover:text-primary transition-colors"
                                onClick={() => setPhysicsOpen((o) => !o)}
                                aria-expanded={physicsOpen}
                            >
                                {physicsOpen ? (
                                    <ChevronDownIcon className="size-3" />
                                ) : (
                                    <ChevronRightIcon className="size-3" />
                                )}
                                Physics
                            </button>

                            {physicsOpen && (
                                <>
                                    <label className="mb-3 block">
                                        <span className="mb-1 block text-xs text-foreground/60">
                                            Repulsion ({repulsion})
                                        </span>
                                        <input
                                            type="range"
                                            min={-600}
                                            max={-50}
                                            value={repulsion}
                                            onChange={(e) =>
                                                setRepulsion(
                                                    Number(e.target.value),
                                                )
                                            }
                                            className="w-full"
                                            style={{
                                                accentColor: "var(--neon-cyan)",
                                            }}
                                        />
                                    </label>

                                    <label className="mb-3 block">
                                        <span className="mb-1 block text-xs text-foreground/60">
                                            Link Distance ({linkDistance})
                                        </span>
                                        <input
                                            type="range"
                                            min={50}
                                            max={300}
                                            value={linkDistance}
                                            onChange={(e) =>
                                                setLinkDistance(
                                                    Number(e.target.value),
                                                )
                                            }
                                            className="w-full"
                                            style={{
                                                accentColor: "var(--neon-cyan)",
                                            }}
                                        />
                                    </label>
                                </>
                            )}

                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full gap-2 border-primary/20 text-xs"
                                onClick={() => setPaused((p) => !p)}
                            >
                                {paused ? (
                                    <Play className="h-3 w-3" />
                                ) : (
                                    <Pause className="h-3 w-3" />
                                )}
                                {paused ? "Resume" : "Pause"} Simulation
                            </Button>
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
                        forceOptions={{ repulsion, linkDistance, paused }}
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
