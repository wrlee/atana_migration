import ScormApi from './scormapi/index.js'
import AtanaDb from './atanadb/index.js'

/**
 * Main code (suitable for Lambda implementation)
 */
const api = new ScormApi()  // Source API
const db = new AtanaDb()    // Storage interface object

// Process registration content, using the DB migration handler
await api.processRegistrations(db.migrateRegistrations)

await db.close();
