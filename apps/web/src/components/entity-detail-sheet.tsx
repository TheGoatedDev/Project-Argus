"use client";

import type { EntityType } from "@argus/types";
import Link from "next/link";
import { EntityTypeBadge } from "@/components/entity-type-badge";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useEntity, useEntityEdges } from "@/hooks/api/use-entities";

interface EntityDetailSheetProps {
    entityId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EntityDetailSheet({
    entityId,
    open,
    onOpenChange,
}: EntityDetailSheetProps) {
    const { data: entity, isLoading } = useEntity(entityId);
    const { data: edges } = useEntityEdges(entityId);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="overflow-y-auto bg-card">
                {isLoading ? (
                    <div className="space-y-4 p-4">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                ) : entity && !("error" in entity) ? (
                    <>
                        <SheetHeader>
                            <div className="flex items-center gap-2">
                                <SheetTitle className="font-display uppercase tracking-wide">
                                    {entity.name}
                                </SheetTitle>
                                <EntityTypeBadge
                                    type={entity.type as EntityType}
                                />
                            </div>
                        </SheetHeader>

                        <div className="space-y-6 p-4 pt-0">
                            {/* Metadata */}
                            {entity.metadata &&
                                Object.keys(
                                    entity.metadata as Record<string, unknown>,
                                ).length > 0 && (
                                    <section>
                                        <h3 className="mb-2 text-xs font-display uppercase tracking-wider text-primary">
                                            Metadata
                                        </h3>
                                        <div className="space-y-1 text-sm font-mono">
                                            {Object.entries(
                                                entity.metadata as Record<
                                                    string,
                                                    unknown
                                                >,
                                            ).map(([key, value]) => (
                                                <div
                                                    key={key}
                                                    className="flex justify-between"
                                                >
                                                    <span className="text-muted-foreground">
                                                        {key}
                                                    </span>
                                                    <span>{String(value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                            {/* Edges */}
                            {edges && edges.length > 0 && (
                                <section>
                                    <h3 className="mb-2 text-xs font-display uppercase tracking-wider text-primary">
                                        Connections ({edges.length})
                                    </h3>
                                    <Table className="border border-primary/15">
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-primary/70 uppercase tracking-wider text-xs">
                                                    Type
                                                </TableHead>
                                                <TableHead className="text-primary/70 uppercase tracking-wider text-xs">
                                                    Entity
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {edges.map((edge) => {
                                                const connectedId =
                                                    edge.sourceId === entityId
                                                        ? edge.targetId
                                                        : edge.sourceId;
                                                return (
                                                    <TableRow key={edge.id}>
                                                        <TableCell>
                                                            {edge.edgeType}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Link
                                                                href={`/entities/${connectedId}`}
                                                                className="text-primary hover:underline"
                                                            >
                                                                {connectedId}
                                                            </Link>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </section>
                            )}

                            <Button
                                variant="outline"
                                className="w-full border-primary/30 hover:glow-subtle"
                                render={<Link href={`/entities/${entityId}`} />}
                            >
                                Open full page
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="p-4 text-muted-foreground">
                        Entity not found.
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
