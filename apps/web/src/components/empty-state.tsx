import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <Icon className="mb-4 size-12 text-primary/30" />
            <h3 className="mb-1 text-lg font-display uppercase tracking-wide text-foreground">
                {title}
            </h3>
            <p className="mb-4 max-w-sm text-sm text-muted-foreground">
                {description}
            </p>
            {action && <Button onClick={action.onClick}>{action.label}</Button>}
        </div>
    );
}
