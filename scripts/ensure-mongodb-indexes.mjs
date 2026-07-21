import { ensureIndexes, withDb } from './mongodb-utils.mjs'

await withDb(async (db) => {
  await ensureIndexes(db)
  console.log('MongoDB indexes are ready.')
})
