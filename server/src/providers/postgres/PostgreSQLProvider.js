import { DatabaseProvider } from '../base/DatabaseProvider.js';
import { PROVIDER_TYPES } from '../../constants/providerTypes.js';

export class PostgreSQLProvider extends DatabaseProvider {
  constructor() {
    super({
      type: PROVIDER_TYPES.POSTGRESQL,
      displayName: 'PostgreSQL',
      capabilities: {
        fileBased: false,
        connectionString: true,
        schemas: true,
        collections: false,
        sql: true
      }
    });
  }
}
