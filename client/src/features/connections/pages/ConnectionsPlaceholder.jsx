import { PROVIDER_TYPES } from '../../../shared/constants/providerTypes.js';

const providers = [
  { type: PROVIDER_TYPES.SQLITE, label: 'SQLite' },
  { type: PROVIDER_TYPES.POSTGRESQL, label: 'PostgreSQL' },
  { type: PROVIDER_TYPES.MONGODB, label: 'MongoDB' }
];

export function ConnectionsPlaceholder() {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-panel">
      <h2 className="text-lg font-semibold text-ink">Connection Layer</h2>
      <p className="mt-2 text-sm leading-6 text-slate">
        Provider types are registered up front; connection workflows will be added later.
      </p>
      <div className="mt-4 space-y-2">
        {providers.map((provider) => (
          <div key={provider.type} className="rounded-md bg-mist px-3 py-2 text-sm text-ink">
            {provider.label}
          </div>
        ))}
      </div>
    </section>
  );
}
