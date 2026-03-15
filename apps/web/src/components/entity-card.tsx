"use client";

import type { EntityType } from "@argus/types";
import { EntityTypeBadge } from "@/components/entity-type-badge";
import { NODE_COLORS } from "@/lib/entity-colors";

interface EntityCardProps {
    entity: {
        id: string;
        name: string;
        type: EntityType;
        metadata: Record<string, unknown> | null;
        createdAt: string;
    };
    onClick?: () => void;
}

export function EntityCard({ entity, onClick }: EntityCardProps) {
    const metadataEntries = entity.metadata
        ? Object.entries(entity.metadata).slice(0, 3)
        : [];

    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full bg-card border border-primary/15 hover:border-primary/40 hover:glow-subtle p-4 text-left transition-all"
            style={{ borderLeft: `2px solid ${NODE_COLORS[entity.type]}` }}
        >
            <div className="flex items-center justify-between gap-2">
                <span className="truncate font-medium text-foreground">
                    {entity.name}
                </span>
                <EntityTypeBadge type={entity.type} />
            </div>
            {metadataEntries.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground font-mono">
                    {metadataEntries.map(([key, value]) => (
                        <span key={key}>
                            {key}: {String(value)}
                        </span>
                    ))}
                </div>
            )}
            <div className="mt-2 text-xs text-muted-foreground/70">
                {new Date(entity.createdAt).toLocaleDateString()}
            </div>
        </button>
    );
}
