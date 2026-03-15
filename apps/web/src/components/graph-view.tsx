"use client";

import type { EntityType } from "@argus/types";
import {
    Background,
    BackgroundVariant,
    Controls,
    type Edge,
    MiniMap,
    type Node,
    ReactFlow,
    useEdgesState,
    useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import { useCallback, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useGraphTraversal } from "@/hooks/api/use-graph";
import { NODE_COLORS } from "@/lib/entity-colors";
import { useUIStore } from "@/stores/ui";

interface GraphViewProps {
    entityId: string | null;
    depth?: number;
    edgeTypes?: string;
    minConfidence?: number;
}

function layoutGraph(
    apiNodes: { id: string; name: string; type: string }[],
    apiEdges: {
        id: string;
        source_id: string;
        target_id: string;
        edge_type: string;
    }[],
): { nodes: Node[]; edges: Edge[] } {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: "TB", nodesep: 80, ranksep: 100 });

    for (const node of apiNodes) {
        g.setNode(node.id, { width: 180, height: 50 });
    }
    for (const edge of apiEdges) {
        g.setEdge(edge.source_id, edge.target_id);
    }

    dagre.layout(g);

    const nodes: Node[] = apiNodes.map((node) => {
        const pos = g.node(node.id);
        const color = NODE_COLORS[node.type as EntityType] ?? "#6b7280";
        return {
            id: node.id,
            position: { x: pos.x - 90, y: pos.y - 25 },
            data: { label: node.name, entityType: node.type },
            style: {
                background: `${color}20`,
                color: color,
                borderRadius: 2,
                padding: "6px 14px",
                border: `1px solid ${color}`,
                fontSize: 12,
                fontWeight: 600,
                boxShadow: `0 0 12px ${color}40`,
            },
        };
    });

    const edges: Edge[] = apiEdges.map((edge) => ({
        id: edge.id,
        source: edge.source_id,
        target: edge.target_id,
        label: edge.edge_type,
        animated: true,
        style: { stroke: "#00d4ff", strokeOpacity: 0.4 },
        labelStyle: { fontSize: 11, fill: "#00d4ff", opacity: 0.7 },
        labelBgStyle: {
            fill: "transparent",
            stroke: "#00d4ff",
            strokeOpacity: 0.3,
        },
        labelBgPadding: [6, 4] as [number, number],
        labelBgBorderRadius: 2,
    }));

    return { nodes, edges };
}

export function GraphView({
    entityId,
    depth,
    edgeTypes,
    minConfidence,
}: GraphViewProps) {
    const selectEntity = useUIStore((s) => s.selectEntity);
    const { data, isLoading } = useGraphTraversal(entityId, {
        depth,
        edgeTypes,
        minConfidence,
    });

    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

    useEffect(() => {
        if (!data) return;
        const result = layoutGraph(
            data.nodes as { id: string; name: string; type: string }[],
            data.edges as {
                id: string;
                source_id: string;
                target_id: string;
                edge_type: string;
            }[],
        );
        setNodes(result.nodes);
        setEdges(result.edges);
    }, [data, setNodes, setEdges]);

    const onNodeClick = useCallback(
        (_event: React.MouseEvent, node: Node) => {
            selectEntity(node.id);
        },
        [selectEntity],
    );

    if (!entityId) {
        return (
            <div className="flex h-full items-center justify-center font-display uppercase tracking-wide text-primary/40">
                Select an entity to visualize its graph.
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Skeleton className="h-64 w-64 rounded-lg" />
            </div>
        );
    }

    if (data && data.nodes.length === 0) {
        return (
            <div className="flex h-full items-center justify-center font-display uppercase tracking-wide text-primary/40">
                No connections found for this entity.
            </div>
        );
    }

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            fitView
        >
            <Background
                variant={BackgroundVariant.Dots}
                color="#00d4ff10"
                gap={28}
            />
            <Controls />
            <MiniMap
                className="border border-primary/15 bg-card/50"
                nodeColor={(node) =>
                    NODE_COLORS[node.data?.entityType as EntityType] ??
                    "#6b7280"
                }
            />
        </ReactFlow>
    );
}
