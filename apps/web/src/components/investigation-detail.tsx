"use client";

import type { EntityType } from "@argus/types";
import { ArrowLeftIcon, NetworkIcon, PlusIcon, TrashIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { EntityCard } from "@/components/entity-card";
import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useEntities } from "@/hooks/api/use-entities";
import {
    useAddEntityToInvestigation,
    useInvestigation,
    useRemoveEntityFromInvestigation,
} from "@/hooks/api/use-investigations";

export function InvestigationDetail({ id }: { id: string }) {
    const router = useRouter();
    const { data: investigation, isLoading } = useInvestigation(id);
    const { data: allEntities } = useEntities();
    const addEntity = useAddEntityToInvestigation();
    const removeEntity = useRemoveEntityFromInvestigation();

    const [addOpen, setAddOpen] = useState(false);

    // Get entity details for investigation entities
    const investigationEntityIds = new Set(
        (investigation as { entities?: { entityId: string }[] })?.entities?.map(
            (e: { entityId: string }) => e.entityId,
        ) ?? [],
    );
    const investigationEntities =
        allEntities?.filter((e) => investigationEntityIds.has(e.id)) ?? [];

    function handleAddEntity(entity: {
        id: string;
        name: string;
        type: EntityType;
    }) {
        addEntity.mutate(
            { investigationId: id, entityId: entity.id },
            { onSuccess: () => setAddOpen(false) },
        );
    }

    function handleRemoveEntity(entityId: string) {
        removeEntity.mutate({ investigationId: id, entityId });
    }

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!investigation) {
        return (
            <p className="text-muted-foreground">Investigation not found.</p>
        );
    }

    const firstEntityId = investigationEntities[0]?.id;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-primary"
                    onClick={() => router.push("/investigations")}
                >
                    <ArrowLeftIcon />
                </Button>
                <div>
                    <h1 className="font-display text-2xl uppercase tracking-wider">
                        {investigation.name}
                    </h1>
                    {investigation.description && (
                        <p className="text-muted-foreground">
                            {investigation.description}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Button onClick={() => setAddOpen(true)}>
                    <PlusIcon data-icon="inline-start" />
                    Add Entity
                </Button>
                {firstEntityId && (
                    <Button
                        variant="outline"
                        className="border-primary/40 text-neon-cyan hover:bg-primary/10 hover:border-primary/70"
                        render={
                            <Link href={`/graph?entityId=${firstEntityId}`} />
                        }
                    >
                        <NetworkIcon data-icon="inline-start" />
                        View in Graph
                    </Button>
                )}
            </div>

            {investigationEntities.length === 0 ? (
                <EmptyState
                    icon={NetworkIcon}
                    title="No entities"
                    description="Add entities to this investigation using the search above."
                    action={{
                        label: "Add Entity",
                        onClick: () => setAddOpen(true),
                    }}
                />
            ) : (
                <div className="space-y-3">
                    {investigationEntities.map((entity) => (
                        <div key={entity.id} className="flex items-start gap-2">
                            <div className="flex-1">
                                <EntityCard
                                    entity={
                                        entity as Parameters<
                                            typeof EntityCard
                                        >[0]["entity"]
                                    }
                                    onClick={() =>
                                        router.push(`/entities/${entity.id}`)
                                    }
                                />
                            </div>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                className="mt-4 hover:text-neon-red"
                                onClick={() => handleRemoveEntity(entity.id)}
                            >
                                <TrashIcon />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add entity dialog */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent className="bg-card border border-primary/20">
                    <DialogHeader>
                        <DialogTitle>Add Entity</DialogTitle>
                    </DialogHeader>
                    <SearchBar onSelect={handleAddEntity} />
                    <DialogFooter>
                        <DialogClose render={<Button variant="outline" />}>
                            Cancel
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
