"use client";

import type { EntityType } from "@argus/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/api";

export const entityKeys = {
    all: ["entities"] as const,
    list: (type?: EntityType) =>
        type
            ? (["entities", "list", type] as const)
            : (["entities", "list"] as const),
    detail: (id: string) => ["entities", "detail", id] as const,
    edges: (id: string) => ["entities", "edges", id] as const,
    dataPoints: (id: string) => ["entities", "data-points", id] as const,
};

export function useEntities(type?: EntityType) {
    return useQuery({
        queryKey: entityKeys.list(type),
        queryFn: async () => {
            const res = await client.api.entities.$get({
                query: type ? { type } : {},
            });
            if (!res.ok) throw new Error("Failed to fetch entities");
            return res.json();
        },
    });
}

export function useEntity(id: string | null) {
    return useQuery({
        queryKey: entityKeys.detail(id!),
        queryFn: async () => {
            const res = await client.api.entities[":id"].$get({
                param: { id: id! },
            });
            if (!res.ok) throw new Error("Failed to fetch entity");
            return res.json();
        },
        enabled: !!id,
    });
}

export function useEntityEdges(id: string | null) {
    return useQuery({
        queryKey: entityKeys.edges(id!),
        queryFn: async () => {
            const res = await client.api.entities[":id"].edges.$get({
                param: { id: id! },
            });
            if (!res.ok) throw new Error("Failed to fetch edges");
            return res.json();
        },
        enabled: !!id,
    });
}

export function useEntityDataPoints(id: string | null) {
    return useQuery({
        queryKey: entityKeys.dataPoints(id!),
        queryFn: async () => {
            const res = await client.api.entities[":id"]["data-points"].$get({
                param: { id: id! },
            });
            if (!res.ok) throw new Error("Failed to fetch data points");
            return res.json();
        },
        enabled: !!id,
    });
}

export function useCreateEntity() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: {
            type: EntityType;
            name: string;
            metadata?: Record<string, unknown>;
        }) => {
            const res = await client.api.entities.$post({ json: data });
            if (!res.ok) throw new Error("Failed to create entity");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: entityKeys.all });
        },
    });
}

export function useUpdateEntity() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            id,
            ...data
        }: {
            id: string;
            name?: string;
            metadata?: Record<string, unknown>;
        }) => {
            const res = await client.api.entities[":id"].$patch({
                param: { id },
                json: data,
            });
            if (!res.ok) throw new Error("Failed to update entity");
            return res.json();
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: entityKeys.detail(variables.id),
            });
            queryClient.invalidateQueries({ queryKey: entityKeys.all });
        },
    });
}

export function useDeleteEntity() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await client.api.entities[":id"].$delete({
                param: { id },
            });
            if (!res.ok) throw new Error("Failed to delete entity");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: entityKeys.all });
        },
    });
}
