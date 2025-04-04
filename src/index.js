import ScormApi from './scormapi/index.js'
import AtanaDb from './atanadb/index.js'
import Migration from './migration.js'

/**
 * Main code (suitable for Lambda implementation)
 */
const api = new ScormApi()  // Source API
const db = new AtanaDb()    // Storage interface object
const migration = new Migration(api, db)

// Process registration content, using the DB migration handler
await migration.processRegistrations()

await db.close();
