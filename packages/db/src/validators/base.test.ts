import { describe, it, expect } from 'vitest';
import { Validator, ValidationError } from './base';

describe('Generic Validator Class', () => {
  interface TestType {
    field1: string;
    field2: number;
    field3?: boolean;
  }

  const testValidator = new Validator<TestType>({
    field1: {
      validate: (value: unknown) => {
        if (typeof value !== 'string') {
          throw new ValidationError('field1 must be a string');
        }
      },
      transform: (value: string) => value.toUpperCase(),
      required: true
    },
    field2: {
      validate: (value: unknown) => {
        if (typeof value !== 'number' || value < 0) {
          throw new ValidationError('field2 must be a positive number');
        }
      },
      required: true
    }
  });

  it('should validate and transform valid data', () => {
    const result = testValidator.validate({
      field1: 'test',
      field2: 42
    });

    expect(result).toEqual({
      field1: 'TEST',
      field2: 42
    });
  });

  it('should throw error for missing required fields', () => {
    expect(() =>
      testValidator.validate(
        {
          field1: 'test'
        },
        { requireAll: true }
      )
    ).toThrow('Missing required field: field2');
  });

  it('should allow optional fields', () => {
    const result = testValidator.validate({
      field1: 'test',
      field2: 42,
      field3: true
    });

    expect(result).toEqual({
      field1: 'TEST',
      field2: 42,
      field3: true
    });
  });

  it('should validate multiple items', () => {
    const items = [
      { field1: 'test1', field2: 1 },
      { field1: 'test2', field2: 2 }
    ];

    const results = testValidator.validateMany(items, { requireAll: true });
    expect(results).toEqual([
      { field1: 'TEST1', field2: 1 },
      { field1: 'TEST2', field2: 2 }
    ]);
  });

  it('should throw error for invalid data', () => {
    expect(() =>
      testValidator.validate({
        field1: 'test',
        field2: -1
      })
    ).toThrow('field2 must be a positive number');
  });
});
