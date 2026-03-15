import type { EntityType } from "@argus/types";
import { Badge } from "@/components/ui/badge";
import { ENTITY_TYPE_LABELS, NODE_COLORS } from "@/lib/entity-colors";

export function EntityTypeBadge({ type }: { type: EntityType }) {
    const color = NODE_COLORS[type];
    return (
        <Badge
            variant="outline"
            style={{
                borderColor: color,
                color: color,
                backgroundColor: "transparent",
                boxShadow: `0 0 8px ${color}40`,
            }}
        >
            {ENTITY_TYPE_LABELS[type]}
        </Badge>
    );
}
