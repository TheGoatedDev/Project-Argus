import { Suspense } from "react";
import { GraphPageView } from "@/components/graph-page-view";
import { Skeleton } from "@/components/ui/skeleton";

export default function GraphPage() {
    return (
        <Suspense
            fallback={
                <main className="flex h-screen items-center justify-center">
                    <Skeleton className="h-64 w-64 rounded-lg" />
                </main>
            }
        >
            <GraphPageView />
        </Suspense>
    );
}
