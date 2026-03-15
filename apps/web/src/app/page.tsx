export default function DashboardPage() {
    return (
        <main className="min-h-screen p-8">
            <h1 className="text-3xl font-bold mb-6">Argus</h1>
            <p className="text-lg text-gray-600 mb-8">
                OSINT Aggregation Platform
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <a
                    href="/investigations"
                    className="block p-6 rounded-lg border border-gray-200 hover:border-gray-400 transition-colors"
                >
                    <h2 className="text-xl font-semibold mb-2">
                        Investigations
                    </h2>
                    <p className="text-gray-500">
                        Manage and explore your investigations
                    </p>
                </a>

                <a
                    href="/graph"
                    className="block p-6 rounded-lg border border-gray-200 hover:border-gray-400 transition-colors"
                >
                    <h2 className="text-xl font-semibold mb-2">Entity Graph</h2>
                    <p className="text-gray-500">
                        Visualize entity relationships
                    </p>
                </a>
            </div>
        </main>
    );
}
