"use client";

import type { EntityType } from "@argus/types";
import {
    AtSignIcon,
    BuildingIcon,
    FolderOpenIcon,
    GlobeIcon,
    MailIcon,
    NetworkIcon,
    PhoneIcon,
    SearchIcon,
    ServerIcon,
    UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SearchBar } from "@/components/search-bar";
import { useEntities } from "@/hooks/api/use-entities";
import { ENTITY_TYPE_LABELS, NODE_COLORS } from "@/lib/entity-colors";

const TYPE_ICONS: Record<string, typeof UserIcon> = {
    person: UserIcon,
    org: BuildingIcon,
    domain: GlobeIcon,
    email: MailIcon,
    handle: AtSignIcon,
    ip: ServerIcon,
    phone: PhoneIcon,
};

export default function DashboardPage() {
    const router = useRouter();
    const { data: entities } = useEntities();

    const typeCounts: Record<string, number> = {};
    if (entities) {
        for (const entity of entities) {
            typeCounts[entity.type] = (typeCounts[entity.type] || 0) + 1;
        }
    }

    return (
        <main className="min-h-screen p-8">
            {/* Hero */}
            <div className="mb-8">
                <h1 className="font-display text-6xl font-bold uppercase tracking-widest text-primary text-glow-cyan mb-2">
                    ARGUS
                </h1>
                <p className="mb-3 text-sm tracking-widest text-muted-foreground uppercase font-mono">
                    OSINT Aggregation Platform
                </p>
                {/* Decorative cyan gradient rule */}
                <div className="h-px w-64 bg-gradient-to-r from-primary via-primary/40 to-transparent" />
                {/* Status badge */}
                <div className="mt-3 inline-flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-neon-green animate-pulse-glow" />
                    <span className="text-xs uppercase tracking-widest text-neon-green animate-flicker">
                        STATUS: ACTIVE
                    </span>
                </div>
            </div>

            {/* Search */}
            <div className="mb-8 max-w-lg">
                <SearchBar
                    onSelect={(entity) => router.push(`/entities/${entity.id}`)}
                />
            </div>

            {/* Entity type stat cards */}
            {entities && entities.length > 0 && (
                <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                    {Object.entries(ENTITY_TYPE_LABELS).map(([type, label]) => {
                        const Icon = TYPE_ICONS[type] ?? GlobeIcon;
                        const count = typeCounts[type] ?? 0;
                        return (
                            <div
                                key={type}
                                className="rounded bg-card border p-3 text-center transition-all hover:glow-subtle hover:border-primary/40"
                                style={{
                                    borderColor: `${NODE_COLORS[type as EntityType]}33`,
                                }}
                            >
                                <Icon
                                    className="mx-auto mb-1 size-5"
                                    style={{
                                        color: NODE_COLORS[type as EntityType],
                                    }}
                                />
                                <div className="font-display text-2xl font-bold text-primary">
                                    {count}
                                </div>
                                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                                    {label}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Action cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <Link
                    href="/search"
                    className="block rounded bg-card border border-primary/20 p-6 transition-all hover:glow-cyan hover:border-primary/40"
                >
                    <SearchIcon className="mb-2 size-6 text-primary" />
                    <h2 className="mb-1 font-display text-lg font-semibold uppercase tracking-wide text-foreground">
                        Search
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Find entities across all sources
                    </p>
                </Link>

                <Link
                    href="/investigations"
                    className="block rounded bg-card border border-primary/20 p-6 transition-all hover:glow-cyan hover:border-primary/40"
                >
                    <FolderOpenIcon className="mb-2 size-6 text-primary" />
                    <h2 className="mb-1 font-display text-lg font-semibold uppercase tracking-wide text-foreground">
                        Investigations
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Manage and explore your investigations
                    </p>
                </Link>

                <Link
                    href="/graph"
                    className="block rounded bg-card border border-primary/20 p-6 transition-all hover:glow-cyan hover:border-primary/40"
                >
                    <NetworkIcon className="mb-2 size-6 text-primary" />
                    <h2 className="mb-1 font-display text-lg font-semibold uppercase tracking-wide text-foreground">
                        Entity Graph
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Visualize entity relationships
                    </p>
                </Link>
            </div>
        </main>
    );
}
