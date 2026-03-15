import { GraphView } from "@/components/graph-view";

export default function GraphPage() {
    return (
        <main className="h-screen flex flex-col">
            <header className="p-4 border-b border-gray-200">
                <h1 className="text-xl font-semibold">Entity Graph</h1>
            </header>
            <div className="flex-1">
                <GraphView />
            </div>
        </main>
    );
}
