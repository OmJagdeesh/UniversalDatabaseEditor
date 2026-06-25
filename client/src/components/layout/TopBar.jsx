export function TopBar() {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div>
          <p className="text-lg font-semibold text-ink">Universal DB Editor</p>
          <p className="text-xs text-slate">React + Express provider architecture</p>
        </div>
        <div className="rounded-md border border-line px-3 py-1 text-sm font-medium text-slate">
          Scaffold
        </div>
      </div>
    </header>
  );
}
