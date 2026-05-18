const { createRxDatabase } = require('rxdb');
const { getRxStorageMemory } = require('rxdb/plugins/storage-memory');
const { wrappedValidateAjvStorage } = require('rxdb/plugins/validate-ajv');
const { createHash, randomUUID } = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const SNAPSHOT_FILE = path.join(__dirname, 'notifications.json');

const notificationSchema = {
  title: 'notification schema',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id:        { type: 'string', maxLength: 100 },
    patientId: { type: 'string', maxLength: 100 },
    message:   { type: 'string', maxLength: 500 },
    type:      { type: 'string', maxLength: 50 },
    dateEnvoi: { type: 'string', maxLength: 50 },
    lu:        { type: 'boolean' },
  },
  required: ['id', 'patientId', 'message', 'type'],
};

async function hashFunction(input) {
  if (!Buffer.isBuffer(input)) input = Buffer.from(String(input));
  return createHash('sha256').update(input).digest('hex');
}

async function loadSnapshot() {
  try {
    const raw = await fs.readFile(SNAPSHOT_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

async function persistNotifications(collection) {
  const docs = await collection.find().exec();
  await fs.writeFile(SNAPSHOT_FILE, JSON.stringify(docs.map(d => d.toJSON()), null, 2));
}

async function initDatabase() {
  const db = await createRxDatabase({
    name: 'clinique-notifications',
    storage: wrappedValidateAjvStorage({ storage: getRxStorageMemory() }),
    multiInstance: false,
    hashFunction,
  });

  await db.addCollections({ notifications: { schema: notificationSchema } });

  const initial = await loadSnapshot();
  if (initial.length > 0) await db.notifications.bulkInsert(initial);

  return {
    notifications: db.notifications,
    persistNotifications,
    createId: () => randomUUID(),
  };
}

module.exports = initDatabase();