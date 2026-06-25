import { DatabaseProvider } from '../base/DatabaseProvider.js';
import { PROVIDER_TYPES } from '../../constants/providerTypes.js';

export class SQLiteProvider extends DatabaseProvider {
  constructor() {
    super({
      type: PROVIDER_TYPES.SQLITE,
      displayName: 'SQLite',
      capabilities: {
        fileBased: true,
        connectionString: false,
        schemas: true,
        collections: false,
        sql: true
      }
    });
  }
}
