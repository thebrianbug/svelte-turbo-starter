import { describe, it, expect } from 'vitest';
import { DatabaseError, DatabaseErrorCode, dbOperation } from './operations';

describe('DatabaseError', () => {
  it('should create error with correct properties', () => {
    const error = new DatabaseError('test message', DatabaseErrorCode.NOT_FOUND);
    expect(error.message).toBe('test message');
    expect(error.code).toBe(DatabaseErrorCode.NOT_FOUND);
    expect(error.name).toBe('DatabaseError');
  });

  it('should handle cause in constructor', () => {
    const cause = new Error('original error');
    const error = new DatabaseError('test message', DatabaseErrorCode.NOT_FOUND, cause);
    expect(error.cause).toBe(cause);
  });

  describe('fromError', () => {
    it('should return same error if already DatabaseError', () => {
      const original = new DatabaseError('test', DatabaseErrorCode.NOT_FOUND);
      const result = DatabaseError.fromError(original);
      expect(result).toBe(original);
    });

    it('should map PostgreSQL unique violation error', () => {
      const pgError = { code: '23505', message: 'duplicate key value' };
      const error = DatabaseError.fromError(pgError);
      expect(error.code).toBe(DatabaseErrorCode.DUPLICATE_KEY);
      expect(error.cause).toBe(pgError);
    });

    it('should map PostgreSQL foreign key violation error', () => {
      const pgError = { code: '23503', message: 'foreign key violation' };
      const error = DatabaseError.fromError(pgError);
      expect(error.code).toBe(DatabaseErrorCode.VALIDATION_ERROR);
      expect(error.cause).toBe(pgError);
    });

    it('should map PostgreSQL not null violation error', () => {
      const pgError = { code: '23502', message: 'not null violation' };
      const error = DatabaseError.fromError(pgError);
      expect(error.code).toBe(DatabaseErrorCode.VALIDATION_ERROR);
      expect(error.cause).toBe(pgError);
    });

    it('should map PostgreSQL connection errors', () => {
      const connectionErrors = ['08000', '08006'];
      for (const code of connectionErrors) {
        const pgError = { code, message: 'connection error' };
        const error = DatabaseError.fromError(pgError);
        expect(error.code).toBe(DatabaseErrorCode.CONNECTION_ERROR);
        expect(error.cause).toBe(pgError);
      }
    });

    it('should map unknown errors', () => {
      const unknownError = new Error('unknown');
      const error = DatabaseError.fromError(unknownError);
      expect(error.code).toBe(DatabaseErrorCode.UNKNOWN_ERROR);
      expect(error.cause).toBe(unknownError);
    });
  });
});

describe('dbOperation', () => {
  it('should return operation result on success', async () => {
    const result = await dbOperation(async () => 'success');
    expect(result).toBe('success');
  });

  it('should wrap errors in DatabaseError', async () => {
    const operation = async () => {
      throw new Error('test error');
    };

    await expect(dbOperation(operation)).rejects.toBeInstanceOf(DatabaseError);
    await expect(dbOperation(operation)).rejects.toHaveProperty('code', DatabaseErrorCode.UNKNOWN_ERROR);
  });

  it('should pass through DatabaseErrors unchanged', async () => {
    const originalError = new DatabaseError('test', DatabaseErrorCode.NOT_FOUND);
    const operation = async () => {
      throw originalError;
    };

    const error = await dbOperation(operation).catch(e => e);
    expect(error).toBe(originalError);
  });
});
