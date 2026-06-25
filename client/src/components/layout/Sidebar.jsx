const modules = [
  'Connection Manager',
  'Database Explorer',
  'Data Viewer',
  'Schema Viewer',
  'Query Playground',
  'Import / Export'
];

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 rounded-lg border border-line bg-white p-4 shadow-panel lg:block">
      <nav aria-label="Application modules" className="space-y-1">
        {modules.map((moduleName) => (
          <div
            key={moduleName}
            className="rounded-md px-3 py-2 text-sm font-medium text-slate"
          >
            {moduleName}
          </div>
        ))}
      </nav>
    </aside>
  );
}
