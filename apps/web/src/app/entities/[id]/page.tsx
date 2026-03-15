import { EntityDetail } from "@/components/entity-detail";

export default async function EntityDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return (
        <main className="min-h-screen p-8">
            <EntityDetail id={id} />
        </main>
    );
}
