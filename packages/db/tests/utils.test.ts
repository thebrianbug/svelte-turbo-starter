import { describe, it, expect } from 'vitest';
import { DatabaseError, dbOperation } from '../utils';

describe('Database Utilities', () => {
  describe('DatabaseError', () => {
    it('should create error with message only', () => {
      const error = new DatabaseError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('DatabaseError');
      expect(error.cause).toBeUndefined();
      expect(error.code).toBeUndefined();
    });

    it('should create error with cause', () => {
      const cause = new Error('Original error');
      const error = new DatabaseError('Test error', cause);
      expect(error.message).toBe('Test error');
      expect(error.cause).toBe(cause);
    });

    it('should create error with code', () => {
      const error = new DatabaseError('Test error', undefined, 'ERR_001');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('ERR_001');
    });
  });

  describe('dbOperation', () => {
    it('should return result for successful operation', async () => {
      const result = await dbOperation(async () => 'success');
      expect(result).toBe('success');
    });

    it('should wrap error in DatabaseError', async () => {
      const operation = async () => {
        throw new Error('Original error');
      };

      await expect(dbOperation(operation)).rejects.toThrow(DatabaseError);
      await expect(dbOperation(operation)).rejects.toThrow('Database operation failed');
    });

    it('should preserve original error as cause', async () => {
      const originalError = new Error('Original error');
      const operation = async () => {
        throw originalError;
      };

      try {
        await dbOperation(operation);
      } catch (error) {
        expect(error).toBeInstanceOf(DatabaseError);
        expect((error as DatabaseError).cause).toBe(originalError);
      }
    });

    it('should handle non-Error throws', async () => {
      const operation = async () => {
        throw 'string error'; // Throwing a string instead of Error
      };

      const error = await dbOperation(operation).catch(e => e);
      expect(error).toBeInstanceOf(DatabaseError);
      expect(error.cause).toBe('string error');
    });
  });
});
