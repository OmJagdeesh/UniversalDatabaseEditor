export function TopBar({ activeConnection, onToggleSidebar }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={onToggleSidebar}
            className="rounded-md p-1.5 text-slate hover:bg-mist hover:text-ink transition-colors lg:hidden"
            aria-label="Toggle sidebar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink leading-tight">Universal DB Editor</p>
              <p className="text-[10px] text-slate leading-tight">SQLite · PostgreSQL · MongoDB</p>
            </div>
          </div>
        </div>

        {/* Connection status indicator */}
        <div className="flex items-center gap-3">
          {activeConnection ? (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span className="text-xs font-medium text-green-700 hidden sm:inline">
                {activeConnection.name}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-line bg-mist px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-gray-300" />
              <span className="text-xs font-medium text-slate hidden sm:inline">No connection</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
