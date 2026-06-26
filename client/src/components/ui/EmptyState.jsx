export function EmptyState({ icon, title, description, children }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="mb-4 rounded-full bg-mist p-4 text-slate">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-slate">{description}</p>
      )}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
