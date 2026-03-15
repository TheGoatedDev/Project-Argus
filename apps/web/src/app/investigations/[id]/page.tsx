import { InvestigationDetail } from "@/components/investigation-detail";

export default async function InvestigationDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return (
        <main className="min-h-screen p-8">
            <InvestigationDetail id={id} />
        </main>
    );
}
