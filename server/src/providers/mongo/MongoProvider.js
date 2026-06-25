import { DatabaseProvider } from '../base/DatabaseProvider.js';
import { PROVIDER_TYPES } from '../../constants/providerTypes.js';

export class MongoProvider extends DatabaseProvider {
  constructor() {
    super({
      type: PROVIDER_TYPES.MONGODB,
      displayName: 'MongoDB',
      capabilities: {
        fileBased: false,
        connectionString: true,
        schemas: false,
        collections: true,
        sql: false
      }
    });
  }
}
