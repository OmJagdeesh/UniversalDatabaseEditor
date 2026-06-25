import { Sidebar } from '../components/layout/Sidebar.jsx';
import { TopBar } from '../components/layout/TopBar.jsx';
import { ConnectionsPlaceholder } from '../features/connections/pages/ConnectionsPlaceholder.jsx';
import { ExplorerPlaceholder } from '../features/explorer/pages/ExplorerPlaceholder.jsx';
import { QueryWorkspacePlaceholder } from '../features/query/pages/QueryWorkspacePlaceholder.jsx';

const architectureLayers = [
  'Routes receive HTTP requests',
  'Controllers translate request/response concerns',
  'Services own application workflows',
  'Providers isolate database-specific behavior'
];

export function AppShell() {
  return (
    <div className="min-h-screen bg-mist text-ink">
      <TopBar />
      <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Sidebar />
        <main className="flex-1 space-y-6">
          <section className="rounded-lg border border-line bg-white p-6 shadow-panel">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand">
              Architecture scaffold
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">
              Universal Database Editor
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate">
              This foundation sets up the application shell, backend layers, and provider
              registry before assignment features are implemented.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {architectureLayers.map((layer) => (
                <div key={layer} className="rounded-md border border-line bg-mist px-4 py-3">
                  <p className="text-sm font-medium text-ink">{layer}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            <ConnectionsPlaceholder />
            <ExplorerPlaceholder />
            <QueryWorkspacePlaceholder />
          </div>
        </main>
      </div>
    </div>
  );
}
