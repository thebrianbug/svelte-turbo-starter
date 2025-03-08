/**
 * Re-export database testing utilities from DB package
 * This approach keeps all integration tests consistent
 */
export {
  cleanTable,
  cleanRelatedTables,
  teardown,
  TABLES
} from '@repo/db/tests/integration/test-utils/database';
